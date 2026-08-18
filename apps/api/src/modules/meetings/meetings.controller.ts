import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../../generated/prisma';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingStatusDto } from './dto/update-meeting-status.dto';

@ApiTags('meetings')
@UseInterceptors(TransformInterceptor)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Propose a meeting in a chat' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.create(userId, role, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my meetings' })
  findMine(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: PaginationQueryDto,
  ) {
    return this.meetingsService.findMine(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my meetings' })
  findOne(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
  ) {
    return this.meetingsService.findOne(userId, role, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a meeting status' })
  updateStatus(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingStatusDto,
  ) {
    return this.meetingsService.updateStatus(userId, role, id, dto);
  }
}
