import { Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { type Pagination, paginationSchema } from '../common/pagination.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { InvoicesService } from './invoices.service.js';

@ApiTags('invoices')
@ApiBearerAuth()
@Roles('factory', 'admin')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Invoices of my factory (admin: all). Unpaid and past due shows as overdue' })
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(paginationSchema)) q: Pagination) {
    return this.invoices.list(user, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One invoice' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.invoices.get(user, id);
  }

  @HttpCode(200)
  @Roles('admin')
  @Post(':id/pay')
  @ApiOperation({ summary: 'Record a payment (admin)' })
  pay(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.invoices.pay(user, id);
  }
}
