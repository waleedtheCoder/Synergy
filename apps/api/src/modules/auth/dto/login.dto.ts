import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    description:
      'Required if the account has two-factor authentication enabled',
  })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile response token' })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
