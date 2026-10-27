import { displayName } from './points.service.js';

describe('displayName', () => {
  it('shows the first name and the last initial', () => {
    expect(displayName('Sara Test')).toBe('Sara T.');
    expect(displayName('  mona  abdel  rahman ')).toBe('mona R.');
  });

  it('copes with a single name', () => {
    expect(displayName('Sara')).toBe('Sara');
  });
});
