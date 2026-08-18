import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';
import type { Request } from 'express';
import { REGISTERABLE_ROLES, type RegisterableRole } from '../dto/register.dto';

export interface GoogleProfilePayload {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  intendedRole?: RegisterableRole;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret:
        config.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      done(new Error('Google account has no email address'), undefined);
      return;
    }

    const stateRole = req.query.state as string | undefined;
    const intendedRole = REGISTERABLE_ROLES.includes(
      stateRole as RegisterableRole,
    )
      ? (stateRole as RegisterableRole)
      : undefined;

    const user: GoogleProfilePayload = {
      googleId: profile.id,
      email,
      firstName: profile.name?.givenName ?? profile.displayName ?? 'Synergi',
      lastName: profile.name?.familyName ?? 'User',
      avatarUrl: profile.photos?.[0]?.value,
      intendedRole,
    };

    done(null, user);
  }
}
