import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, login } from './helpers.js';

describe('Admin stats', () => {
  let app: INestApplication;
  let admin: string;
  let citizen: string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    admin = await login(app, 'admin@ecoplus.test');
    citizen = await login(app, 'citizen@ecoplus.test');
  });
  afterAll(() => app.close());

  it('returns one row per day with totals', async () => {
    const res = await http().get('/admin/stats?days=7').set(as(admin)).expect(200);
    expect(res.body.series).toHaveLength(7);
    expect(res.body.rejectionRate).toBeGreaterThanOrEqual(0);
    expect(res.body.rejectionRate).toBeLessThanOrEqual(1);
  });

  it('rejects a bad range and non-admins', async () => {
    await http().get('/admin/stats?days=500').set(as(admin)).expect(422);
    await http().get('/admin/stats').set(as(citizen)).expect(403);
    await http().get('/admin/points').set(as(citizen)).expect(403);
  });

  it('lists shipment points', async () => {
    const res = await http().get('/admin/points').set(as(admin)).expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
