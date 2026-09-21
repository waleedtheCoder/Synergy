import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify as verifyOtp } from 'otplib';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SearchService } from '../search/search.service';
import {
  decryptField,
  encryptField,
  generateRawToken,
  hashToken,
} from '../../common/utils/crypto.util';
import { uniqueSlug } from '../../common/utils/slug.util';
import {
  AuthProvider,
  Role,
  UserStatus,
  VerificationTokenType,
} from '../../../generated/prisma';
import {
  EMAIL_VERIFICATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
} from './auth.constants';
import type { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './types/authenticated-user.type';
import type { RequestMeta, TokenPair } from './types/token-pair.type';
import type { GoogleProfilePayload } from './strategies/google.strategy';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const RECOVERY_CODE_COUNT = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly searchService: SearchService,
  ) {}

  // ── Registration ─────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
    meta: RequestMeta,
  ): Promise<{ user: AuthenticatedUser } & TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: UserStatus.PENDING,
        authProvider: AuthProvider.LOCAL,
        ...(dto.role === Role.CLIENT
          ? { clientProfile: { create: {} } }
          : {
              professionalProfile: {
                create: {
                  slug: uniqueSlug(`${dto.firstName}-${dto.lastName}`),
                },
              },
            }),
      },
      include: { professionalProfile: { select: { id: true } } },
    });

    if (user.professionalProfile) {
      void this.searchService.indexProfessionalById(
        user.professionalProfile.id,
      );
    }

    await this.issueEmailVerification(user.id, user.email, user.firstName);

    const tokens = await this.issueTokenPair(
      user.id,
      user.email,
      user.role,
      meta,
    );

    return { user: this.toAuthenticatedUser(user), ...tokens };
  }

  // ── Login ────────────────────────────────────────────────────────────

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('This account is no longer active');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Too many failed login attempts. Please try again in 15 minutes.',
      );
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      await this.registerFailedLoginAttempt(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    return this.toAuthenticatedUser(user);
  }

  private async registerFailedLoginAttempt(
    userId: string,
    currentAttempts: number,
  ): Promise<void> {
    const attempts = currentAttempts + 1;
    const lockingOut = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;

    await this.prisma.user.update({
      where: { id: userId },
      data: lockingOut
        ? {
            failedLoginAttempts: 0,
            lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
          }
        : { failedLoginAttempts: attempts },
    });
  }

  async login(
    user: AuthenticatedUser,
    meta: RequestMeta,
    otpCode?: string,
  ): Promise<{ user: AuthenticatedUser } & TokenPair> {
    if (user.twoFactorEnabled) {
      await this.verifyTwoFactorOrThrow(user.id, otpCode);
    }

    const seenBefore = meta.userAgent
      ? await this.prisma.refreshToken.findFirst({
          where: {
            userId: user.id,
            userAgent: meta.userAgent,
            ipAddress: meta.ipAddress,
          },
        })
      : null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(
      user.id,
      user.email,
      user.role,
      meta,
    );

    if (!seenBefore) {
      void this.mail
        .sendNewLoginAlertEmail(
          user.email,
          user.firstName,
          meta.userAgent,
          meta.ipAddress,
        )
        .catch((error: unknown) =>
          this.logger.error('Failed to send new-login alert', error),
        );
    }

    return { user, ...tokens };
  }

  // Google OAuth is a full-page redirect, so a 2FA-enabled account can't be
  // prompted for its code inline the way password login can — the callback
  // can't just call login() with no otpCode, since that fails closed (401)
  // and locks these users out entirely. Instead it hands back a short-lived,
  // single-purpose token the web app exchanges for real tokens once the user
  // enters their code, via completeGoogleTwoFactor() below.
  //
  // Signed with ENCRYPTION_KEY, not JWT_ACCESS_SECRET — critically, this
  // means JwtStrategy (which only trusts JWT_ACCESS_SECRET) can never accept
  // this token as a bearer credential, so it can't be used to skip 2FA even
  // if it leaked.
  signPendingTwoFactorToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId, purpose: 'pending-2fa' },
      { secret: this.getEncryptionKey(), expiresIn: '5m' },
    );
  }

  async completeGoogleTwoFactor(
    pendingToken: string,
    otpCode: string,
    meta: RequestMeta,
  ): Promise<{ user: AuthenticatedUser } & TokenPair> {
    let payload: { sub: string; purpose: string };
    try {
      payload = await this.jwt.verifyAsync(pendingToken, {
        secret: this.getEncryptionKey(),
      });
    } catch {
      throw new UnauthorizedException(
        'This sign-in has expired — please try again',
      );
    }

    if (payload.purpose !== 'pending-2fa') {
      throw new UnauthorizedException('Invalid sign-in token');
    }

    const record = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (
      !record ||
      record.deletedAt ||
      record.status === UserStatus.SUSPENDED ||
      record.status === UserStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('Account is not accessible');
    }

    return this.login(this.toAuthenticatedUser(record), meta, otpCode);
  }

  // ── Two-factor authentication (TOTP) ────────────────────────────────

  private getEncryptionKey(): string {
    return this.config.getOrThrow<string>('ENCRYPTION_KEY');
  }

  // otplib throws on malformed input (e.g. a 10-char recovery code) instead
  // of returning { valid: false }, so callers wrap it to get a clean bool.
  private async tryVerifyTotp(secret: string, token: string): Promise<boolean> {
    try {
      const result = await verifyOtp({ secret, token });
      return result.valid;
    } catch {
      return false;
    }
  }

  private async verifyTwoFactorOrThrow(
    userId: string,
    code: string | undefined,
  ): Promise<void> {
    if (!code) {
      throw new UnauthorizedException('Two-factor code required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new UnauthorizedException(
        'Two-factor authentication is not configured',
      );
    }

    const secret = decryptField(user.twoFactorSecret, this.getEncryptionKey());
    const isValidTotp = await this.tryVerifyTotp(secret, code);
    if (isValidTotp) {
      return;
    }

    const hashedInput = hashToken(code.trim().toUpperCase());
    const matchIndex = user.twoFactorRecoveryCodes.indexOf(hashedInput);
    if (matchIndex === -1) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    const remaining = [...user.twoFactorRecoveryCodes];
    remaining.splice(matchIndex, 1);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorRecoveryCodes: remaining },
    });
  }

  async setupTwoFactor(
    userId: string,
    email: string,
  ): Promise<{ secret: string; otpauthUrl: string }> {
    const secret = generateSecret();
    const encrypted = encryptField(secret, this.getEncryptionKey());

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encrypted, twoFactorEnabled: false },
    });

    const otpauthUrl = generateURI({
      issuer: 'Synergi',
      label: email,
      secret,
    });

    return { secret, otpauthUrl };
  }

  async confirmTwoFactor(
    userId: string,
    code: string,
  ): Promise<{ recoveryCodes: string[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException(
        'Start two-factor setup before confirming it',
      );
    }

    const secret = decryptField(user.twoFactorSecret, this.getEncryptionKey());
    if (!(await this.tryVerifyTotp(secret, code))) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
      generateRawToken().slice(0, 10).toUpperCase(),
    );
    const hashedCodes = recoveryCodes.map((rc) => hashToken(rc));

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: hashedCodes,
      },
    });

    return { recoveryCodes };
  }

  async disableTwoFactor(
    userId: string,
    password: string,
    code: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.verifyTwoFactorOrThrow(userId, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: [],
      },
    });
  }

  // ── Active sessions ──────────────────────────────────────────────────

  async listSessions(userId: string, currentRawToken: string | undefined) {
    const currentHash = currentRawToken ? hashToken(currentRawToken) : null;
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
        tokenHash: true,
      },
    });

    return sessions.map(({ tokenHash, ...session }) => ({
      ...session,
      isCurrent: tokenHash === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllOtherSessions(
    userId: string,
    currentRawToken: string | undefined,
  ): Promise<void> {
    const currentHash = currentRawToken ? hashToken(currentRawToken) : null;
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentHash ? { tokenHash: { not: currentHash } } : {}),
      },
      data: { revokedAt: new Date() },
    });
  }

  // ── Google OAuth ─────────────────────────────────────────────────────

  async validateGoogleUser(
    profile: GoogleProfilePayload,
  ): Promise<AuthenticatedUser> {
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { googleId: profile.googleId },
        });
      } else {
        const role: Role = profile.intendedRole ?? Role.CLIENT;

        const created = await this.prisma.user.create({
          data: {
            email: profile.email,
            googleId: profile.googleId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatarUrl: profile.avatarUrl,
            role,
            status: UserStatus.ACTIVE,
            authProvider: AuthProvider.GOOGLE,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            ...(role === Role.CLIENT
              ? { clientProfile: { create: {} } }
              : {
                  professionalProfile: {
                    create: {
                      slug: uniqueSlug(
                        `${profile.firstName}-${profile.lastName}`,
                      ),
                    },
                  },
                }),
          },
          include: { professionalProfile: { select: { id: true } } },
        });
        user = created;

        if (created.professionalProfile) {
          void this.searchService.indexProfessionalById(
            created.professionalProfile.id,
          );
        }
      }
    }

    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('This account is no longer active');
    }

    return this.toAuthenticatedUser(user);
  }

  // ── Token refresh & logout ──────────────────────────────────────────

  async refreshTokens(
    rawRefreshToken: string,
    meta: RequestMeta,
  ): Promise<{ user: AuthenticatedUser } & TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired, please sign in again');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (
      !user ||
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('Account is not accessible');
    }

    const tokens = await this.issueTokenPair(
      user.id,
      user.email,
      user.role,
      meta,
    );

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedByToken: hashToken(tokens.refreshToken),
      },
    });

    return { user: this.toAuthenticatedUser(user), ...tokens };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Email verification ──────────────────────────────────────────────

  private async issueEmailVerification(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    const rawToken = generateRawToken();

    await this.prisma.verificationToken.create({
      data: {
        userId,
        type: VerificationTokenType.EMAIL_VERIFY,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });

    const verifyUrl = `${this.config.getOrThrow<string>('WEB_URL')}/verify-email?token=${rawToken}`;
    await this.mail.sendVerificationEmail(email, firstName, verifyUrl);
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (
      !record ||
      record.type !== VerificationTokenType.EMAIL_VERIFY ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'This verification link is invalid or has expired',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  // ── Password reset ──────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Do not reveal account existence.
      return;
    }

    const rawToken = generateRawToken();

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: VerificationTokenType.PASSWORD_RESET,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    const resetUrl = `${this.config.getOrThrow<string>('WEB_URL')}/reset-password?token=${rawToken}`;
    await this.mail.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetUrl,
    );
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (
      !record ||
      record.type !== VerificationTokenType.PASSWORD_RESET ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'This reset link is invalid or has expired',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    void this.mail
      .sendPasswordChangedEmail(user.email, user.firstName)
      .catch((error: unknown) =>
        this.logger.error('Failed to send password-changed alert', error),
      );
  }

  // ── Shared helpers ───────────────────────────────────────────────────

  private async issueTokenPair(
    userId: string,
    email: string,
    role: Role,
    meta: RequestMeta,
  ): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: userId, email, role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ) as jwt.SignOptions['expiresIn'],
      },
    );

    const jti = randomUUID();
    const refreshExpiresIn = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, jti },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn'],
      },
    );

    const decoded = this.jwt.decode<{ exp: number }>(refreshToken);
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    twoFactorEnabled?: boolean;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
    };
  }
}
