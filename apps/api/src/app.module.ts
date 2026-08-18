import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProjectRequestsModule } from './modules/project-requests/project-requests.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { UsersModule } from './modules/users/users.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ProfessionalProfileModule } from './modules/professional-profile/professional-profile.module';
import { ServicesModule } from './modules/services/services.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { PortfolioProjectsModule } from './modules/portfolio-projects/portfolio-projects.module';
import { ChatsModule } from './modules/chats/chats.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { FeedModule } from './modules/feed/feed.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { SearchModule } from './modules/search/search.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60_000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    CategoriesModule,
    ProjectRequestsModule,
    NotificationsModule,
    FavoritesModule,
    UsersModule,
    SkillsModule,
    ProfessionalProfileModule,
    ServicesModule,
    CertificatesModule,
    PortfolioProjectsModule,
    ChatsModule,
    QuotationsModule,
    MeetingsModule,
    FeedModule,
    ProfessionalsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
