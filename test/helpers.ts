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
