import { randomUUID } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { generateRawToken, hashToken } from '../../common/utils/crypto.util';
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
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
    });

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

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.toAuthenticatedUser(user);
  }

  async login(
    user: AuthenticatedUser,
    meta: RequestMeta,
  ): Promise<{ user: AuthenticatedUser } & TokenPair> {
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
    return { user, ...tokens };
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

        user = await this.prisma.user.create({
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
        });
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

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
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
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
    };
  }
}
