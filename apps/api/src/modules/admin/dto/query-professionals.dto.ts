import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryProfessionalsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Search by business name or slug' })
  @IsOptional()
  @IsString()
  search?: string;
}
