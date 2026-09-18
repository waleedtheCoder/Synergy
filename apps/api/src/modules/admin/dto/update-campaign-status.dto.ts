import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CampaignStatus } from '../../../../generated/prisma';

export class UpdateCampaignStatusDto {
  @ApiProperty({
    enum: [
      CampaignStatus.ACTIVE,
      CampaignStatus.REJECTED,
      CampaignStatus.PAUSED,
      CampaignStatus.COMPLETED,
    ],
  })
  @IsEnum([
    CampaignStatus.ACTIVE,
    CampaignStatus.REJECTED,
    CampaignStatus.PAUSED,
    CampaignStatus.COMPLETED,
  ])
  status: CampaignStatus;
}
