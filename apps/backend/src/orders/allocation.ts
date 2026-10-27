import { Prisma } from '../generated/prisma/client.js';

export interface StockBatch {
  id: number;
  weightKg: Prisma.Decimal;
}

export interface Take {
  batchId: number;
  takeKg: Prisma.Decimal;
  /** True when only part of the batch is taken, so the batch has to be split. */
  split: boolean;
}

/**
 * Picks batches oldest first (lowest id) until `neededKg` is covered.
 * Returns null when the batches together hold less than that.
 */
export function planAllocation(batches: StockBatch[], neededKg: Prisma.Decimal): Take[] | null {
  const takes: Take[] = [];
  let left = neededKg;
  for (const batch of [...batches].sort((a, b) => a.id - b.id)) {
    if (left.lte(0)) break;
    if (batch.weightKg.lte(0)) continue;
    const takeKg = Prisma.Decimal.min(left, batch.weightKg);
    takes.push({ batchId: batch.id, takeKg, split: takeKg.lt(batch.weightKg) });
    left = left.sub(takeKg);
  }
  return left.lte(0) ? takes : null;
}
