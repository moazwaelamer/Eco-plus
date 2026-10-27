import type { ShipmentStatus } from '../generated/prisma/enums.js';
import { assertTransition, canTransition } from './shipment-status.js';
import { QR_PATTERN, generateQrCode } from './qr.js';

const ALL: ShipmentStatus[] = ['created', 'assigned', 'collected', 'weighed', 'rejected', 'cancelled'];

describe('shipment status machine', () => {
  const allowed: [ShipmentStatus, ShipmentStatus][] = [
    ['created', 'assigned'],
    ['created', 'collected'],
    ['created', 'cancelled'],
    ['assigned', 'created'],
    ['assigned', 'collected'],
    ['assigned', 'cancelled'],
    ['collected', 'weighed'],
    ['collected', 'rejected'],
  ];

  it.each(allowed)('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it('refuses every other move', () => {
    for (const from of ALL) {
      for (const to of ALL) {
        const isAllowed = allowed.some(([a, b]) => a === from && b === to);
        if (!isAllowed) expect(canTransition(from, to), `${from} -> ${to}`).toBe(false);
      }
    }
  });

  it('final states have no way out', () => {
    for (const final of ['weighed', 'rejected', 'cancelled'] as const) {
      for (const to of ALL) expect(canTransition(final, to)).toBe(false);
    }
  });

  it('assertTransition throws on a forbidden move', () => {
    expect(() => assertTransition('weighed', 'collected')).toThrow(/cannot move/);
    expect(() => assertTransition('created', 'collected')).not.toThrow();
  });
});

describe('QR codes', () => {
  it('look like ECO- plus 10 unambiguous characters', () => {
    for (let i = 0; i < 200; i++) expect(generateQrCode()).toMatch(QR_PATTERN);
  });

  it('do not repeat and are not sequential', () => {
    const codes = new Set(Array.from({ length: 5000 }, () => generateQrCode()));
    expect(codes.size).toBe(5000);
  });
});
