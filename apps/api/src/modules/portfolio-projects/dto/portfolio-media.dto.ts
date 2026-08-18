import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MaxLength,
} from 'class-validator';
import { AttachmentType } from '../../../../generated/prisma';

export class PortfolioMediaDto {
  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ enum: AttachmentType, default: AttachmentType.IMAGE })
  @IsOptional()
  @IsEnum(AttachmentType)
  type?: AttachmentType;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
