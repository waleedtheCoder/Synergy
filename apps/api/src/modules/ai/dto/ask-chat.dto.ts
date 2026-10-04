import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AskChatDto {
  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Omit to get a summary of the conversation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  question?: string;
}
