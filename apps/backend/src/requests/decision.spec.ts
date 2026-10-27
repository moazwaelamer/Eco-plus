import { decidePickup } from './decision.js';

const rules = { readyFillThreshold: 0.6, businessReadyFillThreshold: 0.4 };

describe('decidePickup (rule v1)', () => {
  it('households need the bag to reach the threshold', () => {
    expect(decidePickup(0.59, 'household', rules)).toBe('wait');
    expect(decidePickup(0.6, 'household', rules)).toBe('ready');
    expect(decidePickup(1, 'household', rules)).toBe('ready');
    expect(decidePickup(0, 'household', rules)).toBe('wait');
  });

  it('businesses use the lower threshold', () => {
    expect(decidePickup(0.39, 'business', rules)).toBe('wait');
    expect(decidePickup(0.4, 'business', rules)).toBe('ready');
    expect(decidePickup(0.5, 'household', rules)).toBe('wait');
    expect(decidePickup(0.5, 'business', rules)).toBe('ready');
  });
});

describe('decidePickup (rule v2, merge)', () => {
  const v2 = { ...rules, mergeMinFill: 0.3 };

  it('a half-empty bag rides along when a shipment is nearby', () => {
    expect(decidePickup(0.35, 'household', v2, true)).toBe('merge');
    expect(decidePickup(0.3, 'household', v2, true)).toBe('merge');
  });

  it('waits when nothing is nearby or the bag is too empty', () => {
    expect(decidePickup(0.35, 'household', v2, false)).toBe('wait');
    expect(decidePickup(0.29, 'household', v2, true)).toBe('wait');
  });

  it('a full bag stays "ready", never "merge"', () => {
    expect(decidePickup(0.7, 'household', v2, true)).toBe('ready');
  });

  it('merge is off when the minimum is not configured', () => {
    expect(decidePickup(0.5, 'household', rules, true)).toBe('wait');
  });
});
