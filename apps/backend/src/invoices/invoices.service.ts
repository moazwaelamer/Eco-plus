import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { type Pagination, toPage } from '../common/pagination.js';
import type { Invoice } from '../generated/prisma/client.js';
import { factoryScope } from '../orders/factory-scope.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** An unpaid invoice past its due date shows as "overdue" without needing a background job. */
export function withEffectiveStatus<T extends Pick<Invoice, 'status' | 'dueAt'>>(invoice: T, now = new Date()): T {
  return invoice.status === 'issued' && invoice.dueAt < now ? { ...invoice, status: 'overdue' } : invoice;
}

const include = { order: { select: { id: true, factoryId: true, deliveredAt: true } } } as const;

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, { limit, cursor }: Pagination) {
    const scope = factoryScope(user);
    const rows = await this.prisma.invoice.findMany({
      where: scope !== undefined ? { order: { factoryId: scope } } : {},
      include,
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const page = toPage(rows, limit);
    return { ...page, items: page.items.map((i) => withEffectiveStatus(i)) };
  }

  async get(user: AuthUser, id: number) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include });
    const scope = factoryScope(user);
    if (!invoice || (scope !== undefined && invoice.order.factoryId !== scope)) throw new NotFoundException('Invoice not found.');
    return withEffectiveStatus(invoice);
  }

  /** Admin records a payment. Paying twice is refused. */
  async pay(user: AuthUser, id: number) {
    await this.get(user, id);
    const updated = await this.prisma.invoice.updateMany({ where: { id, status: { not: 'paid' } }, data: { status: 'paid', paidAt: new Date() } });
    if (updated.count === 0) throw new ConflictException('This invoice is already paid.');
    return this.get(user, id);
  }
}
