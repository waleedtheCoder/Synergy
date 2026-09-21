import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma';
import { AdminVerificationService } from './admin-verification.service';
import { QueryProfessionalsDto } from './dto/query-professionals.dto';
import { QueryCertificatesDto } from './dto/query-certificates.dto';
import { SetVerifiedDto } from './dto/set-verified.dto';

@ApiTags('admin')
@UseInterceptors(TransformInterceptor)
@Roles(Role.ADMIN)
@Controller('admin/verification')
export class AdminVerificationController {
  constructor(
    private readonly adminVerificationService: AdminVerificationService,
  ) {}

  @Get('professionals')
  @ApiOperation({ summary: 'List professional profiles for verification' })
  findProfessionals(@Query() query: QueryProfessionalsDto) {
    return this.adminVerificationService.findProfessionals(query);
  }

  @Patch('professionals/:id')
  @ApiOperation({ summary: 'Verify or unverify a professional profile' })
  setProfessionalVerified(
    @Param('id') id: string,
    @Body() dto: SetVerifiedDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminVerificationService.setProfessionalVerified(
      id,
      dto.verified,
      adminId,
      req.ip,
    );
  }

  @Get('certificates')
  @ApiOperation({ summary: 'List certificates for verification' })
  findCertificates(@Query() query: QueryCertificatesDto) {
    return this.adminVerificationService.findCertificates(query);
  }

  @Patch('certificates/:id')
  @ApiOperation({ summary: 'Verify or unverify a certificate' })
  setCertificateVerified(
    @Param('id') id: string,
    @Body() dto: SetVerifiedDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminVerificationService.setCertificateVerified(
      id,
      dto.verified,
      adminId,
      req.ip,
    );
  }
}
