import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { type Pagination, paginationSchema } from '../common/pagination.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type CreateScanDto, createScanSchema } from './scans.schemas.js';
import { ScansService } from './scans.service.js';

@ApiTags('scans')
@ApiBearerAuth()
@Controller('scans')
export class ScansController {
  constructor(private readonly scans: ScansService) {}

  @Roles('citizen', 'business')
  @Post()
  @ApiOperation({ summary: 'Record a bag (photo URL, material type, optional fill level and location)' })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createScanSchema)) dto: CreateScanDto) {
    return this.scans.create(user.id, dto);
  }

  @Roles('citizen', 'business')
  @Get()
  @ApiOperation({ summary: 'My scans, newest first' })
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(paginationSchema)) page: Pagination) {
    return this.scans.list(user.id, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One scan (owner, admin or employee)' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.scans.get(user, id);
  }
}
