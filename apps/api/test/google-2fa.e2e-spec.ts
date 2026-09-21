import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { generate as generateTotp } from 'otplib';
import { AppModule } from './../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// Regression test for the Google-OAuth + 2FA interaction: a 2FA-enabled
// account signing in via Google can't be prompted for its code inline (it's
// a full-page redirect), so the callback hands back a short-lived
// "pending2fa" token instead of failing closed with a bare 401. This proves
// that exchange actually works, without needing to drive a real Google
// consent screen — signPendingTwoFactorToken() is called directly, exactly
// as auth.controller.ts's googleCallback does internally.
describe('Google OAuth + 2FA completion (e2e)', () => {
  let app: INestApplication<App>;
  let authService: AuthService;
  const runId = Date.now();
  const client = {
    email: `sec-2fa-${runId}@synergi.dev`,
    password: 'SecTestPass123!',
  };
  let accessToken: string;
  let userId: string;
  let totpSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    authService = app.get(AuthService);

    const server = app.getHttpServer();

    const registered = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...client,
        firstName: 'Sec',
        lastName: 'TwoFactor',
        role: 'CLIENT',
      });
    const session = (
      registered.body as ApiEnvelope<{
        user: { id: string };
        accessToken: string;
      }>
    ).data;
    accessToken = session.accessToken;
    userId = session.user.id;

    const setup = await request(server)
      .post('/api/v1/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    const { otpauthUrl } = (setup.body as ApiEnvelope<{ otpauthUrl: string }>)
      .data;
    totpSecret = new URL(otpauthUrl).searchParams.get('secret') ?? '';

    const firstCode = await generateTotp({ secret: totpSecret });
    await request(server)
      .post('/api/v1/auth/2fa/confirm')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: firstCode, password: client.password })
      .expect(200);
  });

  afterAll(async () => {
    const server = app.getHttpServer();
    await request(server)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: client.password });
    await app.close();
  });

  it('rejects a garbage pending token (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/google/complete-2fa')
      .send({ pendingToken: 'not-a-real-token', otpCode: '000000' })
      .expect(401);
  });

  it('rejects a real pending token with the wrong code (401)', async () => {
    const pendingToken = authService.signPendingTwoFactorToken(userId);
    await request(app.getHttpServer())
      .post('/api/v1/auth/google/complete-2fa')
      .send({ pendingToken, otpCode: '000000' })
      .expect(401);
  });

  it('exchanges a valid pending token + code for a real session (200)', async () => {
    const pendingToken = authService.signPendingTwoFactorToken(userId);
    const code = await generateTotp({ secret: totpSecret });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/google/complete-2fa')
      .send({ pendingToken, otpCode: code })
      .expect(200);
    const body = res.body as ApiEnvelope<{ accessToken: string }>;
    expect(body.success).toBe(true);
    expect(typeof body.data.accessToken).toBe('string');
  });

  it('rejects an access token signed for a different purpose', async () => {
    // Sanity check for the core security property: a real access token
    // (JWT_ACCESS_SECRET) must NOT be accepted as a pending-2FA token
    // (ENCRYPTION_KEY) — otherwise it wouldn't stop a stolen access token
    // from being replayed here.
    await request(app.getHttpServer())
      .post('/api/v1/auth/google/complete-2fa')
      .send({ pendingToken: accessToken, otpCode: '000000' })
      .expect(401);
  });

  // Confirming 2FA enrollment requires the account password, same as
  // disabling it does — otherwise a hijacked short-lived access token could
  // silently enroll 2FA with an attacker's own secret. Uses its own
  // throwaway user rather than the shared one above, which is already past
  // the confirm step by the time these run.
  it('requires the correct password to confirm 2FA enrollment', async () => {
    const server = app.getHttpServer();
    const stepUpClient = {
      email: `sec-2fa-stepup-${runId}@synergi.dev`,
      password: 'SecTestPass123!',
    };

    const registered = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...stepUpClient,
        firstName: 'Sec',
        lastName: 'StepUp',
        role: 'CLIENT',
      });
    const stepUpToken = (
      registered.body as ApiEnvelope<{ accessToken: string }>
    ).data.accessToken;

    const setup = await request(server)
      .post('/api/v1/auth/2fa/setup')
      .set('Authorization', `Bearer ${stepUpToken}`)
      .send();
    const { otpauthUrl } = (setup.body as ApiEnvelope<{ otpauthUrl: string }>)
      .data;
    const secret = new URL(otpauthUrl).searchParams.get('secret') ?? '';

    await request(server)
      .post('/api/v1/auth/2fa/confirm')
      .set('Authorization', `Bearer ${stepUpToken}`)
      .send({ code: await generateTotp({ secret }) })
      .expect(401);

    await request(server)
      .post('/api/v1/auth/2fa/confirm')
      .set('Authorization', `Bearer ${stepUpToken}`)
      .send({
        code: await generateTotp({ secret }),
        password: 'wrong-password',
      })
      .expect(401);

    await request(server)
      .post('/api/v1/auth/2fa/confirm')
      .set('Authorization', `Bearer ${stepUpToken}`)
      .send({
        code: await generateTotp({ secret }),
        password: stepUpClient.password,
      })
      .expect(200);

    await request(server)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${stepUpToken}`)
      .send({ password: stepUpClient.password });
  });
});
