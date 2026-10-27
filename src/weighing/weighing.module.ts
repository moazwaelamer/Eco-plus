import { Module } from '@nestjs/common';
import { PointsModule } from '../points/points.module.js';
import { WeighingController } from './weighing.controller.js';
import { WeighingService } from './weighing.service.js';

@Module({
  imports: [PointsModule],
  controllers: [WeighingController],
  providers: [WeighingService],
})
export class WeighingModule {}
