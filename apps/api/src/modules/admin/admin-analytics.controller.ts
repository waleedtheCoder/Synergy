import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma';
import { AnalyticsService } from '../analytics/analytics.service';
import { QueryAnalyticsDto } from '../analytics/dto/query-analytics.dto';

@ApiTags('admin')
@UseInterceptors(TransformInterceptor)
@Roles(Role.ADMIN)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform-wide analytics' })
  getSummary(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getAdminSummary(query.days);
  }
}
