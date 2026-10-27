import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { todayIn } from '../src/common/dates.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TEST_PASSWORD, bagToPickup, createTestApp, login, registerCustomer, uniqueContact } from './helpers.js';

describe('Logistics: fleet, routes, driver handover, merge rule, devices', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let vehicleId: number;
  const today = todayIn('Africa/Cairo');

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    admin = await login(app, 'admin@ecoplus.test');
    const res = await http()
      .post('/vehicles')
      .set(as(admin))
      .send({ plate: `T-${Date.now()}`, type: 'van', capacityKg: 800 })
      .expect(201);
    vehicleId = res.body.id;
  });
  afterAll(async () => {
    await app.close();
  });

  async function newDriver() {
    const contact = uniqueContact();
    const res = await http()
      .post('/drivers')
      .set(as(admin))
      .send({ name: 'Omar Driver', ...contact, password: TEST_PASSWORD, licenseNo: 'LIC-12345' })
      .expect(201);
    const token = await login(app, contact.email);
    return { id: res.body.userId as number, token };
  }

  /** A ready shipment at the given spot. */
  async function shipmentAt(lat: number, lng: number) {
    const customer = await registerCustomer(app);
    const { pickup } = await bagToPickup(app, customer, { fillLevel: 0.8, lat, lng });
    expect(pickup.status).toBe(201);
    return { customer, shipment: pickup.body.shipment as { id: number; qrCode: string } };
  }

  const createRoute = (body: object) => http().post('/routes').set(as(admin)).send(body);

  describe('vehicles and drivers', () => {
    it('admin manages them, nobody else can', async () => {
      const plate = `P-${Date.now()}`;
      await http().post('/vehicles').set(as(admin)).send({ plate, type: 'truck', capacityKg: 2000 }).expect(201);
      await http().post('/vehicles').set(as(admin)).send({ plate, type: 'truck', capacityKg: 2000 }).expect(409);
      await http().post('/vehicles').set(as(admin)).send({ plate: 'X', type: 'truck', capacityKg: -5 }).expect(422);

      const retired = await http().patch(`/vehicles/${vehicleId}`).set(as(admin)).send({ capacityKg: 900 }).expect(200);
      expect(Number(retired.body.capacityKg)).toBe(900);
      await http().patch('/vehicles/999999').set(as(admin)).send({ capacityKg: 1 }).expect(404);

      const employee = await login(app, 'employee@ecoplus.test');
      const citizen = await registerCustomer(app);
      for (const token of [employee, citizen.token]) {
        await http().get('/vehicles').set(as(token)).expect(403);
        await http().post('/drivers').set(as(token)).send({}).expect(403);
        await http().post('/routes').set(as(token)).send({}).expect(403);
      }
      await http().get('/vehicles').expect(401);
    });

    it('creates a driver who can log in, rejects duplicates and weak input', async () => {
      const driver = await newDriver();
      const me = await http().get('/me').set(as(driver.token)).expect(200);
      expect(me.body.role ?? me.body.user?.role).toBe('driver');

      const dup = await prisma.user.findUniqueOrThrow({ where: { id: driver.id } });
      await http()
        .post('/drivers')
        .set(as(admin))
        .send({ name: 'Dup', email: dup.email, password: TEST_PASSWORD, licenseNo: 'LIC-99999' })
        .expect(409);
      await http().post('/drivers').set(as(admin)).send({ name: 'No contact', password: TEST_PASSWORD, licenseNo: 'LIC-1' }).expect(422);

      const list = await http().get('/drivers').set(as(admin)).expect(200);
      expect(list.body.items.length).toBeGreaterThan(0);

      await http().patch(`/drivers/${driver.id}`).set(as(admin)).send({ isActive: false }).expect(200);
      await http().get('/me').set(as(driver.token)).expect(401);
    });
  });

  describe('route, handover and collection', () => {
    it('plans a route, the driver collects with the customer code, the route finishes', async () => {
      const driver = await newDriver();
      // Three stops on a line north of the start; sent in scrambled order.
      const far = await shipmentAt(40.03, 20);
      const near = await shipmentAt(40.01, 20);
      const mid = await shipmentAt(40.02, 20);

      const created = await createRoute({
        driverId: driver.id,
        vehicleId,
        routeDate: today,
        shipmentIds: [far.shipment.id, near.shipment.id, mid.shipment.id],
        start: { lat: 40, lng: 20 },
      }).expect(201);
      expect(created.body.status).toBe('planned');
      expect(created.body.stops.map((s: { shipmentId: number }) => s.shipmentId)).toEqual([
        near.shipment.id,
        mid.shipment.id,
        far.shipment.id,
      ]);

      // Shipments are assigned, requests scheduled, and the customer got the code.
      const nearRow = await prisma.shipment.findUniqueOrThrow({ where: { id: near.shipment.id }, include: { request: true } });
      expect(nearRow.status).toBe('assigned');
      expect(nearRow.request.status).toBe('scheduled');
      expect(nearRow.handoverCode).toMatch(/^[0-9]{6}$/);
      const notes = await http().get('/notifications').set(as(near.customer.token)).expect(200);
      expect(notes.body.items.some((n: { body: string }) => n.body.includes(nearRow.handoverCode!))).toBe(true);
      const seen = await http().get(`/shipments/${near.shipment.id}`).set(as(near.customer.token)).expect(200);
      expect(seen.body.handoverCode).toBe(nearRow.handoverCode);

      // The driver sees the stops in order and never a handover code.
      const mine = await http().get('/driver/routes').set(as(driver.token)).expect(200);
      expect(mine.body.routes).toHaveLength(1);
      expect(mine.body.routes[0].stops.map((s: { shipmentId: number }) => s.shipmentId)).toEqual([
        near.shipment.id,
        mid.shipment.id,
        far.shipment.id,
      ]);
      expect(JSON.stringify(mine.body)).not.toContain(nearRow.handoverCode!);
      expect(mine.body.routes[0].stops[0].customer.name).toBeTruthy();

      const routeId = created.body.id as number;
      const code = async (id: number) => (await prisma.shipment.findUniqueOrThrow({ where: { id } })).handoverCode!;
      const collect = (id: number, handoverCode: string) =>
        http().post(`/driver/stops/${id}/collect`).set(as(driver.token)).send({ handoverCode });

      // Before the route starts nothing can be collected, even with the right code.
      await collect(near.shipment.id, await code(near.shipment.id)).expect(409);
      // Staff cannot bypass the code for a shipment that is on a route.
      const employee = await login(app, 'employee@ecoplus.test');
      await http().post(`/shipments/${near.shipment.id}/collect`).set(as(employee)).expect(409);

      await http().post(`/driver/routes/${routeId}/start`).set(as(driver.token)).expect(200);
      await http().post(`/driver/routes/${routeId}/start`).set(as(driver.token)).expect(409);
      expect((await prisma.driver.findUniqueOrThrow({ where: { userId: driver.id } })).status).toBe('on_route');

      // Wrong code, malformed code, then the right ones.
      const real = await code(near.shipment.id);
      const wrong = real === '000000' ? '111111' : '000000';
      await collect(near.shipment.id, wrong).expect(422);
      await collect(near.shipment.id, '12').expect(422);
      const first = await collect(near.shipment.id, real).expect(200);
      expect(first.body.routeFinished).toBe(false);
      await collect(near.shipment.id, real).expect(409); // already collected
      expect((await prisma.shipment.findUniqueOrThrow({ where: { id: near.shipment.id } })).status).toBe('collected');
      expect((await prisma.routeStop.findUniqueOrThrow({ where: { shipmentId: near.shipment.id } })).collectedAt).not.toBeNull();

      await collect(mid.shipment.id, await code(mid.shipment.id)).expect(200);
      const last = await collect(far.shipment.id, await code(far.shipment.id)).expect(200);
      expect(last.body.routeFinished).toBe(true);
      expect((await prisma.route.findUniqueOrThrow({ where: { id: routeId } })).status).toBe('done');
      expect((await prisma.driver.findUniqueOrThrow({ where: { userId: driver.id } })).status).toBe('available');

      const after = await http().get(`/shipments/${near.shipment.id}`).set(as(near.customer.token)).expect(200);
      expect(after.body.status).toBe('collected');
      const request = await prisma.pickupRequest.findUniqueOrThrow({ where: { id: after.body.requestId } });
      expect(request.status).toBe('collected');

      // The employee can now weigh it like any collected shipment.
      const pet = await prisma.materialType.findUniqueOrThrow({ where: { name: 'PET plastic' } });
      await http()
        .post(`/shipments/${near.shipment.id}/weigh`)
        .set(as(employee))
        .send({ materialTypeId: pet.id, actualWeightKg: 3.2, grade: 'A', accepted: true })
        .expect(201);
    });

    it('another driver cannot start or collect someone else\'s route', async () => {
      const driver = await newDriver();
      const other = await newDriver();
      const { shipment } = await shipmentAt(41, 21);
      const route = await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [shipment.id] }).expect(201);
      await http().post(`/driver/routes/${route.body.id}/start`).set(as(other.token)).expect(403);
      await http().post(`/driver/routes/${route.body.id}/start`).set(as(driver.token)).expect(200);
      await http().post(`/driver/stops/${shipment.id}/collect`).set(as(other.token)).send({ handoverCode: '123456' }).expect(403);
      await http().get('/driver/routes').set(as(other.token)).expect(200).expect((r) => expect(r.body.routes).toEqual([]));
    });

    it('refuses bad routes and changes nothing', async () => {
      const driver = await newDriver();
      const a = await shipmentAt(42, 22);
      const b = await shipmentAt(42.01, 22);

      await createRoute({ driverId: driver.id, vehicleId, routeDate: '2020-01-01', shipmentIds: [a.shipment.id] }).expect(422);
      await createRoute({ driverId: 999999, vehicleId, routeDate: today, shipmentIds: [a.shipment.id] }).expect(404);
      await createRoute({ driverId: driver.id, vehicleId: 999999, routeDate: today, shipmentIds: [a.shipment.id] }).expect(404);
      await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [a.shipment.id, 999999] }).expect(404);
      await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [a.shipment.id, a.shipment.id] }).expect(422);
      await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [] }).expect(422);

      // Taking a shipment that is not waiting: whole request fails, the good shipment stays untouched.
      const first = await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [a.shipment.id] }).expect(201);
      const driver2 = await newDriver();
      await createRoute({ driverId: driver2.id, vehicleId, routeDate: today, shipmentIds: [b.shipment.id, a.shipment.id] }).expect(409);
      expect((await prisma.shipment.findUniqueOrThrow({ where: { id: b.shipment.id } })).status).toBe('created');
      expect(await prisma.route.count({ where: { driverId: driver2.id } })).toBe(0);

      // A driver with an unfinished route that day cannot get a second one.
      await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [b.shipment.id] }).expect(409);
      expect((await prisma.shipment.findUniqueOrThrow({ where: { id: b.shipment.id } })).status).toBe('created');
      expect(first.body.id).toBeGreaterThan(0);
    });

    it('two admins cannot take the same shipment at the same time', async () => {
      const d1 = await newDriver();
      const d2 = await newDriver();
      const { shipment } = await shipmentAt(43, 23);
      const results = await Promise.all([
        createRoute({ driverId: d1.id, vehicleId, routeDate: today, shipmentIds: [shipment.id] }),
        createRoute({ driverId: d2.id, vehicleId, routeDate: today, shipmentIds: [shipment.id] }),
      ]);
      expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([201, 409]);
      expect(await prisma.routeStop.count({ where: { shipmentId: shipment.id } })).toBe(1);
    });

    it('reorders, removes a stop and cancels a planned route', async () => {
      const driver = await newDriver();
      const a = await shipmentAt(44, 24);
      const b = await shipmentAt(44.01, 24);
      const c = await shipmentAt(44.02, 24);
      const route = await createRoute({
        driverId: driver.id,
        vehicleId,
        routeDate: today,
        shipmentIds: [a.shipment.id, b.shipment.id, c.shipment.id],
        start: { lat: 44, lng: 24 },
      }).expect(201);
      const id = route.body.id as number;
      const order = (body: { stops: { shipmentId: number }[] }) => body.stops.map((s) => s.shipmentId);

      const reordered = await http()
        .put(`/routes/${id}/stop-order`)
        .set(as(admin))
        .send({ shipmentIds: [c.shipment.id, a.shipment.id, b.shipment.id] })
        .expect(200);
      expect(order(reordered.body)).toEqual([c.shipment.id, a.shipment.id, b.shipment.id]);
      await http().put(`/routes/${id}/stop-order`).set(as(admin)).send({ shipmentIds: [a.shipment.id] }).expect(422);

      const oldCode = (await prisma.shipment.findUniqueOrThrow({ where: { id: a.shipment.id } })).handoverCode;
      const removed = await http().delete(`/routes/${id}/stops/${a.shipment.id}`).set(as(admin)).expect(200);
      expect(order(removed.body)).toEqual([c.shipment.id, b.shipment.id]);
      const released = await prisma.shipment.findUniqueOrThrow({ where: { id: a.shipment.id }, include: { request: true } });
      expect(released.status).toBe('created');
      expect(released.handoverCode).toBeNull();
      expect(released.request.status).toBe('open');
      expect(oldCode).not.toBeNull();
      await http().delete(`/routes/${id}/stops/${a.shipment.id}`).set(as(admin)).expect(404);

      await http().delete(`/routes/${id}`).set(as(admin)).expect(204);
      await http().get(`/routes/${id}`).set(as(admin)).expect(404);
      for (const s of [b, c]) {
        expect((await prisma.shipment.findUniqueOrThrow({ where: { id: s.shipment.id } })).status).toBe('created');
      }

      // The freed shipments can be planned again.
      await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [a.shipment.id] }).expect(201);
    });

    it('a started route can no longer be changed', async () => {
      const driver = await newDriver();
      const { shipment } = await shipmentAt(45, 25);
      const route = await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [shipment.id] }).expect(201);
      await http().post(`/driver/routes/${route.body.id}/start`).set(as(driver.token)).expect(200);
      await http().delete(`/routes/${route.body.id}`).set(as(admin)).expect(409);
      await http().delete(`/routes/${route.body.id}/stops/${shipment.id}`).set(as(admin)).expect(409);
      await http().put(`/routes/${route.body.id}/stop-order`).set(as(admin)).send({ shipmentIds: [shipment.id] }).expect(409);
    });

    it('lists routes by date and driver', async () => {
      const driver = await newDriver();
      const { shipment } = await shipmentAt(46, 26);
      await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [shipment.id] }).expect(201);
      const list = await http().get(`/routes?date=${today}&driverId=${driver.id}`).set(as(admin)).expect(200);
      expect(list.body.items).toHaveLength(1);
      await http().get('/routes?date=nope').set(as(admin)).expect(422);
    });
  });

  describe('decision rule v2: merge nearby requests', () => {
    const scanAndRequest = async (customer: Awaited<ReturnType<typeof registerCustomer>>, fillLevel: number, lat: number, lng: number) =>
      (await bagToPickup(app, customer, { fillLevel, lat, lng })).pickup;

    it('lets a half-full bag ride along with a shipment ~55 m away, but not one far away or too empty', async () => {
      await shipmentAt(31.2, 29.9);

      const near = await scanAndRequest(await registerCustomer(app), 0.35, 31.2005, 29.9);
      expect(near.status).toBe(201);
      expect(near.body.decision).toBe('merge');
      expect(near.body.shipment.status).toBe('created');
      const row = await prisma.pickupRequest.findUniqueOrThrow({ where: { id: near.body.request.id } });
      expect(row.decision).toBe('merge');

      const far = await scanAndRequest(await registerCustomer(app), 0.35, 31.3, 29.9);
      expect(far.body.decision).toBe('wait');
      expect(far.body.shipment).toBeNull();

      const tooEmpty = await scanAndRequest(await registerCustomer(app), 0.2, 31.2005, 29.9);
      expect(tooEmpty.body.decision).toBe('wait');
    });

    it('a shipment that already has a driver on the way still counts as nearby, a collected one does not', async () => {
      const lat = 33.2;
      const anchor = await shipmentAt(lat, 30.1);
      const driver = await newDriver();
      await createRoute({ driverId: driver.id, vehicleId, routeDate: today, shipmentIds: [anchor.shipment.id] }).expect(201);
      const assigned = await scanAndRequest(await registerCustomer(app), 0.4, lat + 0.0003, 30.1);
      expect(assigned.body.decision).toBe('merge');

      await prisma.shipment.update({ where: { id: anchor.shipment.id }, data: { status: 'collected' } });
      await prisma.shipment.update({ where: { id: assigned.body.shipment.id }, data: { status: 'collected' } });
      const alone = await scanAndRequest(await registerCustomer(app), 0.4, lat + 0.0003, 30.1);
      expect(alone.body.decision).toBe('wait');
    });
  });

  describe('device tokens', () => {
    const token = `fcm-${'x'.repeat(40)}-${Date.now()}`;

    it('registers a phone, moves it to the next user who logs in on it, removes only its own', async () => {
      const a = await registerCustomer(app);
      const b = await registerCustomer(app);

      await http().post('/me/device-tokens').set(as(a.token)).send({ token, platform: 'android' }).expect(204);
      await http().post('/me/device-tokens').set(as(a.token)).send({ token, platform: 'android' }).expect(204); // idempotent
      expect(await prisma.deviceToken.count({ where: { token } })).toBe(1);

      await http().post('/me/device-tokens').set(as(b.token)).send({ token, platform: 'ios' }).expect(204);
      expect((await prisma.deviceToken.findUniqueOrThrow({ where: { token } })).userId).toBe(b.id);

      await http().delete(`/me/device-tokens/${encodeURIComponent(token)}`).set(as(a.token)).expect(204);
      expect(await prisma.deviceToken.count({ where: { token } })).toBe(1); // not a's token any more
      await http().delete(`/me/device-tokens/${encodeURIComponent(token)}`).set(as(b.token)).expect(204);
      expect(await prisma.deviceToken.count({ where: { token } })).toBe(0);

      await http().post('/me/device-tokens').set(as(a.token)).send({ token: 'short', platform: 'android' }).expect(422);
      await http().post('/me/device-tokens').send({ token, platform: 'android' }).expect(401);
    });
  });
});
