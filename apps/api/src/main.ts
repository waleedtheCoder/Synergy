import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  app.use(helmet());
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
