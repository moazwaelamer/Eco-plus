import { calculatePoints, levelForPoints } from './points.js';

describe('calculatePoints', () => {
  it('multiplies weight, material factor and level multiplier', () => {
    expect(calculatePoints('4.2', '10', '1.0')).toBe(42);
    expect(calculatePoints(10, 2, 1.5)).toBe(30);
  });

  it('rounds half up to a whole number', () => {
    expect(calculatePoints('0.5', '1', '1')).toBe(1); // 0.5 -> 1
    expect(calculatePoints('0.4', '1', '1')).toBe(0); // 0.4 -> 0
    expect(calculatePoints('2.5', '1', '1')).toBe(3); // 2.5 -> 3, not banker's rounding
    expect(calculatePoints('1.25', '1', '1')).toBe(1);
  });

  it('is exact where floating point is not (0.1 x 3 x 10)', () => {
    expect(calculatePoints('0.1', '3', '10')).toBe(3);
    expect(calculatePoints('0.7', '10', '1.1')).toBe(8); // 7.7 -> 8
  });

  it('gives zero for zero weight or zero factor', () => {
    expect(calculatePoints('0', '10', '1')).toBe(0);
    expect(calculatePoints('5', '0', '1')).toBe(0);
  });

  it('applies each level multiplier from the seed', () => {
    const results = ['1.0', '1.1', '1.25', '1.5'].map((m) => calculatePoints('10', '10', m));
    expect(results).toEqual([100, 110, 125, 150]);
  });
});

describe('levelForPoints', () => {
  const levels = [
    { name: 'Gold', minPoints: 2000 },
    { name: 'Bronze', minPoints: 0 },
    { name: 'Platinum', minPoints: 5000 },
    { name: 'Silver', minPoints: 500 },
  ];

  it.each([
    [0, 'Bronze'],
    [499, 'Bronze'],
    [500, 'Silver'],
    [1999, 'Silver'],
    [2000, 'Gold'],
    [4999, 'Gold'],
    [5000, 'Platinum'],
    [999999, 'Platinum'],
  ])('%i points is %s (levels given in any order)', (points, expected) => {
    expect(levelForPoints(points, levels).name).toBe(expected);
  });
});
