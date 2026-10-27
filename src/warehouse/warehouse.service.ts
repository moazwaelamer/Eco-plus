import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { toPage } from '../common/pagination.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListBatchesDto, StockQueryDto, UpdateBatchDto } from './warehouse.schemas.js';

const NEAR_CAPACITY = 0.8;

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Employees are limited to their own warehouse; admins may look at one or all. */
  private async scopeWarehouseId(user: AuthUser, requested?: number): Promise<number | undefined> {
    if (user.role === 'admin') return requested;
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) throw new ForbiddenException('Your account is not linked to a warehouse.');
    if (requested !== undefined && requested !== employee.warehouseId) {
      throw new ForbiddenException('You can only see your own warehouse.');
    }
    return employee.warehouseId;
  }

  async batches(user: AuthUser, { limit, cursor, materialTypeId, grade, status }: ListBatchesDto) {
    const warehouseId = await this.scopeWarehouseId(user);
    const rows = await this.prisma.batch.findMany({
      where: { ...(warehouseId ? { warehouseId } : {}), ...(materialTypeId ? { materialTypeId } : {}), ...(grade ? { grade } : {}), ...(status ? { status } : {}) },
      include: { materialType: { select: { name: true } } },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  /** Stock = sum of the weight of batches that are in stock, per material and grade, plus capacity use. */
  async stock(user: AuthUser, { warehouseId: requested }: StockQueryDto) {
    const warehouseId = await this.scopeWarehouseId(user, requested);
    const where = { status: 'in_stock' as const, ...(warehouseId ? { warehouseId } : {}) };

    const grouped = await this.prisma.batch.groupBy({
      by: ['materialTypeId', 'grade'],
      where,
      _sum: { weightKg: true },
      orderBy: [{ materialTypeId: 'asc' }, { grade: 'asc' }],
    });
    const materials = await this.prisma.materialType.findMany({ select: { id: true, name: true } });
    const nameById = new Map(materials.map((m) => [m.id, m.name]));

    const items = grouped.map((g) => ({
      materialTypeId: g.materialTypeId,
      material: nameById.get(g.materialTypeId) ?? 'Unknown',
      grade: g.grade,
      weightKg: g._sum.weightKg ?? new Prisma.Decimal(0),
    }));
    const totalKg = items.reduce((sum, i) => sum.add(i.weightKg), new Prisma.Decimal(0));

    const warehouses = await this.prisma.warehouse.findMany({ where: warehouseId ? { id: warehouseId } : {} });
    const capacityKg = warehouses.reduce((sum, w) => sum.add(w.capacityKg), new Prisma.Decimal(0));
    const usage = capacityKg.isZero() ? 0 : totalKg.div(capacityKg).toNumber();

    return {
      items,
      totalKg,
      capacityKg,
      usagePercent: Math.round(usage * 1000) / 10,
      nearCapacity: usage >= NEAR_CAPACITY,
    };
  }

  async updateBatch(user: AuthUser, id: number, dto: UpdateBatchDto) {
    const warehouseId = await this.scopeWarehouseId(user);
    const batch = await this.prisma.batch.findFirst({ where: { id, ...(warehouseId ? { warehouseId } : {}) } });
    if (!batch) throw new NotFoundException('Batch not found.');
    if (batch.status === 'sold') throw new ConflictException('A sold batch cannot be changed.');

    const updated = await this.prisma.batch.update({ where: { id }, data: { grade: dto.grade, status: dto.status } });
    // A proper audit log table arrives in Phase 3; until then every change is written to the application log.
    this.logger.log(
      `batch ${id} changed by user ${user.id}: grade ${batch.grade}->${updated.grade}, status ${batch.status}->${updated.status}`,
    );
    return updated;
  }
}
