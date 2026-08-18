import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    description:
      'ProfessionalProfile id if the caller is a client, ClientProfile id if the caller is a professional',
  })
  @IsString()
  counterpartId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectRequestId?: string;
}
