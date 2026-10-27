import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateDriverDto,
  type CreateVehicleDto,
  type UpdateDriverDto,
  type UpdateVehicleDto,
  createDriverSchema,
  createVehicleSchema,
  listSchema,
  updateDriverSchema,
  updateVehicleSchema,
} from './fleet.schemas.js';
import { FleetService } from './fleet.service.js';
import type { Pagination } from '../common/pagination.js';

@ApiTags('fleet')
@ApiBearerAuth()
@Roles('admin')
@Controller()
export class FleetController {
  constructor(private readonly fleet: FleetService) {}

  @Post('vehicles')
  @ApiOperation({ summary: 'Add a vehicle (admin)' })
  createVehicle(@Body(new ZodValidationPipe(createVehicleSchema)) dto: CreateVehicleDto) {
    return this.fleet.createVehicle(dto);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List vehicles (admin)' })
  listVehicles(@Query(new ZodValidationPipe(listSchema)) query: Pagination) {
    return this.fleet.listVehicles(query);
  }

  @Patch('vehicles/:id')
  @ApiOperation({ summary: 'Change a vehicle, or retire it with isActive=false (admin)' })
  updateVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateVehicleSchema)) dto: UpdateVehicleDto,
  ) {
    return this.fleet.updateVehicle(id, dto);
  }

  @Post('drivers')
  @ApiOperation({ summary: 'Create a driver account (admin)' })
  createDriver(@Body(new ZodValidationPipe(createDriverSchema)) dto: CreateDriverDto) {
    return this.fleet.createDriver(dto);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'List drivers (admin)' })
  listDrivers(@Query(new ZodValidationPipe(listSchema)) query: Pagination) {
    return this.fleet.listDrivers(query);
  }

  @Get('drivers/:id')
  @ApiOperation({ summary: 'One driver (admin)' })
  getDriver(@Param('id', ParseIntPipe) id: number) {
    return this.fleet.getDriver(id);
  }

  @Patch('drivers/:id')
  @ApiOperation({ summary: 'Change licence or status, or deactivate the account (admin)' })
  updateDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateDriverSchema)) dto: UpdateDriverDto,
  ) {
    return this.fleet.updateDriver(id, dto);
  }
}
