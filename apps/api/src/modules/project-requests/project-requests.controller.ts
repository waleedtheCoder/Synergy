import {
  Body,
  Controller,
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
import { ProjectRequestsService } from './project-requests.service';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { QueryProjectRequestsDto } from './dto/query-project-requests.dto';

@ApiTags('project-requests')
@UseInterceptors(TransformInterceptor)
@Roles(Role.CLIENT)
@Controller('project-requests')
export class ProjectRequestsController {
  constructor(
    private readonly projectRequestsService: ProjectRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a project request' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectRequestDto,
  ) {
    return this.projectRequestsService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my project requests' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryProjectRequestsDto,
  ) {
    return this.projectRequestsService.findMine(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my project requests' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projectRequestsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an open project request' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectRequestDto,
  ) {
    return this.projectRequestsService.update(userId, id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an open project request' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projectRequestsService.cancel(userId, id);
  }
}
