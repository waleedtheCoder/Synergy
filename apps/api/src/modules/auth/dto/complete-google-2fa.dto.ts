import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CompleteGoogle2faDto {
  @ApiProperty()
  @IsString()
  pendingToken: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  otpCode: string;
}
