import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { AdsService } from './ads.service';
import { ServeAdQueryDto } from './dto/serve-ad-query.dto';

@ApiTags('ads')
@UseInterceptors(TransformInterceptor)
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Public()
  @Get('serve')
  @ApiOperation({ summary: 'Get an eligible ad for a placement' })
  serve(@Query() query: ServeAdQueryDto) {
    return this.adsService.serve(query.placement);
  }

  @Public()
  @Post(':id/click')
  @ApiOperation({ summary: 'Record a click on a served ad' })
  recordClick(@Param('id') id: string) {
    return this.adsService.recordClick(id);
  }
}
