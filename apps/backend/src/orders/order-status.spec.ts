import type { OrderStatus } from '../generated/prisma/enums.js';
import { canMoveOrder, factoryMayCancel } from './order-status.js';

const ALL: OrderStatus[] = ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

describe('order status machine', () => {
  const allowed: [OrderStatus, OrderStatus][] = [
    ['placed', 'confirmed'],
    ['placed', 'cancelled'],
    ['confirmed', 'dispatched'],
    ['confirmed', 'cancelled'],
    ['dispatched', 'delivered'],
  ];

  it.each(allowed)('allows %s -> %s', (from, to) => {
    expect(canMoveOrder(from, to)).toBe(true);
  });

  it('refuses everything else', () => {
    for (const from of ALL) {
      for (const to of ALL) {
        if (!allowed.some(([a, b]) => a === from && b === to)) expect(canMoveOrder(from, to), `${from} -> ${to}`).toBe(false);
      }
    }
  });

  it('a factory can only cancel a placed order', () => {
    expect(factoryMayCancel('placed')).toBe(true);
    expect(factoryMayCancel('confirmed')).toBe(false);
  });
});
