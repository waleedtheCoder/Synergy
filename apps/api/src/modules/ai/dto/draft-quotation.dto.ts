import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DraftQuotationDto {
  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Extra guidance for the draft, e.g. "include demolition"',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}
