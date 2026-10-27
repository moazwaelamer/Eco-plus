import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dateOnly, todayIn } from '../common/dates.js';
import type { Env } from '../config/env.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PushService } from '../push/push.service.js';
import type { RouteWithStops } from './routes.service.js';

/**
 * What a driver may see of a route: where to go and who to meet, never the handover code.
 * The code is what proves the customer handed the bag over, so only the customer (and admin) hold it.
 */
function toDriverView(route: RouteWithStops) {
  return {
    id: route.id,
    routeDate: route.routeDate,
    status: route.status,
    vehicle: { id: route.vehicle.id, plate: route.vehicle.plate, type: route.vehicle.type },
    stops: route.stops.map((s) => ({
      stopOrder: s.stopOrder,
      shipmentId: s.shipment.id,
      status: s.shipment.status,
      collectedAt: s.collectedAt,
      lat: s.shipment.gpsLat,
      lng: s.shipment.gpsLng,
      customer: s.shipment.request.scan.user,
    })),
  };
}

@Injectable()
export class DriverRoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  private include = {
    vehicle: true,
    driver: { select: { userId: true, user: { select: { name: true, phone: true } } } },
    stops: {
      orderBy: { stopOrder: 'asc' as const },
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
  };

  /** The driver's routes for a day (today in the app time zone by default). */
  async mine(driverId: number, date?: string) {
    const day = date ?? todayIn(this.config.get('APP_TIMEZONE', { infer: true }));
    const routes = await this.prisma.route.findMany({
      where: { driverId, routeDate: dateOnly(day) },
      include: this.include,
      orderBy: { id: 'asc' },
    });
    return { date: day, routes: routes.map(toDriverView) };
  }

  /** Planned -> in progress. A driver can run one route at a time. */
  async start(driverId: number, routeId: number) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId }, select: { driverId: true, status: true, routeDate: true } });
    if (!route) throw new NotFoundException('Route not found.');
    if (route.driverId !== driverId) throw new ForbiddenException('This route belongs to another driver.');
    const today = todayIn(this.config.get('APP_TIMEZONE', { infer: true }));
    if (route.routeDate.toISOString().slice(0, 10) !== today) {
      throw new UnprocessableEntityException({ code: 'not_today', message: 'A route can only be started on its own day.' });
    }

    await this.prisma.$transaction(async (tx) => {
      const running = await tx.route.findFirst({ where: { driverId, status: 'in_progress' }, select: { id: true } });
      if (running) throw new ConflictException(`Finish route ${running.id} before starting another.`);
      const started = await tx.route.updateMany({ where: { id: routeId, status: 'planned' }, data: { status: 'in_progress' } });
      if (started.count === 0) throw new ConflictException('This route was already started.');
      await tx.driver.update({ where: { userId: driverId }, data: { status: 'on_route' } });
    });
    return this.one(routeId);
  }

  /**
   * The customer shows a 6 digit code; the driver types it. Only a right code on a stop of the
   * driver's own running route marks the bag as collected.
   */
  async collect(driverId: number, shipmentId: number, handoverCode: string) {
    const stop = await this.prisma.routeStop.findUnique({
      where: { shipmentId },
      include: {
        route: { select: { id: true, driverId: true, status: true } },
        shipment: { include: { request: { select: { scan: { select: { userId: true } } } } } },
      },
    });
    if (!stop) throw new NotFoundException('This shipment is not on a route.');
    if (stop.route.driverId !== driverId) throw new ForbiddenException('This stop belongs to another driver.');
    if (stop.route.status !== 'in_progress') {
      throw new ConflictException({ code: 'route_not_started', message: 'Start the route before collecting.' });
    }
    if (stop.shipment.handoverCode === null || stop.shipment.handoverCode !== handoverCode) {
      throw new UnprocessableEntityException({ code: 'wrong_handover_code', message: 'The code does not match. Ask the customer to check it in the app.' });
    }

    const routeFinished = await this.prisma.$transaction(async (tx) => {
      // Only one request can win this: the status check is part of the update.
      const moved = await tx.shipment.updateMany({ where: { id: shipmentId, status: 'assigned' }, data: { status: 'collected' } });
      if (moved.count === 0) throw new ConflictException('This bag was already collected.');
      await tx.pickupRequest.update({ where: { id: stop.shipment.requestId }, data: { status: 'collected' } });
      await tx.routeStop.update({ where: { shipmentId }, data: { collectedAt: new Date() } });
      await this.notifications.notify(
        stop.shipment.request.scan.userId,
        'Bag collected',
        `Your bag ${stop.shipment.qrCode} was collected. You will get your points after it is weighed.`,
        tx,
      );

      const remaining = await tx.routeStop.count({ where: { routeId: stop.route.id, collectedAt: null } });
      if (remaining > 0) return false;
      await tx.route.update({ where: { id: stop.route.id }, data: { status: 'done' } });
      await tx.driver.update({ where: { userId: driverId }, data: { status: 'available' } });
      return true;
    });

    await this.push.sendToUser(stop.shipment.request.scan.userId, 'Bag collected');
    return { shipmentId, status: 'collected' as const, routeFinished };
  }

  private async one(routeId: number) {
    const route = await this.prisma.route.findUniqueOrThrow({ where: { id: routeId }, include: this.include });
    return toDriverView(route);
  }
}
