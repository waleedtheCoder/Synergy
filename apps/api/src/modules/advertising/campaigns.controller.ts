import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';

@ApiTags('campaigns')
@UseInterceptors(TransformInterceptor)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post('me')
  @ApiOperation({ summary: 'Create a campaign' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my campaigns' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryCampaignsDto,
  ) {
    return this.campaignsService.findMine(userId, query);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'Get one of my campaigns' })
  findOneMine(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.campaignsService.findOneMine(userId, id);
  }

  @Patch('me/:id')
  @ApiOperation({ summary: 'Update a draft or rejected campaign' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(userId, id, dto);
  }

  @Delete('me/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a draft campaign' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.campaignsService.remove(userId, id);
    return null;
  }

  @Post('me/:id/submit')
  @ApiOperation({ summary: 'Submit a campaign for admin review' })
  submit(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.campaignsService.submit(userId, id);
  }

  @Post('me/:id/pause')
  @ApiOperation({ summary: 'Pause an active campaign' })
  pause(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.campaignsService.pause(userId, id);
  }

  @Post('me/:id/resume')
  @ApiOperation({ summary: 'Resume a paused campaign' })
  resume(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.campaignsService.resume(userId, id);
  }

  @Post('me/:id/stop')
  @ApiOperation({ summary: 'Permanently stop a campaign' })
  stop(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.campaignsService.stop(userId, id);
  }
}
