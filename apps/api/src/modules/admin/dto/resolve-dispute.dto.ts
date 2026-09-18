import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DisputeStatus } from '../../../../generated/prisma';

export class ResolveDisputeDto {
  @ApiProperty({
    enum: [
      DisputeStatus.UNDER_REVIEW,
      DisputeStatus.RESOLVED,
      DisputeStatus.REJECTED,
    ],
  })
  @IsEnum([
    DisputeStatus.UNDER_REVIEW,
    DisputeStatus.RESOLVED,
    DisputeStatus.REJECTED,
  ])
  status: DisputeStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
