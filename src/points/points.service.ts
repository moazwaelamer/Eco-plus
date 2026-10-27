import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { type Pagination, toPage } from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculatePoints, levelForPoints } from './points.js';

type Tx = Prisma.TransactionClient;

/** "Sara Test" -> "Sara T." so the leaderboard shows people without exposing full names. */
export function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? 'User';
  return `${parts[0]} ${parts[parts.length - 1]![0]!.toUpperCase()}.`;
}

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes the points for one accepted weighing, inside the caller's transaction.
   * Appends to the ledger, updates the cached total and moves the citizen up a level when a threshold is reached.
   * Returns null for users without points (businesses) and 0 points when the weight is too small to count.
   */
  async awardForWeighing(
    tx: Tx,
    args: { userId: number; weighingId: number; weightKg: Prisma.Decimal; pointFactor: Prisma.Decimal },
  ) {
    const profile = await tx.citizenProfile.findUnique({ where: { userId: args.userId }, include: { level: true } });
    if (!profile) return null;

    const points = calculatePoints(args.weightKg, args.pointFactor, profile.level.multiplier);
    if (points <= 0) return { points: 0, totalPoints: profile.totalPoints, level: profile.level.name, leveledUp: false };

    await tx.pointsLedger.create({
      data: { userId: args.userId, weighingId: args.weighingId, points, reason: 'earned' },
    });
    const updated = await tx.citizenProfile.update({
      where: { userId: args.userId },
      data: { totalPoints: { increment: points } },
    });

    const levels = await tx.level.findMany();
    const target = levelForPoints(updated.totalPoints, levels);
    const leveledUp = target.id !== profile.levelId;
    if (leveledUp) await tx.citizenProfile.update({ where: { userId: args.userId }, data: { levelId: target.id } });

    return { points, totalPoints: updated.totalPoints, level: target.name, leveledUp };
  }

  async mine(userId: number, { limit, cursor }: Pagination) {
    const profile = await this.prisma.citizenProfile.findUnique({ where: { userId }, include: { level: true } });
    if (!profile) throw new ForbiddenException('Only citizens earn points.');

    const levels = await this.prisma.level.findMany({ orderBy: { minPoints: 'asc' } });
    const next = levels.find((l) => l.minPoints > profile.totalPoints) ?? null;
    const rows = await this.prisma.pointsLedger.findMany({
      where: { userId },
      include: { weighing: { select: { actualWeightKg: true, shipmentId: true, materialType: { select: { name: true } } } } },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return {
      balance: profile.totalPoints,
      level: { name: profile.level.name, multiplier: profile.level.multiplier, minPoints: profile.level.minPoints },
      nextLevel: next ? { name: next.name, minPoints: next.minPoints, pointsToGo: next.minPoints - profile.totalPoints } : null,
      history: toPage(rows, limit),
    };
  }

  async leaderboard(callerId: number, limit = 20) {
    const top = await this.prisma.citizenProfile.findMany({
      orderBy: [{ totalPoints: 'desc' }, { userId: 'asc' }],
      take: limit,
      include: { user: { select: { name: true } }, level: { select: { name: true } } },
    });
    const entries = top.map((p, i) => ({
      rank: i + 1,
      name: displayName(p.user.name),
      points: p.totalPoints,
      level: p.level.name,
      isMe: p.userId === callerId,
    }));

    const mine = await this.prisma.citizenProfile.findUnique({ where: { userId: callerId } });
    const me = mine
      ? {
          rank: (await this.prisma.citizenProfile.count({ where: { totalPoints: { gt: mine.totalPoints } } })) + 1,
          points: mine.totalPoints,
        }
      : null;
    return { entries, me };
  }
}
