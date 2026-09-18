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
import { AdminDisputesService } from './admin-disputes.service';
import { QueryDisputesDto } from './dto/query-disputes.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('admin')
@UseInterceptors(TransformInterceptor)
@Roles(Role.ADMIN)
@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly adminDisputesService: AdminDisputesService) {}

  @Get()
  @ApiOperation({ summary: 'List disputes' })
  findAll(@Query() query: QueryDisputesDto) {
    return this.adminDisputesService.findAll(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dispute status / add resolution notes' })
  resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.adminDisputesService.resolve(id, dto);
  }
}
