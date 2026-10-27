import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { type Pagination, paginationSchema } from '../common/pagination.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PointsService } from './points.service.js';

@ApiTags('points')
@ApiBearerAuth()
@Controller()
export class PointsController {
  constructor(private readonly points: PointsService) {}

  @Roles('citizen')
  @Get('me/points')
  @ApiOperation({ summary: 'My balance, level, progress to the next level and points history' })
  mine(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(paginationSchema)) page: Pagination) {
    return this.points.mine(user.id, page);
  }

  @Roles('citizen')
  @Get('leaderboard')
  @ApiOperation({ summary: 'Top 20 citizens by points (shown as first name and last initial) and my own rank' })
  leaderboard(@CurrentUser() user: AuthUser) {
    return this.points.leaderboard(user.id);
  }
}
