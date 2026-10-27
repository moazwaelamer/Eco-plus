import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '../auth/auth-user.js';
import type { Env } from '../config/env.js';
import { toPage } from '../common/pagination.js';
import { Prisma } from '../generated/prisma/client.js';
import type { OrderStatus } from '../generated/prisma/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PushService } from '../push/push.service.js';
import { planAllocation } from './allocation.js';
import { factoryScope } from './factory-scope.js';
import { canMoveOrder, factoryMayCancel } from './order-status.js';
import type { CreateOrderDto, ListOrdersDto } from './orders.schemas.js';

const orderInclude = {
  factory: { select: { id: true, name: true } },
  items: { include: { materialType: { select: { name: true } }, batch: { select: { id: true, grade: true } } }, orderBy: { id: 'asc' } },
  invoice: true,
} satisfies Prisma.FactoryOrderInclude;

type Tx = Prisma.TransactionClient;
const D = (v: number | string) => new Prisma.Decimal(v);

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  async list(user: AuthUser, { limit, cursor, status, factoryId }: ListOrdersDto) {
    const scope = factoryScope(user);
    const rows = await this.prisma.factoryOrder.findMany({
      where: { ...(status ? { status } : {}), ...(scope !== undefined ? { factoryId: scope } : factoryId ? { factoryId } : {}) },
      include: orderInclude,
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  async get(user: AuthUser, id: number) {
    const order = await this.prisma.factoryOrder.findUnique({ where: { id }, include: orderInclude });
    if (!order) throw new NotFoundException('Order not found.');
    const scope = factoryScope(user);
    // 404 instead of 403 so a factory cannot find out which order numbers exist.
    if (scope !== undefined && order.factoryId !== scope) throw new NotFoundException('Order not found.');
    return order;
  }

  /**
   * Places an order and reserves the stock in the same transaction.
   * Batches are locked oldest first; a batch that is only partly needed is split, and the part taken
   * becomes a "reserved" batch. If any item cannot be covered, nothing is reserved.
   */
  async create(user: AuthUser, dto: CreateOrderDto) {
    if (user.role !== 'factory') throw new ForbiddenException('Only a factory login can place orders.');
    const factoryId = factoryScope(user)!;

    // Same material and grade twice in one order become one line; fixed order avoids lock cycles between orders.
    const wanted = new Map<string, { materialTypeId: number; grade?: string; quantityKg: Prisma.Decimal }>();
    for (const item of dto.items) {
      const key = `${item.materialTypeId}|${item.grade ?? ''}`;
      const prev = wanted.get(key);
      wanted.set(key, { ...item, quantityKg: (prev?.quantityKg ?? D(0)).add(D(item.quantityKg)) });
    }
    const lines = [...wanted.values()].sort((a, b) => a.materialTypeId - b.materialTypeId || (a.grade ?? '').localeCompare(b.grade ?? ''));

    const materials = await this.prisma.materialType.findMany({ where: { id: { in: lines.map((l) => l.materialTypeId) } } });
    const material = new Map(materials.map((m) => [m.id, m]));
    for (const line of lines) {
      const m = material.get(line.materialTypeId);
      if (!m?.isActive) throw new UnprocessableEntityException({ code: 'material_unavailable', message: `Material ${line.materialTypeId} is not available.` });
    }

    const orderId = await this.prisma.$transaction(async (tx) => {
      const order = await tx.factoryOrder.create({ data: { factoryId } });
      for (const line of lines) {
        const unitPrice = material.get(line.materialTypeId)!.pricePerKg;
        const takes = await this.reserve(tx, line);
        for (const take of takes) {
          await tx.orderItem.create({
            data: { orderId: order.id, materialTypeId: line.materialTypeId, batchId: take.batchId, quantityKg: take.takeKg, unitPrice },
          });
        }
      }
      await this.notifyFactory(tx, factoryId, 'Order placed', `Order ${order.id} was placed and the stock is reserved.`);
      return order.id;
    });
    return this.get(user, orderId);
  }

  /** Reserves `line.quantityKg` and returns the batches used (whole or split). */
  private async reserve(tx: Tx, line: { materialTypeId: number; grade?: string; quantityKg: Prisma.Decimal }) {
    // Lock first, then read: a second order waits here and then sees what the first one left.
    if (line.grade) {
      await tx.$queryRaw`SELECT id FROM batches WHERE "materialTypeId" = ${line.materialTypeId} AND grade = ${line.grade} AND status = 'in_stock' ORDER BY id FOR UPDATE`;
    } else {
      await tx.$queryRaw`SELECT id FROM batches WHERE "materialTypeId" = ${line.materialTypeId} AND status = 'in_stock' ORDER BY id FOR UPDATE`;
    }
    const batches = await tx.batch.findMany({
      where: { materialTypeId: line.materialTypeId, status: 'in_stock', ...(line.grade ? { grade: line.grade } : {}) },
      orderBy: { id: 'asc' },
    });
    const plan = planAllocation(batches, line.quantityKg);
    if (!plan) {
      const available = batches.reduce((sum, b) => sum.add(b.weightKg), D(0));
      throw new ConflictException({
        code: 'insufficient_stock',
        message: 'Not enough stock for this material.',
        details: { materialTypeId: line.materialTypeId, grade: line.grade ?? null, requestedKg: line.quantityKg, availableKg: available },
      });
    }

    const byId = new Map(batches.map((b) => [b.id, b]));
    for (const take of plan) {
      const batch = byId.get(take.batchId)!;
      if (!take.split) {
        await tx.batch.update({ where: { id: batch.id }, data: { status: 'reserved' } });
      } else {
        await tx.batch.update({ where: { id: batch.id }, data: { weightKg: batch.weightKg.sub(take.takeKg) } });
        const part = await tx.batch.create({
          data: { warehouseId: batch.warehouseId, materialTypeId: batch.materialTypeId, grade: batch.grade, weightKg: take.takeKg, status: 'reserved' },
        });
        take.batchId = part.id;
      }
    }
    return plan;
  }

  /** Factory: only a placed order. Admin: until it is dispatched. Reserved stock goes back on the shelf. */
  async cancel(user: AuthUser, id: number) {
    const order = await this.get(user, id);
    if (user.role !== 'admin' && !factoryMayCancel(order.status)) {
      throw new ConflictException({ code: 'order_not_cancellable', message: 'This order was already confirmed. Contact EcoPlus to cancel it.' });
    }
    if (!canMoveOrder(order.status, 'cancelled')) {
      throw new ConflictException({ code: 'order_not_cancellable', message: `An order that is ${order.status} cannot be cancelled.` });
    }
    await this.prisma.$transaction(async (tx) => {
      const moved = await tx.factoryOrder.updateMany({ where: { id, status: order.status }, data: { status: 'cancelled' } });
      if (moved.count === 0) throw new ConflictException('The order changed. Reload and try again.');
      await tx.batch.updateMany({ where: { id: { in: order.items.map((i) => i.batchId!).filter(Boolean) }, status: 'reserved' }, data: { status: 'in_stock' } });
      await this.notifyFactory(tx, order.factoryId, 'Order cancelled', `Order ${id} was cancelled and the stock was released.`);
    });
    return this.get(user, id);
  }

  /** Admin: confirm, dispatch, deliver. Delivering sells the batches and issues the invoice. */
  async advance(user: AuthUser, id: number, to: Extract<OrderStatus, 'confirmed' | 'dispatched' | 'delivered'>) {
    const order = await this.get(user, id);
    if (!canMoveOrder(order.status, to)) {
      throw new ConflictException({ code: 'invalid_order_status', message: `An order that is ${order.status} cannot become ${to}.` });
    }
    await this.prisma.$transaction(async (tx) => {
      const moved = await tx.factoryOrder.updateMany({
        where: { id, status: order.status },
        data: { status: to, ...(to === 'delivered' ? { deliveredAt: new Date() } : {}) },
      });
      if (moved.count === 0) throw new ConflictException('The order changed. Reload and try again.');

      if (to === 'delivered') {
        await tx.batch.updateMany({ where: { id: { in: order.items.map((i) => i.batchId!).filter(Boolean) } }, data: { status: 'sold' } });
        await this.issueInvoice(tx, id, order.items);
      }
      await this.notifyFactory(tx, order.factoryId, `Order ${to}`, `Order ${id} is now ${to}.`);
    });
    return this.get(user, id);
  }

  private async issueInvoice(tx: Tx, orderId: number, items: { quantityKg: Prisma.Decimal; unitPrice: Prisma.Decimal }[]) {
    const total = items.reduce((sum, i) => sum.add(i.quantityKg.mul(i.unitPrice)), D(0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    // Take the id first so the invoice number can contain it without a second write.
    const [{ id }] = await tx.$queryRaw<{ id: bigint }[]>`SELECT nextval(pg_get_serial_sequence('invoices', 'id')) AS id`;
    const dueDays = this.config.get('INVOICE_DUE_DAYS', { infer: true });
    const now = new Date();
    await tx.invoice.create({
      data: {
        id: Number(id),
        orderId,
        number: `ECO-INV-${now.getUTCFullYear()}-${String(id).padStart(6, '0')}`,
        total,
        dueAt: new Date(now.getTime() + dueDays * 86_400_000),
      },
    });
  }

  private async notifyFactory(tx: Tx, factoryId: number, title: string, body: string) {
    const users = await tx.user.findMany({ where: { factoryId, role: 'factory', isActive: true }, select: { id: true } });
    for (const u of users) await this.notifications.notify(u.id, title, body, tx);
    // Push is sent by the caller after the commit would be cleaner; for now it is best effort and never fails the request.
    void Promise.all(users.map((u) => this.push.sendToUser(u.id, title)));
  }
}
