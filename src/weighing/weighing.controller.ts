import { Body, Controller, HttpCode, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type WeighDto, weighSchema } from './weighing.schemas.js';
import { WeighingService } from './weighing.service.js';

@ApiTags('weighing')
@ApiBearerAuth()
@Controller('shipments')
export class WeighingController {
  constructor(private readonly weighing: WeighingService) {}

  @Roles('employee')
  @HttpCode(201)
  @Post(':id/weigh')
  @ApiOperation({
    summary: 'Weigh a collected shipment: accept (material, weight, grade) or reject (reason). 201 the first time, 200 when the same weighing is sent again.',
  })
  async weigh(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(weighSchema)) dto: WeighDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.weighing.weigh(user.id, id, dto);
    if (result.replay) res.status(200);
    return result;
  }
}
