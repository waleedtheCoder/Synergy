import {
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma';
import { AdminPaymentsService } from './admin-payments.service';
import { QueryAdminPaymentsDto } from './dto/query-admin-payments.dto';

@ApiTags('admin')
@UseInterceptors(TransformInterceptor)
@Roles(Role.ADMIN)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List payments awaiting or past review' })
  findAll(@Query() query: QueryAdminPaymentsDto) {
    return this.adminPaymentsService.findAll(query);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a pending payment was received' })
  confirm(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminPaymentsService.confirm(id, adminId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending payment claim' })
  reject(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminPaymentsService.reject(id, adminId);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund a succeeded payment' })
  refund(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminPaymentsService.refund(id, adminId);
  }
}
