import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type StaffRequestDto, staffRequestSchema } from './admin-requests.schemas.js';
import { AdminRequestsService } from './admin-requests.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin', 'employee')
@Controller('admin/pickup-requests')
export class AdminRequestsController {
  constructor(private readonly service: AdminRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a pickup request for a customer who called or wrote on WhatsApp' })
  async create(
    @CurrentUser() staff: AuthUser,
    @Body(new ZodValidationPipe(staffRequestSchema)) dto: StaffRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.createForCustomer(staff, dto);
    res.status(result.decision === 'ready' ? 201 : 200);
    return result;
  }
}
