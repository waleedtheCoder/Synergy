import {
  Body,
  Controller,
  Delete,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('services')
@UseInterceptors(TransformInterceptor)
@Roles(Role.PROFESSIONAL)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a service' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my services' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.servicesService.findMine(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my services' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.servicesService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a service' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.servicesService.remove(userId, id);
    return null;
  }
}
