import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma';
import { AdminReportsService } from './admin-reports.service';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

@ApiTags('admin')
@UseInterceptors(TransformInterceptor)
@Roles(Role.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List reports' })
  findAll(@Query() query: QueryReportsDto) {
    return this.adminReportsService.findAll(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Resolve or dismiss a report' })
  resolve(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.adminReportsService.resolve(id, dto);
  }
}
