import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { type Pagination, paginationSchema } from '../common/pagination.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ScansService } from '../scans/scans.service.js';
import { type CreateRequestDto, createRequestSchema } from './requests.schemas.js';
import { RequestsService } from './requests.service.js';

@ApiTags('pickup-requests')
@ApiBearerAuth()
@Controller('pickup-requests')
export class RequestsController {
  constructor(
    private readonly requests: RequestsService,
    private readonly scans: ScansService,
  ) {}

  @Roles('citizen', 'business')
  @Post()
  @ApiOperation({ summary: 'Request a pickup for one of my scans. 201 with a shipment when ready or merged, 200 with decision "wait" when not full enough.' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createRequestSchema)) dto: CreateRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.scans.get(user, dto.scanId); // 404 or 403 unless the scan is mine
    const result = await this.requests.createFromScan({ scanId: dto.scanId, channel: 'app' });
    res.status(result.decision === 'wait' ? 200 : 201);
    return result;
  }

  @Roles('citizen', 'business')
  @Get()
  @ApiOperation({ summary: 'My pickup requests with their shipments' })
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(paginationSchema)) page: Pagination) {
    return this.requests.list(user.id, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One pickup request (owner, admin or employee)' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.requests.get(user, id);
  }

  @HttpCode(200)
  @Roles('citizen', 'business', 'admin')
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a request before anything is collected' })
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.requests.cancel(user, id);
  }
}
