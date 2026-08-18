import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateMeetingStatusDto {
  @ApiProperty({ enum: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] })
  @IsIn(['COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status: 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}
