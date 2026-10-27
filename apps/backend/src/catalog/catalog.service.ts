import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMaterialDto, UpdateMaterialDto } from './catalog.schemas.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listMaterials() {
    return this.prisma.materialType.findMany({ orderBy: { id: 'asc' } });
  }

  async createMaterial(dto: CreateMaterialDto) {
    try {
      return await this.prisma.materialType.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A material with this name already exists.');
      }
      throw e;
    }
  }

  /**
   * Changing a price or point factor only affects future orders and weighings:
   * order items keep the price they were ordered at.
   */
  async updateMaterial(id: number, dto: UpdateMaterialDto) {
    const exists = await this.prisma.materialType.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Material not found.');
    try {
      return await this.prisma.materialType.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A material with this name already exists.');
      }
      throw e;
    }
  }

  /** What a factory can order now: stock that is in the warehouse and not reserved, per material and grade. */
  async catalog() {
    const grouped = await this.prisma.batch.groupBy({
      by: ['materialTypeId', 'grade'],
      where: { status: 'in_stock', materialType: { isActive: true } },
      _sum: { weightKg: true },
      orderBy: [{ materialTypeId: 'asc' }, { grade: 'asc' }],
    });
    const materials = await this.prisma.materialType.findMany({ where: { isActive: true } });
    const byId = new Map(materials.map((m) => [m.id, m]));
    const items = grouped
      .filter((g) => (g._sum.weightKg ?? new Prisma.Decimal(0)).gt(0))
      .map((g) => {
        const m = byId.get(g.materialTypeId)!;
        return {
          materialTypeId: m.id,
          material: m.name,
          grade: g.grade,
          availableKg: g._sum.weightKg!,
          pricePerKg: m.pricePerKg,
        };
      });
    return { items };
  }
}
