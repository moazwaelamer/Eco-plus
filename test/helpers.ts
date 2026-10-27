import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { INestApplication, Type } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

export async function createTestApp(extraControllers: Type<unknown>[] = []): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: extraControllers,
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

/** Unique contact details so tests never collide with each other or with earlier runs. */
export function uniqueContact() {
  const id = randomUUID().slice(0, 8);
  return { email: `user-${id}@example.test`, phone: `+2010${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}` };
}

export const TEST_PASSWORD = 'Test1234!';

import type { INestApplication as App } from '@nestjs/common';
import request from 'supertest';

/** A real 1x1 PNG, so the upload check that reads the file's first bytes accepts it. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

export async function login(app: App, identifier: string, password = TEST_PASSWORD): Promise<string> {
  const res = await request(app.getHttpServer()).post('/auth/login').send({ identifier, password }).expect(200);
  return res.body.accessToken as string;
}

export interface Customer {
  id: number;
  token: string;
  role: 'citizen' | 'business';
}

export async function registerCustomer(app: App, role: 'citizen' | 'business' = 'citizen'): Promise<Customer> {
  const body = {
    name: role === 'citizen' ? 'Sara Test' : 'Corner Cafe Owner',
    ...uniqueContact(),
    password: TEST_PASSWORD,
    role,
    ...(role === 'business' ? { businessName: 'Corner Cafe', businessType: 'cafe' } : {}),
  };
  const res = await request(app.getHttpServer()).post('/auth/register').send(body).expect(201);
  return { id: res.body.user.id, token: res.body.accessToken, role };
}

/** Uploads a photo, records the scan and asks for a pickup. Returns the API answers. */
export async function bagToPickup(
  app: App,
  customer: Customer,
  opts: { fillLevel?: number; contentType?: string; lat?: number; lng?: number } = {},
) {
  const auth = { Authorization: `Bearer ${customer.token}` };
  const upload = await request(app.getHttpServer()).post('/uploads/image').set(auth).attach('file', TINY_PNG, 'bag.png').expect(201);
  const scan = await request(app.getHttpServer())
    .post('/scans')
    .set(auth)
    .send({
      imageUrl: upload.body.url,
      contentType: opts.contentType ?? 'plastic',
      fillLevel: opts.fillLevel ?? 0.8,
      lat: opts.lat ?? 30.05,
      lng: opts.lng ?? 31.23,
    })
    .expect(201);
  const pickup = await request(app.getHttpServer()).post('/pickup-requests').set(auth).send({ scanId: scan.body.id });
  return { scan: scan.body, pickup };
}
