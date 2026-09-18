import { Module } from '@nestjs/common';
import { AdvertisersController } from './advertisers.controller';
import { AdvertisersService } from './advertisers.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  controllers: [AdvertisersController, CampaignsController, AdsController],
  providers: [AdvertisersService, CampaignsService, AdsService],
  exports: [AdvertisersService],
})
export class AdvertisingModule {}
