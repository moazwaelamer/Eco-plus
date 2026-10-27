import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { type Pagination, paginationSchema } from '../common/pagination.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateFactoryDto,
  type CreateFactoryUserDto,
  type UpdateFactoryDto,
  createFactorySchema,
  createFactoryUserSchema,
  updateFactorySchema,
} from './factories.schemas.js';
import { FactoriesService } from './factories.service.js';

@ApiTags('factories')
@ApiBearerAuth()
@Roles('admin')
@Controller('factories')
export class FactoriesController {
  constructor(private readonly factories: FactoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a factory (admin)' })
  create(@Body(new ZodValidationPipe(createFactorySchema)) dto: CreateFactoryDto) {
    return this.factories.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List factories (admin)' })
  list(@Query(new ZodValidationPipe(paginationSchema)) q: Pagination) {
    return this.factories.list(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One factory with its logins (admin)' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.factories.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change factory details (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body(new ZodValidationPipe(updateFactorySchema)) dto: UpdateFactoryDto) {
    return this.factories.update(id, dto);
  }

  @Post(':id/users')
  @ApiOperation({ summary: 'Create a login for a factory (admin)' })
  createUser(@Param('id', ParseIntPipe) id: number, @Body(new ZodValidationPipe(createFactoryUserSchema)) dto: CreateFactoryUserDto) {
    return this.factories.createUser(id, dto);
  }
}
