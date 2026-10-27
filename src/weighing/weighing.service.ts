import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PointsService } from '../points/points.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { WeighDto } from './weighing.schemas.js';

const DEFAULT_GRADE = 'A';

@Injectable()
export class WeighingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * The weighed value is the ground truth. In ONE transaction: save the weighing, add the points,
   * add the weight to a warehouse batch, set the shipment status and notify the user.
   * If any step fails nothing is saved. Sending the same weighing twice returns the first result.
   */
  weigh(employeeUserId: number, shipmentId: number, dto: WeighDto) {
    return this.prisma.$transaction(async (tx) => {
      // Lock the shipment row so two simultaneous submits are handled one after the other.
      await tx.$queryRaw`SELECT id FROM shipments WHERE id = ${shipmentId} FOR UPDATE`;

      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          weighing: true,
          request: { include: { scan: { select: { userId: true, user: { select: { role: true } } } } } },
        },
      });
      if (!shipment) throw new NotFoundException('Shipment not found.');

      const weight = new Prisma.Decimal(dto.actualWeightKg);

      if (shipment.weighing) {
        const w = shipment.weighing;
        const same =
          w.employeeId === employeeUserId &&
          w.accepted === dto.accepted &&
          w.actualWeightKg.equals(weight) &&
          (w.materialTypeId ?? undefined) === dto.materialTypeId;
        if (!same) throw new ConflictException({ code: 'already_weighed', message: 'This shipment was already weighed with different values.' });
        const earned = await tx.pointsLedger.aggregate({ where: { weighingId: w.id }, _sum: { points: true } });
        return { weighing: w, pointsAwarded: earned._sum.points ?? 0, replay: true as const };
      }

      if (shipment.status !== 'collected') {
        throw new ConflictException({ code: 'not_collected', message: `A shipment that is ${shipment.status} cannot be weighed.` });
      }

      const employee = await tx.employee.findUnique({ where: { userId: employeeUserId } });
      if (!employee) throw new ForbiddenException('Your account is not linked to a warehouse.');

      let material = null;
      if (dto.materialTypeId !== undefined) {
        material = await tx.materialType.findFirst({ where: { id: dto.materialTypeId, isActive: true } });
        if (!material) throw new UnprocessableEntityException({ code: 'unknown_material', message: 'This material does not exist or is switched off.' });
      }

      const customerId = shipment.request.scan.userId;
      const grade = dto.grade ?? DEFAULT_GRADE;

      if (!dto.accepted) {
        const weighing = await tx.weighingRecord.create({
          data: {
            shipmentId,
            employeeId: employeeUserId,
            materialTypeId: material?.id,
            actualWeightKg: weight,
            grade: dto.grade,
            accepted: false,
            rejectReason: dto.rejectReason,
          },
        });
        await tx.shipment.update({ where: { id: shipmentId }, data: { status: 'rejected' } });
        await this.notifications.notify(
          customerId,
          'Bag could not be accepted',
          `Your bag ${shipment.qrCode} was weighed at ${weight.toString()} kg but not accepted: ${dto.rejectReason}. No points were added.`,
          tx,
        );
        return { weighing, pointsAwarded: 0, replay: false as const };
      }

      // Accepted: add to the open batch for this warehouse, material and grade (or start one).
      const open = await tx.batch.findFirst({
        where: { warehouseId: employee.warehouseId, materialTypeId: material!.id, grade, status: 'in_stock' },
        orderBy: { id: 'asc' },
      });
      const batch = open
        ? await tx.batch.update({ where: { id: open.id }, data: { weightKg: { increment: weight } } })
        : await tx.batch.create({
            data: { warehouseId: employee.warehouseId, materialTypeId: material!.id, weightKg: weight, grade },
          });

      const weighing = await tx.weighingRecord.create({
        data: {
          shipmentId,
          employeeId: employeeUserId,
          materialTypeId: material!.id,
          batchId: batch.id,
          actualWeightKg: weight,
          grade,
          accepted: true,
        },
      });

      const award = await this.points.awardForWeighing(tx, {
        userId: customerId,
        weighingId: weighing.id,
        weightKg: weight,
        pointFactor: material!.pointFactor,
      });

      await tx.shipment.update({ where: { id: shipmentId }, data: { status: 'weighed' } });

      const pointsText = award && award.points > 0 ? ` You earned ${award.points} points.` : '';
      await this.notifications.notify(
        customerId,
        'Bag weighed',
        `Your bag ${shipment.qrCode} weighed ${weight.toString()} kg (${material!.name}).${pointsText}`,
        tx,
      );

      return {
        weighing,
        pointsAwarded: award?.points ?? 0,
        totalPoints: award?.totalPoints,
        level: award?.level,
        leveledUp: award?.leveledUp ?? false,
        batch: { id: batch.id, weightKg: batch.weightKg, grade: batch.grade },
        replay: false as const,
      };
    });
  }
}
