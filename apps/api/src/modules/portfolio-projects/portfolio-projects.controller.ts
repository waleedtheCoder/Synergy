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
import { PortfolioProjectsService } from './portfolio-projects.service';
import { CreatePortfolioProjectDto } from './dto/create-portfolio-project.dto';
import { UpdatePortfolioProjectDto } from './dto/update-portfolio-project.dto';

@ApiTags('portfolio-projects')
@UseInterceptors(TransformInterceptor)
@Roles(Role.PROFESSIONAL)
@Controller('portfolio-projects')
export class PortfolioProjectsController {
  constructor(
    private readonly portfolioProjectsService: PortfolioProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a portfolio project' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePortfolioProjectDto,
  ) {
    return this.portfolioProjectsService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my portfolio projects' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.portfolioProjectsService.findMine(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my portfolio projects' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.portfolioProjectsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a portfolio project' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePortfolioProjectDto,
  ) {
    return this.portfolioProjectsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a portfolio project' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.portfolioProjectsService.remove(userId, id);
    return null;
  }
}
