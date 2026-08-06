import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from '../auth.constants';
import type { JwtRefreshPayload } from '../types/jwt-payload.type';

export interface RefreshTokenRequestUser extends JwtRefreshPayload {
  refreshToken: string;
}

const cookieExtractor = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[REFRESH_TOKEN_COOKIE] ?? null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): RefreshTokenRequestUser {
    const refreshToken = cookieExtractor(req);
    return { ...payload, refreshToken: refreshToken as string };
  }
}
