import { Module } from '@nestjs/common';
import { PortfolioProjectsController } from './portfolio-projects.controller';
import { PortfolioProjectsService } from './portfolio-projects.service';

@Module({
  controllers: [PortfolioProjectsController],
  providers: [PortfolioProjectsService],
})
export class PortfolioProjectsModule {}
