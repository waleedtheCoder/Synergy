import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma';
import { AdminCampaignsService } from './admin-campaigns.service';
import { QueryCampaignsDto } from '../advertising/dto/query-campaigns.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';

@ApiTags('admin')
@UseInterceptors(TransformInterceptor)
@Roles(Role.ADMIN)
@Controller('admin/campaigns')
export class AdminCampaignsController {
  constructor(private readonly adminCampaignsService: AdminCampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List ad campaigns' })
  findAll(@Query() query: QueryCampaignsDto) {
    return this.adminCampaignsService.findAll(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve, reject, pause, or complete a campaign' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCampaignStatusDto) {
    return this.adminCampaignsService.updateStatus(id, dto);
  }
}
