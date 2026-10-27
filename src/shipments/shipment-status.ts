import type { ShipmentStatus } from '../generated/prisma/enums.js';

/**
 * Allowed moves of a shipment. Anything else is refused.
 * created -> assigned (put on a route) or collected (marked by staff)
 * assigned -> created (taken off a route before the driver starts)
 * collected -> weighed or rejected (by the employee at the warehouse)
 * created or assigned -> cancelled (the user withdrew the request)
 */
const ALLOWED: Record<ShipmentStatus, ShipmentStatus[]> = {
  created: ['assigned', 'collected', 'cancelled'],
  assigned: ['created', 'collected', 'cancelled'],
  collected: ['weighed', 'rejected'],
  weighed: [],
  rejected: [],
  cancelled: [],
};

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: ShipmentStatus, to: ShipmentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Shipment cannot move from ${from} to ${to}`);
  }
}
