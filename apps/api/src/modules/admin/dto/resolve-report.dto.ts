import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../../../generated/prisma';

export class ResolveReportDto {
  @ApiProperty({
    enum: [ReportStatus.ACTIONED, ReportStatus.DISMISSED],
  })
  @IsEnum([ReportStatus.ACTIONED, ReportStatus.DISMISSED])
  status: ReportStatus;
}
