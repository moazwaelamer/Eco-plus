import { randomInt } from 'node:crypto';
import { ConflictException, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dateOnly, todayIn } from '../common/dates.js';
import type { Env } from '../config/env.js';
import { type Page, toPage } from '../common/pagination.js';
import type { Prisma } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PushService } from '../push/push.service.js';
import { orderWithGoogle } from './google-routes.js';
import type { CreateRouteDto, ListRoutesDto, ReorderRouteDto } from './routes.schemas.js';
import { type StopPoint, nearestNeighbourOrder } from './stop-order.js';

/** Stop numbers are temporarily shifted by this much while reordering, because (route, order) is unique. */
const REORDER_OFFSET = 100_000;

const routeInclude = {
  driver: { select: { userId: true, user: { select: { name: true, phone: true } } } },
  vehicle: true,
  stops: {
    orderBy: { stopOrder: 'asc' },
    include: {
      shipment: {
        select: {
          id: true,
          qrCode: true,
          status: true,
          gpsLat: true,
          gpsLng: true,
          handoverCode: true,
          request: { select: { scan: { select: { user: { select: { name: true, phone: true } } } } } },
        },
      },
    },
  },
} satisfies Prisma.RouteInclude;

export type RouteWithStops = Prisma.RouteGetPayload<{ include: typeof routeInclude }>;

