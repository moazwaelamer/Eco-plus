import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TEST_PASSWORD, createTestApp, login, registerCustomer, uniqueContact } from './helpers.js';

describe('Factory side: materials, catalog, orders with reservation, invoices', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let warehouseId: number;

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    admin = await login(app, 'admin@ecoplus.test');
    warehouseId = (await prisma.warehouse.findFirstOrThrow()).id;
  });
  afterAll(async () => {
    await app.close();
  });

  /** A material of its own, so stock numbers never mix with other tests. */
  async function newMaterial(pricePerKg = 10) {
    const res = await http()
      .post('/materials')
      .set(as(admin))
      .send({ name: `Test material ${Math.random().toString(36).slice(2, 10)}`, pointFactor: 1, pricePerKg })
      .expect(201);
    return res.body.id as number;
  }

  const addBatch = (materialTypeId: number, weightKg: number, grade = 'A') =>
    prisma.batch.create({ data: { warehouseId, materialTypeId, weightKg, grade, status: 'in_stock' } });

  async function newFactory() {
    const f = await http().post('/factories').set(as(admin)).send({ name: 'Test Plastics Co' }).expect(201);
    const contact = uniqueContact();
    const u = await http()
      .post(`/factories/${f.body.id}/users`)
      .set(as(admin))
      .send({ name: 'Buyer', ...contact, password: TEST_PASSWORD })
      .expect(201);
    return { id: f.body.id as number, userId: u.body.id as number, token: await login(app, contact.email) };
  }

  const order = (token: string, items: object[]) => http().post('/orders').set(as(token)).send({ items });
  const kg = async (batchId: number) => Number((await prisma.batch.findUniqueOrThrow({ where: { id: batchId } })).weightKg);

  describe('materials and factory accounts', () => {
    it('admin manages materials; others cannot', async () => {
      const id = await newMaterial(12.5);
      const name = (await prisma.materialType.findUniqueOrThrow({ where: { id } })).name;
      await http().post('/materials').set(as(admin)).send({ name, pointFactor: 1, pricePerKg: 1 }).expect(409);
      await http().post('/materials').set(as(admin)).send({ name: 'X', pointFactor: 0, pricePerKg: 1 }).expect(422);

      const changed = await http().patch(`/materials/${id}`).set(as(admin)).send({ pricePerKg: 14, isActive: true }).expect(200);
      expect(Number(changed.body.pricePerKg)).toBe(14);
      await http().patch('/materials/999999').set(as(admin)).send({ pricePerKg: 1 }).expect(404);
      await http().patch(`/materials/${id}`).set(as(admin)).send({}).expect(422);

      const factory = await newFactory();
      const employee = await login(app, 'employee@ecoplus.test');
      await http().get('/materials').set(as(employee)).expect(200);
      await http().get('/materials').set(as(factory.token)).expect(200);
      await http().post('/materials').set(as(factory.token)).send({ name: 'Nope', pointFactor: 1, pricePerKg: 1 }).expect(403);
      await http().post('/materials').set(as(employee)).send({ name: 'Nope', pointFactor: 1, pricePerKg: 1 }).expect(403);
      const citizen = await registerCustomer(app);
      await http().get('/materials').set(as(citizen.token)).expect(403);
      await http().get('/materials').expect(401);
    });

    it('creates a factory with a login that is tied to it', async () => {
      const f = await newFactory();
      const me = await http().get('/me').set(as(f.token)).expect(200);
      expect(me.body.role ?? me.body.user?.role).toBe('factory');
      const detail = await http().get(`/factories/${f.id}`).set(as(admin)).expect(200);
      expect(detail.body.users).toHaveLength(1);

      const dupEmail = (await prisma.user.findUniqueOrThrow({ where: { id: f.userId } })).email;
      await http().post(`/factories/${f.id}/users`).set(as(admin)).send({ name: 'Dup', email: dupEmail, password: TEST_PASSWORD }).expect(409);
      await http().post('/factories/999999/users').set(as(admin)).send({ name: 'Nobody', email: 'x@example.test', password: TEST_PASSWORD }).expect(404);
      await http().post('/factories').set(as(f.token)).send({ name: 'Sneaky' }).expect(403);
    });
  });

  describe('catalog', () => {
    it('shows only free stock, grouped by material and grade, with price', async () => {
      const m = await newMaterial(8);
      await addBatch(m, 10, 'A');
      await addBatch(m, 5, 'A');
      await addBatch(m, 4, 'B');
      await prisma.batch.create({ data: { warehouseId, materialTypeId: m, weightKg: 100, grade: 'A', status: 'reserved' } });
      const f = await newFactory();

      const res = await http().get('/catalog').set(as(f.token)).expect(200);
      const rows = res.body.items.filter((i: { materialTypeId: number }) => i.materialTypeId === m);
      expect(rows.map((r: { grade: string; availableKg: string }) => [r.grade, Number(r.availableKg)])).toEqual([
        ['A', 15],
        ['B', 4],
      ]);
      expect(Number(rows[0].pricePerKg)).toBe(8);

      const citizen = await registerCustomer(app);
      await http().get('/catalog').set(as(citizen.token)).expect(403);
    });
  });

  describe('orders', () => {
    it('reserves across batches, splits the last one, then runs to delivery and an invoice', async () => {
      const m = await newMaterial(10);
      const b1 = await addBatch(m, 10);
      const b2 = await addBatch(m, 5);
      const f = await newFactory();

      const placed = await order(f.token, [{ materialTypeId: m, quantityKg: 12 }]).expect(201);
      expect(placed.body.status).toBe('placed');
      expect(placed.body.items.map((i: { quantityKg: string }) => Number(i.quantityKg))).toEqual([10, 2]);

      // First batch fully reserved, second split: 3 kg stays on the shelf.
      expect((await prisma.batch.findUniqueOrThrow({ where: { id: b1.id } })).status).toBe('reserved');
      expect(await kg(b2.id)).toBe(3);
      expect((await prisma.batch.findUniqueOrThrow({ where: { id: b2.id } })).status).toBe('in_stock');
      const catalog = await http().get('/catalog').set(as(f.token)).expect(200);
      const free = catalog.body.items.filter((i: { materialTypeId: number }) => i.materialTypeId === m);
      expect(free.map((r: { availableKg: string }) => Number(r.availableKg))).toEqual([3]);

      // The buyer is told, and nobody else can see the order.
      const notes = await http().get('/notifications').set(as(f.token)).expect(200);
      expect(notes.body.items.some((n: { title: string }) => n.title === 'Order placed')).toBe(true);
      const other = await newFactory();
      await http().get(`/orders/${placed.body.id}`).set(as(other.token)).expect(404);
      expect((await http().get('/orders').set(as(other.token)).expect(200)).body.items).toEqual([]);
      expect((await http().get('/orders').set(as(f.token)).expect(200)).body.items).toHaveLength(1);

      // A later price change does not touch what was ordered.
      await http().patch(`/materials/${m}`).set(as(admin)).send({ pricePerKg: 99 }).expect(200);

      await http().post(`/orders/${placed.body.id}/dispatch`).set(as(admin)).expect(409); // not confirmed yet
      await http().post(`/orders/${placed.body.id}/confirm`).set(as(f.token)).expect(403);
      await http().post(`/orders/${placed.body.id}/confirm`).set(as(admin)).expect(200);
      await http().post(`/orders/${placed.body.id}/dispatch`).set(as(admin)).expect(200);
      const delivered = await http().post(`/orders/${placed.body.id}/deliver`).set(as(admin)).expect(200);
      expect(delivered.body.status).toBe('delivered');
      expect(delivered.body.deliveredAt).not.toBeNull();
      await http().post(`/orders/${placed.body.id}/deliver`).set(as(admin)).expect(409);

      expect(await prisma.batch.count({ where: { materialTypeId: m, status: 'sold' } })).toBe(2);

      // Invoice: 12 kg x 10 = 120.00, numbered, due in 30 days.
      const invoice = delivered.body.invoice;
      expect(invoice.number).toMatch(/^ECO-INV-\d{4}-\d{6}$/);
      expect(Number(invoice.total)).toBe(120);
      expect(invoice.status).toBe('issued');
      const days = (new Date(invoice.dueAt).getTime() - new Date(invoice.issuedAt).getTime()) / 86_400_000;
      expect(Math.round(days)).toBe(30);

      // Factory sees it, another factory does not.
      await http().get(`/invoices/${invoice.id}`).set(as(f.token)).expect(200);
      await http().get(`/invoices/${invoice.id}`).set(as(other.token)).expect(404);
      expect((await http().get('/invoices').set(as(other.token)).expect(200)).body.items).toEqual([]);

      // Overdue shows without a job; paying clears it; paying twice is refused; a factory cannot pay.
      await prisma.invoice.update({ where: { id: invoice.id }, data: { dueAt: new Date(Date.now() - 86_400_000) } });
      expect((await http().get(`/invoices/${invoice.id}`).set(as(f.token)).expect(200)).body.status).toBe('overdue');
      await http().post(`/invoices/${invoice.id}/pay`).set(as(f.token)).expect(403);
      const paid = await http().post(`/invoices/${invoice.id}/pay`).set(as(admin)).expect(200);
      expect(paid.body.status).toBe('paid');
      expect(paid.body.paidAt).not.toBeNull();
      await http().post(`/invoices/${invoice.id}/pay`).set(as(admin)).expect(409);
    });

    it('refuses when stock is short and reserves nothing, even for the other lines', async () => {
      const ok = await newMaterial();
      const short = await newMaterial();
      const okBatch = await addBatch(ok, 20);
      await addBatch(short, 2);
      const f = await newFactory();

      const res = await order(f.token, [
        { materialTypeId: ok, quantityKg: 5 },
        { materialTypeId: short, quantityKg: 3 },
      ]).expect(409);
      expect(res.body.code).toBe('insufficient_stock');
      expect(Number(res.body.details.availableKg)).toBe(2);

      expect(await kg(okBatch.id)).toBe(20);
      expect((await prisma.batch.findUniqueOrThrow({ where: { id: okBatch.id } })).status).toBe('in_stock');
      expect(await prisma.batch.count({ where: { materialTypeId: ok, status: 'reserved' } })).toBe(0);
      expect(await prisma.factoryOrder.count({ where: { factoryId: f.id } })).toBe(0);
    });

    it('respects the grade filter and merges duplicate lines', async () => {
      const m = await newMaterial();
      await addBatch(m, 10, 'A');
      await addBatch(m, 10, 'B');
      const f = await newFactory();

      const gradeB = await order(f.token, [{ materialTypeId: m, grade: 'B', quantityKg: 4 }]).expect(201);
      expect(gradeB.body.items[0].batch.grade).toBe('B');
      await order(f.token, [{ materialTypeId: m, grade: 'B', quantityKg: 7 }]).expect(409); // only 6 B left

      const twice = await order(f.token, [
        { materialTypeId: m, grade: 'A', quantityKg: 2 },
        { materialTypeId: m, grade: 'A', quantityKg: 3 },
      ]).expect(201);
      expect(twice.body.items.map((i: { quantityKg: string }) => Number(i.quantityKg))).toEqual([5]);
    });

    it('cancelling releases the stock; the rules for who may cancel when', async () => {
      const m = await newMaterial();
      const b = await addBatch(m, 10);
      const f = await newFactory();

      const o1 = await order(f.token, [{ materialTypeId: m, quantityKg: 10 }]).expect(201);
      expect((await prisma.batch.findUniqueOrThrow({ where: { id: b.id } })).status).toBe('reserved');
      const cancelled = await http().post(`/orders/${o1.body.id}/cancel`).set(as(f.token)).expect(200);
      expect(cancelled.body.status).toBe('cancelled');
      expect((await prisma.batch.findUniqueOrThrow({ where: { id: b.id } })).status).toBe('in_stock');
      await http().post(`/orders/${o1.body.id}/cancel`).set(as(f.token)).expect(409);

      // After confirmation only the admin can cancel; after dispatch nobody can.
      const o2 = await order(f.token, [{ materialTypeId: m, quantityKg: 10 }]).expect(201);
      await http().post(`/orders/${o2.body.id}/confirm`).set(as(admin)).expect(200);
      await http().post(`/orders/${o2.body.id}/cancel`).set(as(f.token)).expect(409);
      await http().post(`/orders/${o2.body.id}/dispatch`).set(as(admin)).expect(200);
      await http().post(`/orders/${o2.body.id}/cancel`).set(as(admin)).expect(409);

      const other = await newFactory();
      const o3 = await order(other.token, [{ materialTypeId: m, quantityKg: 1 }]);
      expect(o3.status).toBe(409); // everything is on order 2
      await http().post(`/orders/${o2.body.id}/cancel`).set(as(other.token)).expect(404);
    });

    it('two factories racing for the same stock: one wins, nothing is double reserved', async () => {
      const m = await newMaterial();
      await addBatch(m, 10);
      const [a, b] = await Promise.all([newFactory(), newFactory()]);

      const results = await Promise.all([
        order(a.token, [{ materialTypeId: m, quantityKg: 6 }]),
        order(b.token, [{ materialTypeId: m, quantityKg: 6 }]),
      ]);
      expect(results.map((r) => r.status).sort((x, y) => x - y)).toEqual([201, 409]);
      const reserved = await prisma.batch.aggregate({ where: { materialTypeId: m, status: 'reserved' }, _sum: { weightKg: true } });
      const free = await prisma.batch.aggregate({ where: { materialTypeId: m, status: 'in_stock' }, _sum: { weightKg: true } });
      expect(Number(reserved._sum.weightKg)).toBe(6);
      expect(Number(free._sum.weightKg)).toBe(4);
    });

    it('validates input and who may order', async () => {
      const m = await newMaterial();
      await addBatch(m, 10);
      const f = await newFactory();
      await order(f.token, []).expect(422);
      await order(f.token, [{ materialTypeId: m, quantityKg: 0 }]).expect(422);
      await order(f.token, [{ materialTypeId: m, quantityKg: -1 }]).expect(422);
      await order(f.token, [{ materialTypeId: m, quantityKg: 1.2345 }]).expect(422);
      await order(f.token, [{ materialTypeId: 999999, quantityKg: 1 }]).expect(422);
      await http().post('/orders').set(as(f.token)).send({}).expect(422);

      await prisma.materialType.update({ where: { id: m }, data: { isActive: false } });
      await order(f.token, [{ materialTypeId: m, quantityKg: 1 }]).expect(422);

      const citizen = await registerCustomer(app);
      const employee = await login(app, 'employee@ecoplus.test');
      for (const token of [citizen.token, employee, admin]) {
        await http().post('/orders').set(as(token)).send({ items: [{ materialTypeId: m, quantityKg: 1 }] }).expect(403);
      }
      await http().get('/orders').set(as(citizen.token)).expect(403);
      await http().get('/orders').expect(401);
      await http().get('/orders').set(as(admin)).expect(200);
    });
  });
});
