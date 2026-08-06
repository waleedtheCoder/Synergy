import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ProjectRequestStatus } from '../../../../generated/prisma';

export class QueryProjectRequestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProjectRequestStatus })
  @IsOptional()
  @IsEnum(ProjectRequestStatus)
  status?: ProjectRequestStatus;
}
