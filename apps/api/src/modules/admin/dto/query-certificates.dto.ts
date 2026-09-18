import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryCertificatesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;
}
