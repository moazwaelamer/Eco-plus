import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type ListBatchesDto,
  type StockQueryDto,
  type UpdateBatchDto,
  listBatchesSchema,
  stockQuerySchema,
  updateBatchSchema,
} from './warehouse.schemas.js';
import { WarehouseService } from './warehouse.service.js';

@ApiTags('warehouse')
@ApiBearerAuth()
@Roles('employee', 'admin')
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouse: WarehouseService) {}

  @Get('batches')
  @ApiOperation({ summary: 'Batches, filter by material, grade and status' })
  batches(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(listBatchesSchema)) q: ListBatchesDto) {
    return this.warehouse.batches(user, q);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Stock per material and grade, with capacity use and a near-capacity flag (80%)' })
  stock(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(stockQuerySchema)) q: StockQueryDto) {
    return this.warehouse.stock(user, q);
  }

  @Patch('batches/:id')
  @ApiOperation({ summary: 'Change the grade or status of a batch (not when sold)' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateBatchSchema)) dto: UpdateBatchDto,
  ) {
    return this.warehouse.updateBatch(user, id, dto);
  }
}
