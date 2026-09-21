import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiPropertyOptional({
    description: 'Required to confirm deletion for email/password accounts',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
