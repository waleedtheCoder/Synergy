import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * Verifies Cloudflare Turnstile tokens for register/login/forgot-password.
 * No secret key configured (e.g. local dev without a Cloudflare account set
 * up) means verification is skipped entirely, matching how other optional
 * third-party integrations in this app degrade (RESEND_API_KEY, Google
 * OAuth) rather than hard-failing every environment that hasn't configured
 * a key.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private warnedMissingSecret = false;

  constructor(private readonly config: ConfigService) {}

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    // Automated tests can't solve a real Turnstile challenge, so this is
    // skipped in the test environment the same way Swagger docs and
    // production-only headers are gated on NODE_ENV elsewhere in this app —
    // not a security-relevant exception, since NODE_ENV isn't attacker-
    // controlled in a real deployment.
    if (this.config.get('NODE_ENV') === 'test') {
      return;
    }

    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');

    if (!secret) {
      if (!this.warnedMissingSecret) {
        this.logger.warn(
          'TURNSTILE_SECRET_KEY is not set — CAPTCHA verification is disabled',
        );
        this.warnedMissingSecret = true;
      }
      return;
    }

    if (!token) {
      throw new BadRequestException('CAPTCHA verification is required');
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    const result = (await response.json()) as SiteverifyResponse;

    if (!result.success) {
      throw new BadRequestException('CAPTCHA verification failed');
    }
  }
}
