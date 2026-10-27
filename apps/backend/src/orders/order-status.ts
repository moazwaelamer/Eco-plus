import type { OrderStatus } from '../generated/prisma/enums.js';

/** placed -> confirmed -> dispatched -> delivered. Cancelling is possible until the goods are dispatched. */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function canMoveOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].includes(to);
}

/** The factory itself may only cancel an order that nobody has confirmed yet. */
export function factoryMayCancel(status: OrderStatus): boolean {
  return status === 'placed';
}
