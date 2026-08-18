import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma';
import { SearchService } from './search.service';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';

@ApiTags('search')
@UseInterceptors(TransformInterceptor)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('professionals')
  @ApiOperation({ summary: 'Search and filter professionals' })
  searchProfessionals(@Query() query: SearchProfessionalsDto) {
    return this.searchService.searchProfessionals(query);
  }

  @Post('reindex')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rebuild the professionals search index' })
  reindex() {
    return this.searchService.reindexAll();
  }
}
