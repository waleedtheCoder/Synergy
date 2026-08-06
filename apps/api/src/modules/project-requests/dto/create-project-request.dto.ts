import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectRequestDto {
  @ApiProperty({ minLength: 3, maxLength: 150 })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @ApiProperty({ minLength: 10, maxLength: 5000 })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
