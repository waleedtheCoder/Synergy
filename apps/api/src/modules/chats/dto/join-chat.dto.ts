import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinChatDto {
  @ApiProperty()
  @IsString()
  chatId: string;
}
