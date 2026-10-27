import type { SourceType } from '../generated/prisma/enums.js';

export type Decision = 'ready' | 'wait';

export interface DecisionRules {
  readyFillThreshold: number;
  businessReadyFillThreshold: number;
}

/**
 * Decision rule v1: a bag is worth a trip when it is full enough.
 * Businesses use a lower threshold. Merging nearby requests ("merge") arrives in Phase 2.
 */
export function decidePickup(fillLevel: number, sourceType: SourceType, rules: DecisionRules): Decision {
  const threshold = sourceType === 'business' ? rules.businessReadyFillThreshold : rules.readyFillThreshold;
  return fillLevel >= threshold ? 'ready' : 'wait';
}
