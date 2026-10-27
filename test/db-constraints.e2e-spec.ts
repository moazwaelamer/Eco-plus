import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Tries to break each rule written in the constraints migration, straight at the database,
 * and expects the database to refuse. These rules must hold even if the application has a bug.
 */
describe('Database rules', () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function makeShipment() {
    const tag = randomUUID().slice(0, 8);
    const user = await prisma.user.create({
      data: { name: 'DB Test', email: `db-${tag}@example.test`, passwordHash: 'x', role: 'citizen' },
    });
    const scan = await prisma.bagScan.create({ data: { userId: user.id, contentType: 'plastic', fillLevel: 0.7 } });
    const request = await prisma.pickupRequest.create({ data: { scanId: scan.id, decision: 'ready' } });
    const shipment = await prisma.shipment.create({
      data: { requestId: request.id, qrCode: `ECO-${tag}`, gpsLat: 30, gpsLng: 31, sourceType: 'household' },
    });
    const employeeUser = await prisma.user.create({
      data: { name: 'Clerk', email: `clerk-${tag}@example.test`, passwordHash: 'x', role: 'employee' },
    });
    const warehouse = await prisma.warehouse.findFirstOrThrow();
    await prisma.employee.create({ data: { userId: employeeUser.id, warehouseId: warehouse.id, position: 'clerk' } });
    const material = await prisma.materialType.findFirstOrThrow();
    return { user, shipment, employeeId: employeeUser.id, materialId: material.id, tag };
  }

  describe('points ledger is append-only', () => {
    it('allows inserting a row but refuses to change or delete it', async () => {
      const { user } = await makeShipment();
      const row = await prisma.pointsLedger.create({ data: { userId: user.id, points: 42, reason: 'earned' } });

      await expect(prisma.pointsLedger.update({ where: { id: row.id }, data: { points: 9999 } })).rejects.toThrow(/append-only/);
      await expect(prisma.pointsLedger.delete({ where: { id: row.id } })).rejects.toThrow(/append-only/);

      const after = await prisma.pointsLedger.findUniqueOrThrow({ where: { id: row.id } });
      expect(after.points).toBe(42);
    });

    it('refuses a zero-point row', async () => {
      const { user } = await makeShipment();
      await expect(prisma.pointsLedger.create({ data: { userId: user.id, points: 0, reason: 'earned' } })).rejects.toThrow();
    });

    it('accepts a correction as a new negative row', async () => {
      const { user } = await makeShipment();
      await prisma.pointsLedger.create({ data: { userId: user.id, points: 50, reason: 'earned' } });
      await prisma.pointsLedger.create({ data: { userId: user.id, points: -50, reason: 'correction' } });
      const sum = await prisma.pointsLedger.aggregate({ where: { userId: user.id }, _sum: { points: true } });
      expect(sum._sum.points).toBe(0);
    });
  });

  describe('weighing records', () => {
    it('refuses a weight of zero or less', async () => {
      const { shipment, employeeId, materialId } = await makeShipment();
      for (const w of [0, -1]) {
        await expect(
          prisma.weighingRecord.create({
            data: { shipmentId: shipment.id, employeeId, materialTypeId: materialId, actualWeightKg: w, accepted: true },
          }),
        ).rejects.toThrow();
      }
    });

    it('allows only one weighing per shipment', async () => {
      const { shipment, employeeId, materialId } = await makeShipment();
      const data = { shipmentId: shipment.id, employeeId, materialTypeId: materialId, actualWeightKg: 3.2, accepted: true };
      await prisma.weighingRecord.create({ data });
      await expect(prisma.weighingRecord.create({ data })).rejects.toThrow();
    });

    it('requires a reason when rejected and a material when accepted', async () => {
      const { shipment, employeeId, materialId } = await makeShipment();
      await expect(
        prisma.weighingRecord.create({ data: { shipmentId: shipment.id, employeeId, actualWeightKg: 2, accepted: false } }),
      ).rejects.toThrow();
      await expect(
        prisma.weighingRecord.create({ data: { shipmentId: shipment.id, employeeId, actualWeightKg: 2, accepted: true } }),
      ).rejects.toThrow();
      await prisma.weighingRecord.create({
        data: { shipmentId: shipment.id, employeeId, actualWeightKg: 2, accepted: false, rejectReason: 'food contamination' },
      });
      expect(materialId).toBeGreaterThan(0);
    });
  });

  it('refuses duplicate QR codes', async () => {
    const first = await makeShipment();
    const second = await makeShipment();
    await expect(
      prisma.shipment.update({ where: { id: second.shipment.id }, data: { qrCode: first.shipment.qrCode } }),
    ).rejects.toThrow();
  });

  it('keeps scan scores between 0 and 1', async () => {
    const { user } = await makeShipment();
    for (const bad of [{ fillLevel: 1.5 }, { contamination: -0.1 }, { confidence: 2 }]) {
      await expect(prisma.bagScan.create({ data: { userId: user.id, contentType: 'glass', ...bad } })).rejects.toThrow();
    }
  });

  it('never allows negative stock', async () => {
    const warehouse = await prisma.warehouse.findFirstOrThrow();
    const material = await prisma.materialType.findFirstOrThrow();
    await expect(
      prisma.batch.create({ data: { warehouseId: warehouse.id, materialTypeId: material.id, weightKg: -1, grade: 'A' } }),
    ).rejects.toThrow();
  });
});
