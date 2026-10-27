import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateMaterialDto,
  type UpdateMaterialDto,
  createMaterialSchema,
  updateMaterialSchema,
} from './catalog.schemas.js';
import { CatalogService } from './catalog.service.js';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Roles('admin', 'employee', 'factory')
  @Get('materials')
  @ApiOperation({ summary: 'All material types with price and point factor' })
  list() {
    return this.catalog.listMaterials();
  }

  @Roles('admin')
  @Post('materials')
  @ApiOperation({ summary: 'Add a material type (admin)' })
  create(@Body(new ZodValidationPipe(createMaterialSchema)) dto: CreateMaterialDto) {
    return this.catalog.createMaterial(dto);
  }

  @Roles('admin')
  @Patch('materials/:id')
  @ApiOperation({ summary: 'Change price, point factor, name or active flag (admin). Existing orders keep their price' })
  update(@Param('id', ParseIntPipe) id: number, @Body(new ZodValidationPipe(updateMaterialSchema)) dto: UpdateMaterialDto) {
    return this.catalog.updateMaterial(id, dto);
  }

  @Roles('factory', 'admin')
  @Get('catalog')
  @ApiOperation({ summary: 'Material that can be ordered now: free stock per material and grade, with price' })
  stock() {
    return this.catalog.catalog();
  }
}
