import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { DriverRoutesController } from './driver-routes.controller.js';
import { DriverRoutesService } from './driver-routes.service.js';
import { RoutesController } from './routes.controller.js';
import { RoutesService } from './routes.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [RoutesController, DriverRoutesController],
  providers: [RoutesService, DriverRoutesService],
})
export class RoutesModule {}
