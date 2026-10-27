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
