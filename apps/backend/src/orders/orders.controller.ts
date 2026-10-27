import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type CreateOrderDto, type ListOrdersDto, createOrderSchema, listOrdersSchema } from './orders.schemas.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@Roles('factory', 'admin')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles('factory')
  @Post()
  @ApiOperation({ summary: 'Place an order; the stock is reserved at once or the order is refused (factory)' })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Orders of my factory (admin: all, optional factoryId)' })
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(listOrdersSchema)) q: ListOrdersDto) {
    return this.orders.list(user, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One order with items and invoice' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.get(user, id);
  }

  @HttpCode(200)
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel and release the stock (factory: placed only; admin: until dispatched)' })
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.cancel(user, id);
  }

  @HttpCode(200)
  @Roles('admin')
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm an order (admin)' })
  confirm(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.advance(user, id, 'confirmed');
  }

  @HttpCode(200)
  @Roles('admin')
  @Post(':id/dispatch')
  @ApiOperation({ summary: 'Mark an order as dispatched (admin)' })
  dispatch(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.advance(user, id, 'dispatched');
  }

  @HttpCode(200)
  @Roles('admin')
  @Post(':id/deliver')
  @ApiOperation({ summary: 'Mark an order as delivered: batches become sold and the invoice is issued (admin)' })
  deliver(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.advance(user, id, 'delivered');
  }
}
