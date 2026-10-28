import { Module } from '@nestjs/common';
import { RequestsModule } from '../requests/requests.module.js';
import { ScansModule } from '../scans/scans.module.js';
import { AdminStatsController } from './admin-stats.controller.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminRequestsController } from './admin-requests.controller.js';
import { AdminRequestsService } from './admin-requests.service.js';

@Module({
  imports: [ScansModule, RequestsModule],
  controllers: [AdminRequestsController, AdminStatsController],
  providers: [AdminRequestsService, AdminStatsService],
})
export class AdminModule {}
