import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { type Pagination, toPage } from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pass a transaction client to make the notification part of the same all-or-nothing change. */
  async notify(
    userId: number,
    title: string,
    body: string,
    db: Pick<Prisma.TransactionClient, 'notification'> = this.prisma,
  ): Promise<void> {
    await db.notification.create({ data: { userId, title, body } });
  }

  async list(userId: number, { limit, cursor }: Pagination) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const unreadCount = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { ...toPage(rows, limit), unreadCount };
  }

  async markRead(userId: number, id: number) {
    const result = await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
    if (result.count === 0) throw new NotFoundException('Notification not found.');
  }

  async markAllRead(userId: number): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { updated: result.count };
  }
}
