import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty()
  @IsString()
  @MaxLength(60)
  name: string;
}
