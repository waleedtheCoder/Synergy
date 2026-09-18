import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MeilisearchService } from './meilisearch.service';

@Module({
  imports: [AnalyticsModule],
  controllers: [SearchController],
  providers: [MeilisearchService, SearchService],
  exports: [SearchService],
})
export class SearchModule {}
