import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type StatsQueryDto, statsQuerySchema } from './admin-stats.schemas.js';
import { AdminStatsService } from './admin-stats.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminStatsController {
  constructor(private readonly service: AdminStatsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Daily shipments, kilograms weighed and rejection rate over the last N days' })
  stats(@Query(new ZodValidationPipe(statsQuerySchema)) q: StatsQueryDto) {
    return this.service.stats(q);
  }

  @Get('points')
  @ApiOperation({ summary: 'Shipment locations and statuses for the map' })
  points() {
    return this.service.points();
  }
}
