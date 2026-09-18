import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdvertisersService } from './advertisers.service';
import { CreateAdvertiserDto } from './dto/create-advertiser.dto';

@ApiTags('advertisers')
@UseInterceptors(TransformInterceptor)
@Controller('advertisers')
export class AdvertisersController {
  constructor(private readonly advertisersService: AdvertisersService) {}

  @Post()
  @ApiOperation({ summary: 'Register as an advertiser' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAdvertiserDto) {
    return this.advertisersService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my advertiser profile' })
  findMe(@CurrentUser('id') userId: string) {
    return this.advertisersService.findMe(userId);
  }
}
