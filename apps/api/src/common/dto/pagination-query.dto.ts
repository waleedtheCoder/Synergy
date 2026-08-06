import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  query: PaginationQueryDto,
): PaginatedResult<T> {
  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
