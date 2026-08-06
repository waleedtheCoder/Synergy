import {
  Controller,
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
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@ApiTags('notifications')
@UseInterceptors(TransformInterceptor)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my notifications' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findMine(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markRead(userId, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllRead(@CurrentUser('id') userId: string) {
    await this.notificationsService.markAllRead(userId);
    return null;
  }
}