const newHandoverCode = () => randomInt(0, 1_000_000).toString().padStart(6, '0');

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  /** Admin view: the full route, including each shipment's handover code. */
  async get(id: number): Promise<RouteWithStops> {
    const route = await this.prisma.route.findUnique({ where: { id }, include: routeInclude });
    if (!route) throw new NotFoundException('Route not found.');
    return route;
  }

  async list({ limit, cursor, date, driverId, status }: ListRoutesDto): Promise<Page<RouteWithStops>> {
    const rows = await this.prisma.route.findMany({
      where: { ...(date ? { routeDate: dateOnly(date) } : {}), ...(driverId ? { driverId } : {}), ...(status ? { status } : {}) },
      include: routeInclude,
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  /**
   * Puts shipments on a route for a driver and vehicle.
   * One transaction: every shipment becomes "assigned" with a fresh handover code, its request becomes
   * "scheduled" and its owner gets a notification. If any shipment is not available, nothing changes.
   */
  async create(dto: CreateRouteDto): Promise<RouteWithStops> {
    const today = todayIn(this.config.get('APP_TIMEZONE', { infer: true }));
    if (dto.routeDate < today) {
      throw new UnprocessableEntityException({ code: 'route_in_the_past', message: 'The route date cannot be in the past.' });
    }

    const driver = await this.prisma.driver.findUnique({ where: { userId: dto.driverId }, include: { user: { select: { isActive: true } } } });
    if (!driver || !driver.user.isActive) throw new NotFoundException('Driver not found or not active.');
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle?.isActive) throw new NotFoundException('Vehicle not found or not active.');

    const shipments = await this.prisma.shipment.findMany({
      where: { id: { in: dto.shipmentIds } },
      include: { request: { select: { scan: { select: { userId: true } } } } },
    });
    const byId = new Map(shipments.map((s) => [s.id, s]));
    const missing = dto.shipmentIds.filter((id) => !byId.has(id));
    if (missing.length > 0) throw new NotFoundException(`Shipments not found: ${missing.join(', ')}.`);
    const unavailable = shipments.filter((s) => s.status !== 'created').map((s) => s.id);
    if (unavailable.length > 0) {
      throw new ConflictException({
        code: 'shipments_not_available',
        message: `These shipments are not waiting for a driver: ${unavailable.join(', ')}.`,
        details: { shipmentIds: unavailable },
      });
    }

    const points: StopPoint[] = shipments.map((s) => ({ id: s.id, lat: s.gpsLat, lng: s.gpsLng }));
    const ordered = await this.orderStops(points, dto.start);

    const routeId = await this.prisma.$transaction(async (tx) => {
      const busy = await tx.route.findFirst({
        where: { driverId: dto.driverId, routeDate: dateOnly(dto.routeDate), status: { in: ['planned', 'in_progress'] } },
        select: { id: true },
      });
      if (busy) throw new ConflictException(`This driver already has route ${busy.id} on ${dto.routeDate}.`);

      // The status check inside the update is what makes two admins unable to take the same shipment.
      const claimed = await tx.shipment.updateMany({
        where: { id: { in: dto.shipmentIds }, status: 'created' },
        data: { status: 'assigned' },
      });
      if (claimed.count !== dto.shipmentIds.length) {
        throw new ConflictException({ code: 'shipments_not_available', message: 'Some shipments were taken by someone else. Reload and try again.' });
      }

      const route = await tx.route.create({
        data: {
          driverId: dto.driverId,
          vehicleId: dto.vehicleId,
          routeDate: dateOnly(dto.routeDate),
          stops: { create: ordered.map((p, i) => ({ shipmentId: p.id, stopOrder: i + 1 })) },
        },
      });

      for (const shipment of shipments) {
        const handoverCode = newHandoverCode();
        await tx.shipment.update({ where: { id: shipment.id }, data: { handoverCode } });
        await tx.pickupRequest.update({ where: { id: shipment.requestId }, data: { status: 'scheduled' } });
        await this.notifications.notify(
          shipment.request.scan.userId,
          'Pickup scheduled',
          `A driver will collect your bag ${shipment.qrCode} on ${dto.routeDate}. Give the driver this code when they arrive: ${handoverCode}.`,
          tx,
        );
      }
      return route.id;
    });

    for (const shipment of shipments) await this.push.sendToUser(shipment.request.scan.userId, 'Pickup scheduled');
    return this.get(routeId);
  }

  /** Manual order. The list must contain exactly the shipments already on the route. Planned routes only. */
  async reorder(id: number, dto: ReorderRouteDto): Promise<RouteWithStops> {
    const route = await this.getPlanned(id);
    const current = route.stops.map((s) => s.shipmentId).sort((a, b) => a - b);
    const wanted = [...dto.shipmentIds].sort((a, b) => a - b);
    if (current.length !== wanted.length || current.some((v, i) => v !== wanted[i])) {
      throw new UnprocessableEntityException({ code: 'stops_mismatch', message: 'Send exactly the shipments that are on this route.' });
    }
    await this.prisma.$transaction((tx) => this.renumber(tx, id, dto.shipmentIds));
    return this.get(id);
  }

  /** Takes one shipment off a planned route; it goes back to waiting for a driver. */
  async removeStop(id: number, shipmentId: number): Promise<RouteWithStops | { deleted: true }> {
    const route = await this.getPlanned(id);
    if (!route.stops.some((s) => s.shipmentId === shipmentId)) throw new NotFoundException('That shipment is not on this route.');
    return this.prisma.$transaction(async (tx) => {
      await this.release(tx, [shipmentId]);
      await tx.routeStop.deleteMany({ where: { routeId: id, shipmentId } });
      const left = route.stops.filter((s) => s.shipmentId !== shipmentId).map((s) => s.shipmentId);
      if (left.length === 0) {
        await tx.route.delete({ where: { id } });
        return { deleted: true as const };
      }
      await this.renumber(tx, id, left);
      return tx.route.findUniqueOrThrow({ where: { id }, include: routeInclude });
    });
  }

  /** Cancels a planned route; all its shipments go back to waiting for a driver. */
  async remove(id: number): Promise<void> {
    const route = await this.getPlanned(id);
    await this.prisma.$transaction(async (tx) => {
      await this.release(tx, route.stops.map((s) => s.shipmentId));
      await tx.route.delete({ where: { id } });
    });
  }

  // ---------- helpers ----------

  private async getPlanned(id: number): Promise<RouteWithStops> {
    const route = await this.get(id);
    if (route.status !== 'planned') {
      throw new ConflictException({ code: 'route_not_planned', message: 'Only a route that has not started can be changed.' });
    }
    return route;
  }

  /** Google Routes API when a key is set and a start point is known; otherwise (or on any failure) nearest-neighbour. */
  private async orderStops(points: StopPoint[], start?: { lat: number; lng: number }): Promise<StopPoint[]> {
    const apiKey = this.config.get('GOOGLE_ROUTES_API_KEY', { infer: true });
    if (apiKey && start) {
      try {
        return await orderWithGoogle(apiKey, start, points);
      } catch (e) {
        this.logger.warn(`Routes API unavailable, using nearest-neighbour: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return nearestNeighbourOrder(points, start);
  }

  private async renumber(tx: Prisma.TransactionClient, routeId: number, shipmentIds: number[]): Promise<void> {
    await tx.routeStop.updateMany({ where: { routeId }, data: { stopOrder: { increment: REORDER_OFFSET } } });
    for (const [i, shipmentId] of shipmentIds.entries()) {
      await tx.routeStop.update({ where: { shipmentId }, data: { stopOrder: i + 1 } });
    }
  }

  /** Back to "waiting for a driver": shipment created, request open, handover code cleared. */
  private async release(tx: Prisma.TransactionClient, shipmentIds: number[]): Promise<void> {
    const shipments = await tx.shipment.findMany({
      where: { id: { in: shipmentIds } },
      include: { request: { select: { scan: { select: { userId: true } } } } },
    });
    await tx.shipment.updateMany({ where: { id: { in: shipmentIds } }, data: { status: 'created', handoverCode: null } });
    await tx.pickupRequest.updateMany({ where: { id: { in: shipments.map((s) => s.requestId) } }, data: { status: 'open' } });
    for (const s of shipments) {
      await this.notifications.notify(
        s.request.scan.userId,
        'Pickup rescheduled',
        `Your bag ${s.qrCode} is waiting for a new pickup time. The earlier code no longer works.`,
        tx,
      );
    }
  }
}
