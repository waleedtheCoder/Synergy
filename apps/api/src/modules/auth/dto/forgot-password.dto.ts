import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile response token' })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
