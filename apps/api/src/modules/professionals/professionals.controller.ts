import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
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
  @Get(':slug')
  @ApiOperation({ summary: 'Get a public professional profile' })
  findBySlug(@Param('slug') slug: string) {
    return this.professionalsService.findBySlug(slug);
  }
}
