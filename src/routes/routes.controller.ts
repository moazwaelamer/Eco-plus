import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateRouteDto,
  type ListRoutesDto,
  type ReorderRouteDto,
  createRouteSchema,
  listRoutesSchema,
  reorderRouteSchema,
} from './routes.schemas.js';
import { RoutesService } from './routes.service.js';

@ApiTags('routes')
@ApiBearerAuth()
@Roles('admin')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a route: assign shipments to a driver and vehicle, stops get ordered (admin)' })
  create(@Body(new ZodValidationPipe(createRouteSchema)) dto: CreateRouteDto) {
    return this.routes.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List routes, filter by date, driver or status (admin)' })
  list(@Query(new ZodValidationPipe(listRoutesSchema)) query: ListRoutesDto) {
    return this.routes.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One route with its stops and handover codes (admin)' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.routes.get(id);
  }

  @Put(':id/stop-order')
  @ApiOperation({ summary: 'Set the stop order by hand, planned routes only (admin)' })
  reorder(@Param('id', ParseIntPipe) id: number, @Body(new ZodValidationPipe(reorderRouteSchema)) dto: ReorderRouteDto) {
    return this.routes.reorder(id, dto);
  }

  @Delete(':id/stops/:shipmentId')
  @ApiOperation({ summary: 'Take a shipment off a planned route (admin)' })
  removeStop(@Param('id', ParseIntPipe) id: number, @Param('shipmentId', ParseIntPipe) shipmentId: number) {
    return this.routes.removeStop(id, shipmentId);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a planned route (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.routes.remove(id);
  }
}
