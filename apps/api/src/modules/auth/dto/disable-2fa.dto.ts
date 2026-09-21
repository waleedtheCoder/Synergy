import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class Disable2faDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;

  @ApiProperty({ description: '6-digit TOTP code or a recovery code' })
  @IsString()
  @MinLength(6)
  code: string;
}
