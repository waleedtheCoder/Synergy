import {
  Body,
  Controller,
  Get,
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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../../generated/prisma';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';

@ApiTags('quotations')
@UseInterceptors(TransformInterceptor)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Send a quotation in a chat' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotationsService.create(userId, role, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my quotations' })
  findMine(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: PaginationQueryDto,
  ) {
    return this.quotationsService.findMine(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my quotations' })
  findOne(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
  ) {
    return this.quotationsService.findOne(userId, role, id);
  }

  @Patch(':id/status')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Accept or reject a quotation' })
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
  ) {
    return this.quotationsService.updateStatus(userId, id, dto);
  }
}
