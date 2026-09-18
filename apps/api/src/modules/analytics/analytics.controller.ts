import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma';
import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';

@ApiTags('analytics')
@UseInterceptors(TransformInterceptor)
@Roles(Role.PROFESSIONAL)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile performance analytics' })
  getMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getMySummary(userId, query.days);
  }
}
