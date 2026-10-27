import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '../auth/auth-user.js';
import type { Env } from '../config/env.js';
import { boundingBox, distanceMeters } from '../common/geo.js';
import { type Pagination, toPage } from '../common/pagination.js';
import type { RequestChannel, SourceType } from '../generated/prisma/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateQrCode } from '../shipments/qr.js';
import { canTransition } from '../shipments/shipment-status.js';
import { type Decision, decidePickup } from './decision.js';

const STAFF = ['admin', 'employee'];

export interface CreateFromScanOptions {
  scanId: number;
  channel: RequestChannel;
  /** Set when staff create the request for a customer. */
  createdById?: number;
}

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Turns a scan into a pickup request and, when the bag is full enough, a shipment with a QR code.
   * A bag that is not full enough gets decision "wait" and nothing is stored.
   */
  async createFromScan(opts: CreateFromScanOptions) {
    const scan = await this.prisma.bagScan.findUnique({
      where: { id: opts.scanId },
      include: {
        user: { select: { id: true, role: true, citizenProfile: true, businessProfile: true } },
        request: { select: { id: true } },
      },
    });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (scan.request) throw new ConflictException('A pickup was already requested for this scan.');
    if (scan.fillLevel === null) {
      throw new UnprocessableEntityException({ code: 'fill_level_required', message: 'Say how full the bag is before requesting a pickup.' });
    }

    const sourceType: SourceType = scan.user.role === 'business' ? 'business' : 'household';
    const profile = scan.user.citizenProfile ?? scan.user.businessProfile;
    const gpsLat = scan.lat ?? profile?.lat ?? null;
    const gpsLng = scan.lng ?? profile?.lng ?? null;

    const rules = {
      readyFillThreshold: this.config.get('READY_FILL_THRESHOLD', { infer: true }),
      businessReadyFillThreshold: this.config.get('BUSINESS_READY_FILL_THRESHOLD', { infer: true }),
      mergeMinFill: this.config.get('MERGE_MIN_FILL', { infer: true }),
    };
    // Only look for neighbours when the bag is below the normal threshold; a full bag is "ready" anyway.
    let nearby = false;
    if (gpsLat !== null && gpsLng !== null && decidePickup(scan.fillLevel, sourceType, rules) === 'wait') {
      nearby = await this.hasOpenShipmentNearby({ lat: gpsLat, lng: gpsLng });
    }
    const decision: Decision = decidePickup(scan.fillLevel, sourceType, rules, nearby);
    if (decision === 'wait') {
      return { decision, request: null, shipment: null, message: 'The bag is not full enough yet. Scan again when it is fuller.' };
    }

    if (gpsLat === null || gpsLng === null) {
      throw new UnprocessableEntityException({ code: 'location_required', message: 'Add the pickup location to the scan or to your profile.' });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let qrCode = generateQrCode();
      while (await tx.shipment.findUnique({ where: { qrCode }, select: { id: true } })) qrCode = generateQrCode();

      const request = await tx.pickupRequest.create({
        data: { scanId: scan.id, decision, channel: opts.channel, createdById: opts.createdById },
      });
      const shipment = await tx.shipment.create({
        data: { requestId: request.id, qrCode, gpsLat, gpsLng, sourceType },
      });
      await this.notifications.notify(
        scan.userId,
        'Pickup requested',
        `Your pickup request was created. Shipment code: ${qrCode}.`,
        tx,
      );
      return { request, shipment };
    });

    return {
      decision,
      ...result,
      message: decision === 'merge' ? 'Pickup requested. A driver is already collecting nearby, so your bag rides along.' : 'Pickup requested.',
    };
  }

  /** True when another shipment that has not been collected yet is within MERGE_RADIUS_M metres. */
  private async hasOpenShipmentNearby(point: { lat: number; lng: number }): Promise<boolean> {
    const radius = this.config.get('MERGE_RADIUS_M', { infer: true });
    const box = boundingBox(point, radius);
    const candidates = await this.prisma.shipment.findMany({
      where: {
        status: { in: ['created', 'assigned'] },
        gpsLat: { gte: box.minLat, lte: box.maxLat },
        gpsLng: { gte: box.minLng, lte: box.maxLng },
      },
      select: { gpsLat: true, gpsLng: true },
      take: 50,
    });
    return candidates.some((c) => distanceMeters(point, { lat: c.gpsLat, lng: c.gpsLng }) <= radius);
  }

  async list(userId: number, { limit, cursor }: Pagination) {
    const rows = await this.prisma.pickupRequest.findMany({
      where: { scan: { userId } },
      include: { shipment: true },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  async get(user: AuthUser, id: number) {
    const request = await this.prisma.pickupRequest.findUnique({
      where: { id },
      include: { shipment: true, scan: { select: { userId: true } } },
    });
    if (!request) throw new NotFoundException('Pickup request not found.');
    if (request.scan.userId !== user.id && !STAFF.includes(user.role)) {
      throw new ForbiddenException('This request belongs to someone else.');
    }
    return request;
  }

  /** Only while nothing has been collected yet. Releases the shipment too. */
  async cancel(user: AuthUser, id: number) {
    const request = await this.get(user, id);
    if (request.status !== 'open' || !request.shipment || !canTransition(request.shipment.status, 'cancelled')) {
      throw new ConflictException('This request can no longer be cancelled.');
    }
    const shipmentId = request.shipment.id;
    return this.prisma.$transaction(async (tx) => {
      await tx.shipment.update({ where: { id: shipmentId }, data: { status: 'cancelled' } });
      return tx.pickupRequest.update({ where: { id }, data: { status: 'cancelled' }, include: { shipment: true } });
    });
  }
}
