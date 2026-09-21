import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { REFRESH_TOKEN_COOKIE } from '../auth/auth.constants';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@ApiTags('users')
@UseInterceptors(TransformInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my full profile' })
  findMe(@CurrentUser('id') userId: string) {
    return this.usersService.findMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Export all of my account data (GDPR portability)' })
  exportMe(@CurrentUser('id') userId: string) {
    return this.usersService.exportMe(userId);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Delete my account (GDPR erasure, soft delete)' })
  async deleteMe(
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteAccountDto,
    @Res() res: Response,
  ) {
    await this.usersService.deleteMe(userId, dto);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/v1/auth' });
    return res.status(HttpStatus.OK).json({ success: true, data: null });
  }
}
