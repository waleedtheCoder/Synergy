import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AdPlacement } from '../../../../generated/prisma';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: AdPlacement })
  @IsEnum(AdPlacement)
  placement: AdPlacement;

  @ApiProperty()
  @IsUrl()
  bannerImageUrl: string;

  @ApiProperty()
  @IsUrl()
  targetUrl: string;

  @ApiProperty({ minimum: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(1_000_000)
  budget: number;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description:
      'Your own professional profile id, to also boost it in search results while this campaign is active',
  })
  @IsOptional()
  @IsString()
  professionalId?: string;
}
