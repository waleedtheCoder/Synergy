import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { ProfessionalProfileController } from './professional-profile.controller';
import { ProfessionalProfileService } from './professional-profile.service';

@Module({
  imports: [SearchModule],
  controllers: [ProfessionalProfileController],
  providers: [ProfessionalProfileService],
})
export class ProfessionalProfileModule {}
