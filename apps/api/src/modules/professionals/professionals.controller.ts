import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { ProfessionalsService } from './professionals.service';

@ApiTags('professionals')
@UseInterceptors(TransformInterceptor)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Public()
  @Post(':id/click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a click-through to a professional profile' })
  async recordClick(@Param('id') id: string) {
    await this.professionalsService.recordClick(id);
    return null;
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a public professional profile' })
  findBySlug(@Param('slug') slug: string) {
    return this.professionalsService.findBySlug(slug);
  }
}
