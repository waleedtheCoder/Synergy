import {
  Controller,
  Delete,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@UseInterceptors(TransformInterceptor)
@Roles(Role.CLIENT)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my favorited professionals' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.favoritesService.findMine(userId, query);
  }

  @Post(':professionalId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Favorite a professional' })
  async add(
    @CurrentUser('id') userId: string,
    @Param('professionalId') professionalId: string,
  ) {
    await this.favoritesService.add(userId, professionalId);
    return null;
  }

  @Delete(':professionalId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfavorite a professional' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('professionalId') professionalId: string,
  ) {
    await this.favoritesService.remove(userId, professionalId);
    return null;
  }
}
