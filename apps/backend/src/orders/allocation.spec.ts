import { Prisma } from '../generated/prisma/client.js';
import { planAllocation } from './allocation.js';

const D = (v: string) => new Prisma.Decimal(v);
const batch = (id: number, kg: string) => ({ id, weightKg: D(kg) });

describe('planAllocation', () => {
  it('takes a whole batch when the need equals it', () => {
    const plan = planAllocation([batch(1, '10')], D('10'));
    expect(plan).toHaveLength(1);
    expect(plan![0]).toMatchObject({ batchId: 1, split: false });
  });

  it('splits a batch when only part is needed', () => {
    const plan = planAllocation([batch(1, '10')], D('4.5'))!;
    expect(plan[0]!.takeKg.toString()).toBe('4.5');
    expect(plan[0]!.split).toBe(true);
  });

  it('uses the oldest batches first and spans several', () => {
    const plan = planAllocation([batch(3, '5'), batch(1, '2'), batch(2, '4')], D('7'))!;
    expect(plan.map((t) => [t.batchId, t.takeKg.toString(), t.split])).toEqual([
      [1, '2', false],
      [2, '4', false],
      [3, '1', true],
    ]);
  });

  it('returns null when stock is not enough', () => {
    expect(planAllocation([batch(1, '2'), batch(2, '3')], D('5.001'))).toBeNull();
    expect(planAllocation([], D('1'))).toBeNull();
  });

  it('is exact with decimals', () => {
    const plan = planAllocation([batch(1, '0.1'), batch(2, '0.2')], D('0.3'))!;
    expect(plan.every((t) => !t.split)).toBe(true);
  });

  it('does not take from empty batches', () => {
    const plan = planAllocation([batch(1, '0'), batch(2, '3')], D('3'))!;
    expect(plan.map((t) => t.batchId)).toEqual([2]);
  });
});
