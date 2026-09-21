import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class Confirm2faDto {
  @ApiProperty({ description: '6-digit code from an authenticator app' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiPropertyOptional({
    description:
      'Required for accounts with a password set (not Google-only accounts)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;
}
