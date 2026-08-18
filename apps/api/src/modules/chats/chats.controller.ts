import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../../generated/prisma';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';

@ApiTags('chats')
@UseInterceptors(TransformInterceptor)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Start or resume a chat with a counterpart' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateChatDto,
  ) {
    return this.chatsService.startChat(userId, role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my chats' })
  findMine(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatsService.findMine(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my chats' })
  findOne(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
  ) {
    return this.chatsService.findOne(userId, role, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List message history for a chat' })
  findMessages(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatsService.findMessages(userId, role, id, query);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in a chat as read' })
  async markRead(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
  ) {
    await this.chatsService.markRead(userId, role, id);
    return null;
  }
}
