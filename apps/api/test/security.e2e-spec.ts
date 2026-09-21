import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// Minimal security regression suite: proves the auth guard, role guard,
// per-resource ownership scoping, and login rate limiting actually hold at
// the HTTP boundary, rather than trusting that the code "looks right".
describe('Security regressions (e2e)', () => {
  let app: INestApplication<App>;
  const runId = Date.now();
  const clientA = {
    email: `sec-test-a-${runId}@synergi.dev`,
    password: 'SecTestPass123!',
  };
  const clientB = {
    email: `sec-test-b-${runId}@synergi.dev`,
    password: 'SecTestPass123!',
  };
  let tokenA: string;
  let tokenB: string;
  let ownedRequestId: string;

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

    const server = app.getHttpServer();

    const registerA = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...clientA,
        firstName: 'Sec',
        lastName: 'TestA',
        role: 'CLIENT',
      });
    tokenA = (registerA.body as ApiEnvelope<{ accessToken: string }>).data
      .accessToken;

    const registerB = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...clientB,
        firstName: 'Sec',
        lastName: 'TestB',
        role: 'CLIENT',
      });
    tokenB = (registerB.body as ApiEnvelope<{ accessToken: string }>).data
      .accessToken;

    const created = await request(server)
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Security regression test request',
        description: 'Created by the automated security regression suite.',
      });
    ownedRequestId = (created.body as ApiEnvelope<{ id: string }>).data.id;
  });

  afterAll(async () => {
    const server = app.getHttpServer();
    await request(server)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ password: clientA.password });
    await request(server)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ password: clientB.password });
    await app.close();
  });

  it('rejects a protected route with no token (401)', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('rejects an admin-only route for a non-admin user (403)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);
  });

  it('lets the owner read their own resource (200, positive control)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/project-requests/${ownedRequestId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it('blocks IDOR: a different user cannot read the resource by id (404)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/project-requests/${ownedRequestId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('rate-limits repeated login attempts (429)', async () => {
    const server = app.getHttpServer();
    const attempts = Array.from({ length: 6 }, (_, i) =>
      request(server)
        .post('/api/v1/auth/login')
        .send({ email: clientA.email, password: `wrong-${i}` }),
    );
    const results = await Promise.all(attempts);
    expect(results.some((r) => r.status === 429)).toBe(true);
  });
});
