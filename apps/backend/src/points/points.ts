import { Prisma } from '../generated/prisma/client.js';

type Num = Prisma.Decimal | number | string;

/**
 * points = round(weight_kg x material point factor x level multiplier), rounded half up to a whole number.
 * Decimal arithmetic avoids floating point surprises (for example 0.1 + 0.2).
 */
export function calculatePoints(weightKg: Num, pointFactor: Num, multiplier: Num): number {
  return new Prisma.Decimal(weightKg)
    .mul(pointFactor)
    .mul(multiplier)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber();
}

export interface LevelRow {
  id: number;
  name: string;
  minPoints: number;
  multiplier: Num;
}

/** The highest level whose threshold the total has reached. `levels` may be in any order. */
export function levelForPoints<L extends { minPoints: number }>(totalPoints: number, levels: L[]): L {
  const sorted = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0]!;
  for (const level of sorted) if (totalPoints >= level.minPoints) current = level;
  return current;
}
