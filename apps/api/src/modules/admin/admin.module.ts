import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminVerificationController } from './admin-verification.controller';
import { AdminVerificationService } from './admin-verification.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminSkillsController } from './admin-skills.controller';
import { AdminSkillsService } from './admin-skills.service';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminDisputesService } from './admin-disputes.service';
import { AdminCampaignsController } from './admin-campaigns.controller';
import { AdminCampaignsService } from './admin-campaigns.service';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminAnalyticsController } from './admin-analytics.controller';

@Module({
  imports: [SearchModule, AnalyticsModule],
  controllers: [
    AdminStatsController,
    AdminUsersController,
    AdminVerificationController,
    AdminCategoriesController,
    AdminSkillsController,
    AdminReportsController,
    AdminDisputesController,
    AdminCampaignsController,
    AdminPaymentsController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminStatsService,
    AdminUsersService,
    AdminVerificationService,
    AdminCategoriesService,
    AdminSkillsService,
    AdminReportsService,
    AdminDisputesService,
    AdminCampaignsService,
    AdminPaymentsService,
  ],
})
export class AdminModule {}
