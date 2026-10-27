import { dateOnly, todayIn } from './dates.js';

describe('todayIn', () => {
  it('uses the local day, not the UTC day', () => {
    const lateEveningUtc = new Date('2026-10-27T22:30:00Z');
    expect(todayIn('UTC', lateEveningUtc)).toBe('2026-10-27');
    expect(todayIn('Africa/Cairo', lateEveningUtc)).toBe('2026-10-28');
  });
});

describe('dateOnly', () => {
  it('is UTC midnight', () => {
    expect(dateOnly('2026-10-27').toISOString()).toBe('2026-10-27T00:00:00.000Z');
  });
});
