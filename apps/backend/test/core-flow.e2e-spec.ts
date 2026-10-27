import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationsService } from '../src/notifications/notifications.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { QR_PATTERN } from '../src/shipments/qr.js';
import { TINY_PNG, bagToPickup, createTestApp, login, registerCustomer } from './helpers.js';

describe('Core flow: scan -> request -> shipment -> collect -> weigh -> points -> stock', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let employee: string;
  let petId: number;
  let petFactor: number;

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    employee = await login(app, 'employee@ecoplus.test');
    const pet = await prisma.materialType.findUniqueOrThrow({ where: { name: 'PET plastic' } });
    petId = pet.id;
    petFactor = Number(pet.pointFactor);
  });
  afterAll(async () => {
    await app.close();
  });

  const collect = (shipmentId: number) => http().post(`/shipments/${shipmentId}/collect`).set(as(employee));
  const weigh = (shipmentId: number, body: object) => http().post(`/shipments/${shipmentId}/weigh`).set(as(employee)).send(body);
  const ledgerSum = async (userId: number) => (await prisma.pointsLedger.aggregate({ where: { userId }, _sum: { points: true } }))._sum.points ?? 0;

  it('takes one bag all the way to points and stock', async () => {
    const citizen = await registerCustomer(app);
    const { pickup } = await bagToPickup(app, citizen, { fillLevel: 0.8 });

    expect(pickup.status).toBe(201);
    expect(pickup.body.decision).toBe('ready');
    const shipment = pickup.body.shipment;
    expect(shipment.qrCode).toMatch(QR_PATTERN);
    expect(shipment.status).toBe('created');
    expect(shipment.sourceType).toBe('household');

    // The citizen sees it; the employee finds it by QR.
    const mine = await http().get('/shipments').set(as(citizen.token)).expect(200);
    expect(mine.body.items.map((s: { id: number }) => s.id)).toContain(shipment.id);
    const byQr = await http().get(`/shipments/by-qr/${shipment.qrCode.toLowerCase()}`).set(as(employee)).expect(200);
    expect(byQr.body.id).toBe(shipment.id);

    // Cannot weigh before collection.
    await weigh(shipment.id, { materialTypeId: petId, actualWeightKg: 4.2, accepted: true }).expect(409);

    await collect(shipment.id).expect(200);
    const weighed = await weigh(shipment.id, { materialTypeId: petId, actualWeightKg: 4.2, grade: 'a', accepted: true }).expect(201);

    const expectedPoints = Math.round(4.2 * petFactor * 1.0);
    expect(weighed.body.pointsAwarded).toBe(expectedPoints);
    expect(weighed.body.totalPoints).toBe(expectedPoints);
    expect(weighed.body.level).toBe('Bronze');
    expect(weighed.body.batch.grade).toBe('A');

    // Points screen, ledger and cached total agree.
    const points = await http().get('/me/points').set(as(citizen.token)).expect(200);
    expect(points.body.balance).toBe(expectedPoints);
    expect(points.body.level.name).toBe('Bronze');
    expect(points.body.nextLevel.name).toBe('Silver');
    expect(points.body.nextLevel.pointsToGo).toBe(500 - expectedPoints);
    expect(points.body.history.items[0].points).toBe(expectedPoints);
    expect(await ledgerSum(citizen.id)).toBe(expectedPoints);

    // Shipment is final, warehouse has the material.
    const after = await http().get(`/shipments/${shipment.id}`).set(as(citizen.token)).expect(200);
    expect(after.body.status).toBe('weighed');
    expect(after.body.weighing.accepted).toBe(true);
    const stock = await http().get('/warehouse/stock').set(as(employee)).expect(200);
    const pet = stock.body.items.find((i: { materialTypeId: number; grade: string }) => i.materialTypeId === petId && i.grade === 'A');
    expect(Number(pet.weightKg)).toBeGreaterThanOrEqual(4.2);
    expect(Number(stock.body.totalKg)).toBeGreaterThan(0);
    expect(typeof stock.body.usagePercent).toBe('number');

    // Notifications: request, collected, weighed (newest first).
    const notes = await http().get('/notifications').set(as(citizen.token)).expect(200);
    expect(notes.body.items.map((n: { title: string }) => n.title)).toEqual(['Bag weighed', 'Bag collected', 'Pickup requested']);
    expect(notes.body.unreadCount).toBe(3);
    await http().patch(`/notifications/${notes.body.items[0].id}/read`).set(as(citizen.token)).expect(204);
    await http().post('/notifications/read-all').set(as(citizen.token)).expect(200);
    const read = await http().get('/notifications').set(as(citizen.token)).expect(200);
    expect(read.body.unreadCount).toBe(0);

    // Leaderboard shows a short name and my rank.
    const board = await http().get('/leaderboard').set(as(citizen.token)).expect(200);
    expect(board.body.me.points).toBe(expectedPoints);
    expect(board.body.entries.every((e: { name: string }) => /^\S+( [A-Z]\.)?$/.test(e.name))).toBe(true); // first name and one initial only
  });

  it('a bag that is not full enough gets "wait" and nothing is stored', async () => {
    const citizen = await registerCustomer(app);
    const { pickup } = await bagToPickup(app, citizen, { fillLevel: 0.3 });
    expect(pickup.status).toBe(200);
    expect(pickup.body.decision).toBe('wait');
    expect(pickup.body.request).toBeNull();
    const list = await http().get('/pickup-requests').set(as(citizen.token)).expect(200);
    expect(list.body.items).toHaveLength(0);
  });

  it('businesses use the lower threshold, are marked as business and earn no points', async () => {
    const cafe = await registerCustomer(app, 'business');
    const { pickup } = await bagToPickup(app, cafe, { fillLevel: 0.5 });
    expect(pickup.status).toBe(201);
    expect(pickup.body.shipment.sourceType).toBe('business');

    await collect(pickup.body.shipment.id).expect(200);
    const res = await weigh(pickup.body.shipment.id, { materialTypeId: petId, actualWeightKg: 20, accepted: true }).expect(201);
    expect(res.body.pointsAwarded).toBe(0);
    expect(await ledgerSum(cafe.id)).toBe(0);
    await http().get('/me/points').set(as(cafe.token)).expect(403);
  });

  it('a rejected bag gives no points, no stock, and tells the user why', async () => {
    const citizen = await registerCustomer(app);
    const { pickup } = await bagToPickup(app, citizen);
    const id = pickup.body.shipment.id;
    await collect(id).expect(200);

    const batchesBefore = await prisma.batch.aggregate({ _sum: { weightKg: true } });
    const res = await weigh(id, { actualWeightKg: 2, accepted: false, rejectReason: 'food contamination' }).expect(201);
    expect(res.body.pointsAwarded).toBe(0);
    const batchesAfter = await prisma.batch.aggregate({ _sum: { weightKg: true } });
    expect(batchesAfter._sum.weightKg?.toString()).toBe(batchesBefore._sum.weightKg?.toString());

    const shipment = await http().get(`/shipments/${id}`).set(as(citizen.token)).expect(200);
    expect(shipment.body.status).toBe('rejected');
    expect(await ledgerSum(citizen.id)).toBe(0);
    const notes = await http().get('/notifications').set(as(citizen.token)).expect(200);
    expect(notes.body.items[0].body).toContain('food contamination');
  });

  it('validates the weighing form', async () => {
    const citizen = await registerCustomer(app);
    const { pickup } = await bagToPickup(app, citizen);
    const id = pickup.body.shipment.id;
    await collect(id).expect(200);

    await weigh(id, { materialTypeId: petId, actualWeightKg: 0, accepted: true }).expect(422);
    await weigh(id, { materialTypeId: petId, actualWeightKg: -3, accepted: true }).expect(422);
    await weigh(id, { materialTypeId: petId, actualWeightKg: 1.23456, accepted: true }).expect(422);
    await weigh(id, { actualWeightKg: 2, accepted: true }).expect(422); // material needed
    await weigh(id, { actualWeightKg: 2, accepted: false }).expect(422); // reason needed
    await weigh(id, { materialTypeId: 999999, actualWeightKg: 2, accepted: true }).expect(422);
    expect((await prisma.shipment.findUniqueOrThrow({ where: { id } })).status).toBe('collected');
  });

  it('moves a citizen up a level when a threshold is crossed', async () => {
    const citizen = await registerCustomer(app);
    await prisma.citizenProfile.update({ where: { userId: citizen.id }, data: { totalPoints: 495 } });
    const { pickup } = await bagToPickup(app, citizen);
    await collect(pickup.body.shipment.id).expect(200);

    const res = await weigh(pickup.body.shipment.id, { materialTypeId: petId, actualWeightKg: 1, accepted: true }).expect(201);
    expect(res.body.totalPoints).toBe(495 + Math.round(petFactor));
    expect(res.body.level).toBe('Silver');
    expect(res.body.leveledUp).toBe(true);
    const profile = await prisma.citizenProfile.findUniqueOrThrow({ where: { userId: citizen.id }, include: { level: true } });
    expect(profile.level.name).toBe('Silver');
  });

  it('the next weighing uses the new level multiplier', async () => {
    const citizen = await registerCustomer(app);
    await prisma.citizenProfile.update({ where: { userId: citizen.id }, data: { totalPoints: 500, levelId: (await prisma.level.findUniqueOrThrow({ where: { name: 'Silver' } })).id } });
    const { pickup } = await bagToPickup(app, citizen);
    await collect(pickup.body.shipment.id).expect(200);
    const res = await weigh(pickup.body.shipment.id, { materialTypeId: petId, actualWeightKg: 10, accepted: true }).expect(201);
    expect(res.body.pointsAwarded).toBe(Math.round(10 * petFactor * 1.1));
  });

  describe('safety of the weighing transaction', () => {
    it('saves nothing when a step fails, and works when retried', async () => {
      const citizen = await registerCustomer(app);
      const { pickup } = await bagToPickup(app, citizen);
      const id = pickup.body.shipment.id;
      await collect(id).expect(200);

      const batchTotalBefore = (await prisma.batch.aggregate({ _sum: { weightKg: true } }))._sum.weightKg?.toString();
      const notifications = app.get(NotificationsService);
      const original = notifications.notify.bind(notifications);
      let calls = 0;
      // Every step before the notification has already run inside the transaction; this makes the last one fail.
      notifications.notify = () => {
        calls++;
        return Promise.reject(new Error('simulated failure at the last step'));
      };
      try {
        await weigh(id, { materialTypeId: petId, actualWeightKg: 5, accepted: true }).expect(500);
      } finally {
        notifications.notify = original;
      }
      expect(calls).toBeGreaterThan(0);

      expect(await prisma.weighingRecord.count({ where: { shipmentId: id } })).toBe(0);
      expect(await ledgerSum(citizen.id)).toBe(0);
      expect((await prisma.citizenProfile.findUniqueOrThrow({ where: { userId: citizen.id } })).totalPoints).toBe(0);
      expect((await prisma.batch.aggregate({ _sum: { weightKg: true } }))._sum.weightKg?.toString()).toBe(batchTotalBefore);
      expect((await prisma.shipment.findUniqueOrThrow({ where: { id } })).status).toBe('collected');

      await weigh(id, { materialTypeId: petId, actualWeightKg: 5, accepted: true }).expect(201);
      expect(await ledgerSum(citizen.id)).toBe(Math.round(5 * petFactor));
    });

    it('sending the same weighing twice gives one record and one set of points', async () => {
      const citizen = await registerCustomer(app);
      const { pickup } = await bagToPickup(app, citizen);
      const id = pickup.body.shipment.id;
      await collect(id).expect(200);
      const body = { materialTypeId: petId, actualWeightKg: 3, accepted: true };

      const first = await weigh(id, body).expect(201);
      const second = await weigh(id, body).expect(200);
      expect(second.body.pointsAwarded).toBe(first.body.pointsAwarded);
      expect(await prisma.weighingRecord.count({ where: { shipmentId: id } })).toBe(1);
      expect(await ledgerSum(citizen.id)).toBe(Math.round(3 * petFactor));

      // Different values for an already weighed shipment are refused.
      await weigh(id, { ...body, actualWeightKg: 9 }).expect(409);
      expect(await ledgerSum(citizen.id)).toBe(Math.round(3 * petFactor));
    });

    it('two simultaneous identical submits still give one record', async () => {
      const citizen = await registerCustomer(app);
      const { pickup } = await bagToPickup(app, citizen);
      const id = pickup.body.shipment.id;
      await collect(id).expect(200);
      const body = { materialTypeId: petId, actualWeightKg: 6, accepted: true };

      const [a, b] = await Promise.all([weigh(id, body), weigh(id, body)]);
      expect([a.status, b.status].sort((x, y) => x - y)).toEqual([200, 201]);
      expect(await prisma.weighingRecord.count({ where: { shipmentId: id } })).toBe(1);
      expect(await ledgerSum(citizen.id)).toBe(Math.round(6 * petFactor));
    });
  });

  describe('ownership and roles', () => {
    it("one user cannot read or use another user's data", async () => {
      const owner = await registerCustomer(app);
      const other = await registerCustomer(app);
      const { scan, pickup } = await bagToPickup(app, owner);
      const requestId = pickup.body.request.id;
      const shipmentId = pickup.body.shipment.id;

      await http().get(`/scans/${scan.id}`).set(as(other.token)).expect(403);
      await http().get(`/pickup-requests/${requestId}`).set(as(other.token)).expect(403);
      await http().get(`/shipments/${shipmentId}`).set(as(other.token)).expect(403);
      await http().patch(`/pickup-requests/${requestId}/cancel`).set(as(other.token)).expect(403);
      await http().post('/pickup-requests').set(as(other.token)).send({ scanId: scan.id }).expect(403);
      expect((await http().get('/shipments').set(as(other.token)).expect(200)).body.items).toHaveLength(0);
      // The owner and staff can.
      await http().get(`/scans/${scan.id}`).set(as(owner.token)).expect(200);
      await http().get(`/shipments/${shipmentId}`).set(as(employee)).expect(200);
    });

    it('only the right roles can use staff endpoints', async () => {
      const citizen = await registerCustomer(app);
      const driver = await login(app, 'driver@ecoplus.test');
      const { pickup } = await bagToPickup(app, citizen);
      const id = pickup.body.shipment.id;

      await http().post(`/shipments/${id}/collect`).set(as(citizen.token)).expect(403);
      await http().post(`/shipments/${id}/weigh`).set(as(citizen.token)).send({}).expect(403);
      await http().post(`/shipments/${id}/weigh`).set(as(driver)).send({}).expect(403);
      await http().get('/warehouse/stock').set(as(citizen.token)).expect(403);
      await http().get('/warehouse/batches').set(as(driver)).expect(403);
      await http().get(`/shipments/by-qr/${pickup.body.shipment.qrCode}`).set(as(citizen.token)).expect(403);
      await http().post('/scans').set(as(employee)).send({ contentType: 'plastic' }).expect(403);
    });

    it('a scan can only get one pickup request', async () => {
      const citizen = await registerCustomer(app);
      const { scan, pickup } = await bagToPickup(app, citizen);
      expect(pickup.status).toBe(201);
      await http().post('/pickup-requests').set(as(citizen.token)).send({ scanId: scan.id }).expect(409);
    });
  });

  describe('cancelling a request', () => {
    it('releases the shipment before collection and not after', async () => {
      const citizen = await registerCustomer(app);
      const first = await bagToPickup(app, citizen);
      const cancelled = await http().patch(`/pickup-requests/${first.pickup.body.request.id}/cancel`).set(as(citizen.token)).expect(200);
      expect(cancelled.body.status).toBe('cancelled');
      expect(cancelled.body.shipment.status).toBe('cancelled');
      await collect(first.pickup.body.shipment.id).expect(409);

      const second = await bagToPickup(app, citizen);
      await collect(second.pickup.body.shipment.id).expect(200);
      await http().patch(`/pickup-requests/${second.pickup.body.request.id}/cancel`).set(as(citizen.token)).expect(409);
    });
  });

  describe('scans and photos', () => {
    it('accepts a real PNG and refuses everything else', async () => {
      const citizen = await registerCustomer(app);
      const ok = await http().post('/uploads/image').set(as(citizen.token)).attach('file', TINY_PNG, 'bag.png').expect(201);
      expect(ok.body.url).toMatch(/^\/uploads\/[a-f0-9]{32}\.png$/);

      // Same bytes are served back to a logged-in user, not to the public.
      await http().get(ok.body.url).set(as(citizen.token)).expect(200).expect('content-type', /image\/png/);
      await http().get(ok.body.url).expect(401);

      // A text file pretending to be a photo.
      await http().post('/uploads/image').set(as(citizen.token)).attach('file', Buffer.from('<?php echo 1; ?>'), 'bag.jpg').expect(422);
      await http().post('/uploads/image').set(as(citizen.token)).expect(422);
      // Too large (limit is 5 MB).
      const big = Buffer.concat([TINY_PNG.subarray(0, 8), Buffer.alloc(5 * 1024 * 1024 + 10)]);
      await http().post('/uploads/image').set(as(citizen.token)).attach('file', big, 'big.png').expect(413);
      await http().post('/uploads/image').attach('file', TINY_PNG, 'bag.png').expect(401);
    });

    it('refuses image URLs that were not issued by the upload endpoint', async () => {
      const citizen = await registerCustomer(app);
      for (const imageUrl of ['https://evil.example/x.png', '/uploads/../../etc/passwd', '/uploads/abc.png']) {
        await http().post('/scans').set(as(citizen.token)).send({ imageUrl, contentType: 'plastic' }).expect(422);
      }
      await http().get('/uploads/..%2F..%2Fetc%2Fpasswd').set(as(citizen.token)).expect(404);
    });

    it('needs a fill level and a location to request a pickup', async () => {
      const citizen = await registerCustomer(app);
      const noFill = await http().post('/scans').set(as(citizen.token)).send({ contentType: 'paper', lat: 30, lng: 31 }).expect(201);
      await http().post('/pickup-requests').set(as(citizen.token)).send({ scanId: noFill.body.id }).expect(422);
      const noPlace = await http().post('/scans').set(as(citizen.token)).send({ contentType: 'paper', fillLevel: 0.9 }).expect(201);
      const res = await http().post('/pickup-requests').set(as(citizen.token)).send({ scanId: noPlace.body.id }).expect(422);
      expect(res.body.code).toBe('location_required');
      await http().post('/scans').set(as(citizen.token)).send({ contentType: 'paper', lat: 30 }).expect(422); // lat without lng
      await http().post('/scans').set(as(citizen.token)).send({ contentType: 'paper', fillLevel: 1.5 }).expect(422);
    });

    it('pages through scans newest first', async () => {
      const citizen = await registerCustomer(app);
      for (let i = 0; i < 3; i++) await http().post('/scans').set(as(citizen.token)).send({ contentType: 'glass' }).expect(201);
      const p1 = await http().get('/scans?limit=2').set(as(citizen.token)).expect(200);
      expect(p1.body.items).toHaveLength(2);
      expect(p1.body.nextCursor).not.toBeNull();
      const p2 = await http().get(`/scans?limit=2&cursor=${p1.body.nextCursor}`).set(as(citizen.token)).expect(200);
      expect(p2.body.items).toHaveLength(1);
      expect(p2.body.nextCursor).toBeNull();
      expect(p1.body.items[0].id).toBeGreaterThan(p2.body.items[0].id);
    });
  });

  describe('staff create a request for a customer (phone or WhatsApp)', () => {
    const body = (phone: string, extra: object = {}) => ({
      customer: { name: 'Hajja Samia', phone },
      contentType: 'plastic',
      fillLevel: 0.9,
      lat: 30.04,
      lng: 31.24,
      channel: 'whatsapp',
      ...extra,
    });

    it('creates the customer, a shipment, and reuses the customer next time', async () => {
      const phone = `+2012${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`;
      const first = await http().post('/admin/pickup-requests').set(as(employee)).send(body(phone)).expect(201);
      expect(first.body.shipment.qrCode).toMatch(QR_PATTERN);
      expect(first.body.request.channel).toBe('whatsapp');
      expect(first.body.request.createdById).toBeGreaterThan(0);

      const second = await http().post('/admin/pickup-requests').set(as(employee)).send(body(phone, { channel: 'phone' })).expect(201);
      expect(second.body.customerId).toBe(first.body.customerId);
      expect(second.body.request.channel).toBe('phone');

      // The customer cannot log in with a guessed password.
      await http().post('/auth/login').send({ identifier: phone, password: 'Test1234!' }).expect(401);
    });

    it('follows the same decision rule and refuses staff phone numbers and non-staff callers', async () => {
      const phone = `+2012${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`;
      const wait = await http().post('/admin/pickup-requests').set(as(employee)).send(body(phone, { fillLevel: 0.2 })).expect(200);
      expect(wait.body.decision).toBe('wait');
      await http().post('/admin/pickup-requests').set(as(employee)).send(body('+201000000003')).expect(422); // seeded driver
      const citizen = await registerCustomer(app);
      await http().post('/admin/pickup-requests').set(as(citizen.token)).send(body(phone)).expect(403);
    });
  });

  describe('warehouse', () => {
    it('lists batches, changes a batch, and protects sold batches', async () => {
      const citizen = await registerCustomer(app);
      const { pickup } = await bagToPickup(app, citizen);
      await collect(pickup.body.shipment.id).expect(200);
      const res = await weigh(pickup.body.shipment.id, { materialTypeId: petId, actualWeightKg: 2, grade: 'B', accepted: true }).expect(201);
      const batchId = res.body.batch.id;

      const list = await http().get(`/warehouse/batches?materialTypeId=${petId}&grade=b&status=in_stock`).set(as(employee)).expect(200);
      expect(list.body.items.map((b: { id: number }) => b.id)).toContain(batchId);

      const reserved = await http().patch(`/warehouse/batches/${batchId}`).set(as(employee)).send({ status: 'reserved' }).expect(200);
      expect(reserved.body.status).toBe('reserved');
      await http().patch(`/warehouse/batches/${batchId}`).set(as(employee)).send({}).expect(422);
      await http().patch(`/warehouse/batches/${batchId}`).set(as(employee)).send({ status: 'sold' }).expect(200);
      await http().patch(`/warehouse/batches/${batchId}`).set(as(employee)).send({ grade: 'A' }).expect(409);
      await http().patch('/warehouse/batches/99999999').set(as(employee)).send({ status: 'reserved' }).expect(404);
    });

    it('adds later weighings to the same open batch', async () => {
      const grade = 'Z';
      const weights = [1.5, 2.25];
      let batchId: number | undefined;
      for (const w of weights) {
        const citizen = await registerCustomer(app);
        const { pickup } = await bagToPickup(app, citizen);
        await collect(pickup.body.shipment.id).expect(200);
        const res = await weigh(pickup.body.shipment.id, { materialTypeId: petId, actualWeightKg: w, grade, accepted: true }).expect(201);
        batchId ??= res.body.batch.id;
        expect(res.body.batch.id).toBe(batchId);
      }
      const batch = await prisma.batch.findUniqueOrThrow({ where: { id: batchId! } });
      expect(batch.weightKg.toString()).toBe('3.75');
    });
  });
});
