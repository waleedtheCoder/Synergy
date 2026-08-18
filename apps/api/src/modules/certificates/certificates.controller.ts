import {
  Body,
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
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';

@ApiTags('certificates')
@UseInterceptors(TransformInterceptor)
@Roles(Role.PROFESSIONAL)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a certificate' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCertificateDto) {
    return this.certificatesService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my certificates' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.certificatesService.findMine(userId, query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a certificate' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.certificatesService.remove(userId, id);
    return null;
  }
}
