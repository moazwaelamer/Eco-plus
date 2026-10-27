import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { DriverRoutesService } from './driver-routes.service.js';
import { type CollectStopDto, type DriverRoutesDto, collectStopSchema, driverRoutesSchema } from './routes.schemas.js';

@ApiTags('driver')
@ApiBearerAuth()
@Roles('driver')
@Controller('driver')
export class DriverRoutesController {
  constructor(private readonly driverRoutes: DriverRoutesService) {}

  @Get('routes')
  @ApiOperation({ summary: "My routes for a day (today by default) with ordered stops" })
  mine(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(driverRoutesSchema)) query: DriverRoutesDto) {
    return this.driverRoutes.mine(user.id, query.date);
  }

  @HttpCode(200)
  @Post('routes/:id/start')
  @ApiOperation({ summary: 'Start my route (only on its own day, one at a time)' })
  start(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.driverRoutes.start(user.id, id);
  }

  // 6 digits can be guessed, so wrong codes are limited to 10 tries a minute per IP on top of the route checks.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('stops/:shipmentId/collect')
  @ApiOperation({ summary: 'Mark a stop as collected by typing the customer\'s 6 digit handover code' })
  collect(
    @CurrentUser() user: AuthUser,
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
    @Body(new ZodValidationPipe(collectStopSchema)) dto: CollectStopDto,
  ) {
    return this.driverRoutes.collect(user.id, shipmentId, dto.handoverCode);
  }
}
