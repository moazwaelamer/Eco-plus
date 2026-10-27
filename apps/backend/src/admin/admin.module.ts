import { Module } from '@nestjs/common';
import { RequestsModule } from '../requests/requests.module.js';
import { ScansModule } from '../scans/scans.module.js';
import { AdminRequestsController } from './admin-requests.controller.js';
import { AdminRequestsService } from './admin-requests.service.js';

@Module({
  imports: [ScansModule, RequestsModule],
  controllers: [AdminRequestsController],
  providers: [AdminRequestsService],
})
export class AdminModule {}
