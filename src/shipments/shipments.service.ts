import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { toPage } from '../common/pagination.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { QR_PATTERN } from './qr.js';
import { canTransition } from './shipment-status.js';
import type { ListShipmentsDto } from './shipments.schemas.js';

const STAFF = ['admin', 'employee'];

const withDetails = {
  request: { include: { scan: { select: { id: true, userId: true, imageUrl: true, contentType: true, fillLevel: true } } } },
  weighing: true,
} as const;

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Customers see their own shipments; admin and employee see all. */
  async list(user: AuthUser, { limit, cursor, status }: ListShipmentsDto) {
    const rows = await this.prisma.shipment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(STAFF.includes(user.role) ? {} : { request: { scan: { userId: user.id } } }),
      },
      include: withDetails,
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  async get(user: AuthUser, id: number) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id }, include: withDetails });
    if (!shipment) throw new NotFoundException('Shipment not found.');
    if (shipment.request.scan.userId !== user.id && !STAFF.includes(user.role)) {
      throw new ForbiddenException('This shipment belongs to someone else.');
    }
    return shipment;
  }

  /** Used by the employee after scanning the QR code. */
  async getByQr(code: string) {
    const normalized = code.trim().toUpperCase();
    if (!QR_PATTERN.test(normalized)) throw new NotFoundException('Shipment not found.');
    const shipment = await this.prisma.shipment.findUnique({ where: { qrCode: normalized }, include: withDetails });
    if (!shipment) throw new NotFoundException('Shipment not found.');
    return shipment;
  }

  /** Staff mark a shipment as collected. The driver app (Phase 2) will do this with a handover code. */
  async markCollected(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({ where: { id }, include: { request: { include: { scan: { select: { userId: true } } } } } });
      if (!shipment) throw new NotFoundException('Shipment not found.');
      if (!canTransition(shipment.status, 'collected')) {
        throw new ConflictException(`A shipment that is ${shipment.status} cannot be marked as collected.`);
      }
      await tx.pickupRequest.update({ where: { id: shipment.requestId }, data: { status: 'collected' } });
      const updated = await tx.shipment.update({ where: { id }, data: { status: 'collected' } });
      await this.notifications.notify(
        shipment.request.scan.userId,
        'Bag collected',
        `Your bag ${shipment.qrCode} was collected. You will get your points after it is weighed.`,
        tx,
      );
      return updated;
    });
  }
}
