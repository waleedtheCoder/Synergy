import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { CreateCampaignPaymentDto } from './dto/create-campaign-payment.dto';
import { QueryMyPaymentsDto } from './dto/query-my-payments.dto';

@ApiTags('payments')
@UseInterceptors(TransformInterceptor)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('instructions')
  @ApiOperation({ summary: 'Get manual payment instructions' })
  getInstructions() {
    return this.paymentsService.getInstructions();
  }

  @Get('me')
  @ApiOperation({ summary: 'List my payment history' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryMyPaymentsDto,
  ) {
    return this.paymentsService.findMine(userId, query);
  }

  @Post('subscription-upgrade')
  @ApiOperation({
    summary: 'Submit a payment claim to upgrade my subscription',
  })
  createSubscriptionPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionPaymentDto,
  ) {
    return this.paymentsService.createSubscriptionPayment(userId, dto);
  }

  @Post('campaigns/:campaignId')
  @ApiOperation({ summary: 'Submit a payment claim to fund a campaign' })
  createCampaignPayment(
    @CurrentUser('id') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateCampaignPaymentDto,
  ) {
    return this.paymentsService.createCampaignPayment(userId, campaignId, dto);
  }
}
