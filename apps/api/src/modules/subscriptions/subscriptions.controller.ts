import { Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma';
import { SubscriptionsService } from './subscriptions.service';
import { PLAN_DEFINITIONS } from './plans';

@ApiTags('subscriptions')
@UseInterceptors(TransformInterceptor)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans' })
  listPlans() {
    return PLAN_DEFINITIONS;
  }

  @Roles(Role.PROFESSIONAL)
  @Get('me')
  @ApiOperation({ summary: 'Get my subscription' })
  getMine(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getOrCreateForUser(userId);
  }

  @Roles(Role.PROFESSIONAL)
  @Post('me/downgrade-to-basic')
  @ApiOperation({ summary: 'Downgrade to the free Basic plan immediately' })
  downgradeToBasic(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.downgradeToBasic(userId);
  }
}
