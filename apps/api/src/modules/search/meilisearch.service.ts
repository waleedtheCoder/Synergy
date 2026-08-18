import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch, type SearchParams } from 'meilisearch';

export const PROFESSIONALS_INDEX = 'professionals';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private readonly client: Meilisearch | null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MEILISEARCH_HOST');
    this.client = host
      ? new Meilisearch({
          host,
          apiKey: this.config.get<string>('MEILISEARCH_API_KEY'),
        })
      : null;
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        'MEILISEARCH_HOST not set — professional search is disabled',
      );
      return;
    }

    try {
      const index = this.client.index(PROFESSIONALS_INDEX);
      await index.updateSettings({
        searchableAttributes: [
          'businessName',
          'tagline',
          'about',
          'firstName',
          'lastName',
          'skills',
          'categoryName',
          'cityName',
        ],
        filterableAttributes: [
          'categoryId',
          'cityId',
          'skillIds',
          'availability',
          'verified',
          'ratingAvg',
        ],
        sortableAttributes: [
          'ratingAvg',
          'hourlyRateMin',
          'createdAt',
          'completedProjectsCount',
        ],
      });
    } catch (error) {
      this.logger.warn(
        `Could not reach Meilisearch to configure the index: ${(error as Error).message}`,
      );
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async upsertProfessional(document: Record<string, unknown>): Promise<void> {
    if (!this.client) return;
    try {
      await this.client
        .index(PROFESSIONALS_INDEX)
        .addDocuments([document], { primaryKey: 'id' });
    } catch (error) {
      this.logger.warn(
        `Failed to index professional ${String(document.id)}: ${(error as Error).message}`,
      );
    }
  }

  async searchProfessionals(query: string, options: SearchParams) {
    if (!this.client) {
      throw new ServiceUnavailableException('Search is not configured');
    }
    return this.client.index(PROFESSIONALS_INDEX).search(query, options);
  }
}
