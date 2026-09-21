import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import * as QRCode from 'qrcode';
import { AuthService } from './auth.service';
import { TurnstileService } from './turnstile.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Confirm2faDto } from './dto/confirm-2fa.dto';
import { Disable2faDto } from './dto/disable-2fa.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { parseDurationMs } from '../../common/utils/duration.util';
import type { AuthenticatedUser } from './types/authenticated-user.type';
import type { RefreshTokenRequestUser } from './strategies/jwt-refresh.strategy';
import type { GoogleProfilePayload } from './strategies/google.strategy';
import type { TokenPair } from './types/token-pair.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly turnstileService: TurnstileService,
    private readonly config: ConfigService,
  ) {}

  private requestMeta(req: Request) {
    return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: parseDurationMs(
        this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      ),
    });
  }

  private respondWithTokens(
    res: Response,
    result: { user: AuthenticatedUser } & TokenPair,
  ) {
    this.setRefreshCookie(res, result.refreshToken);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Create a client or professional account' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.turnstileService.verify(dto.turnstileToken, req.ip);
    const result = await this.authService.register(dto, this.requestMeta(req));
    return this.respondWithTokens(res, result);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.turnstileService.verify(dto.turnstileToken, req.ip);
    const user = await this.authService.validateLocalUser(
      dto.email,
      dto.password,
    );
    const result = await this.authService.login(
      user,
      this.requestMeta(req),
      dto.otpCode,
    );
    return this.respondWithTokens(res, result);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { refreshToken } = req.user as RefreshTokenRequestUser;
    const result = await this.authService.refreshTokens(
      refreshToken,
      this.requestMeta(req),
    );
    return this.respondWithTokens(res, result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(@Req() req: Request, @Res() res: Response) {
    const raw = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];
    await this.authService.logout(raw);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/v1/auth' });
    return res.status(HttpStatus.OK).json({ success: true, data: null });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: user };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email address using a token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { success: true, data: null };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    await this.turnstileService.verify(dto.turnstileToken, req.ip);
    await this.authService.forgotPassword(dto.email);
    return { success: true, data: null };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a password using a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { success: true, data: null };
  }

  // ── Two-factor authentication ───────────────────────────────────────

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start TOTP two-factor setup and get a QR code' })
  async setupTwoFactor(@CurrentUser() user: AuthenticatedUser) {
    const { otpauthUrl } = await this.authService.setupTwoFactor(
      user.id,
      user.email,
    );
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { success: true, data: { otpauthUrl, qrCodeDataUrl } };
  }

  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm TOTP setup and enable two-factor auth' })
  async confirmTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Confirm2faDto,
  ) {
    const result = await this.authService.confirmTwoFactor(user.id, dto.code);
    return { success: true, data: result };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  async disableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Disable2faDto,
  ) {
    await this.authService.disableTwoFactor(user.id, dto.password, dto.code);
    return { success: true, data: null };
  }

  // ── Active sessions ──────────────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({
    summary: 'List active sessions (refresh tokens) for this account',
  })
  async listSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const raw = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];
    const sessions = await this.authService.listSessions(user.id, raw);
    return { success: true, data: sessions };
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a single session by id' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!id) {
      throw new BadRequestException('Session id is required');
    }
    await this.authService.revokeSession(user.id, id);
    return { success: true, data: null };
  }

  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke every session except the current one' })
  async revokeAllSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const raw = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];
    await this.authService.revokeAllOtherSessions(user.id, raw);
    return { success: true, data: null };
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth flow' })
  googleAuth() {
    // Redirect handled by GoogleAuthGuard/passport-google-oauth20.
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfilePayload;
    const user = await this.authService.validateGoogleUser(profile);
    const result = await this.authService.login(user, this.requestMeta(req));

    this.setRefreshCookie(res, result.refreshToken);

    const webUrl = this.config.getOrThrow<string>('WEB_URL');
    const redirectUrl = new URL('/auth/callback', webUrl);
    redirectUrl.searchParams.set('accessToken', result.accessToken);
    return res.redirect(redirectUrl.toString());
  }
}
