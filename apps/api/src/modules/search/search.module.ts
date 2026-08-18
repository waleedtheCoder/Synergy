import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MeilisearchService } from './meilisearch.service';

@Module({
  controllers: [SearchController],
  providers: [MeilisearchService, SearchService],
  exports: [SearchService],
})
export class SearchModule {}
