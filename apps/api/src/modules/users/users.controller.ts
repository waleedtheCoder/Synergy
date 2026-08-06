import { Body, Controller, Get, Patch, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
}
