import { Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type ListShipmentsDto, listShipmentsSchema } from './shipments.schemas.js';
import { ShipmentsService } from './shipments.service.js';

@ApiTags('shipments')
@ApiBearerAuth()
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Roles('citizen', 'business', 'admin', 'employee')
  @Get()
  @ApiOperation({ summary: 'My shipments (staff see all), optional status filter' })
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(listShipmentsSchema)) query: ListShipmentsDto) {
    return this.shipments.list(user, query);
  }

  // Declared before ":id" so "by-qr" is not read as an id.
  @Roles('employee', 'admin')
  @Get('by-qr/:code')
  @ApiOperation({ summary: 'Find a shipment from its QR code (employee scan)' })
  byQr(@Param('code') code: string) {
    return this.shipments.getByQr(code);
  }

  @Roles('citizen', 'business', 'admin', 'employee')
  @Get(':id')
  @ApiOperation({ summary: 'One shipment (owner, admin or employee)' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.shipments.get(user, id);
  }

  @HttpCode(200)
  @Roles('employee', 'admin')
  @Post(':id/collect')
  @ApiOperation({ summary: 'Mark a shipment as collected (staff, until the driver app exists)' })
  collect(@Param('id', ParseIntPipe) id: number) {
    return this.shipments.markCollected(id);
  }
}
