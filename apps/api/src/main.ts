import './instrument';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const isProduction = config.get('NODE_ENV') === 'production';

  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  const supabaseUrl = config.get<string>('SUPABASE_URL');
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : undefined;
  const sentryDsn = config.get<string>('SENTRY_DSN');
  const sentryIngestOrigin = sentryDsn
    ? `https://${new URL(sentryDsn).host}`
    : undefined;

  app.use(
    helmet({
      // Swagger UI (dev-only, see below) needs inline scripts/styles that a
      // locked-down CSP would break — only enforce the tight policy in prod,
      // where the docs route is never mounted anyway.
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', supabaseOrigin].filter(
                (v): v is string => Boolean(v),
              ),
              connectSrc: ["'self'", supabaseOrigin, sentryIngestOrigin].filter(
                (v): v is string => Boolean(v),
              ),
              scriptSrc: ["'self'"],
              styleSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
            },
          }
        : false,
      hsts: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  // Helmet has no built-in Permissions-Policy helper — this app uses none of
  // these browser features, so deny them all explicitly.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    next();
  });
  app.use(cookieParser(config.get<string>('COOKIE_SECRET')));

  app.enableCors({
    origin: config.getOrThrow<string>('WEB_URL'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Synergi API')
      .setDescription(
        'Construction marketplace connecting clients with professionals',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  Logger.log(
    `🚀 Synergi API running on http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
}

void bootstrap();
