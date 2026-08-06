import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
  @Post('register')
  @ApiOperation({ summary: 'Create a client or professional account' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
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
    const user = await this.authService.validateLocalUser(
      dto.email,
      dto.password,
    );
    const result = await this.authService.login(user, this.requestMeta(req));
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
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { success: true, data: null };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a password using a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
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
