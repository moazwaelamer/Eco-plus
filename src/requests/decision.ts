import type { SourceType } from '../generated/prisma/enums.js';

export type Decision = 'ready' | 'wait' | 'merge';

export interface DecisionRules {
  readyFillThreshold: number;
  businessReadyFillThreshold: number;
  /** Rule v2: smallest fill level that may ride along with a nearby shipment. */
  mergeMinFill?: number;
}

/**
 * Decision rule:
 * - v1: a bag is worth a trip when it is full enough (businesses use a lower threshold).
 * - v2: a bag that is not full enough is still collected ("merge") when another open shipment is nearby
 *   and the bag is at least `mergeMinFill` full, because the driver passes by anyway.
 */
export function decidePickup(
  fillLevel: number,
  sourceType: SourceType,
  rules: DecisionRules,
  hasNearbyOpenShipment = false,
): Decision {
  const threshold = sourceType === 'business' ? rules.businessReadyFillThreshold : rules.readyFillThreshold;
  if (fillLevel >= threshold) return 'ready';
  if (hasNearbyOpenShipment && rules.mergeMinFill !== undefined && fillLevel >= rules.mergeMinFill) return 'merge';
  return 'wait';
}
