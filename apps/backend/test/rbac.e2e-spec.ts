import { Controller, Get, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { Roles } from '../src/auth/roles.decorator.js';
import { TEST_PASSWORD, createTestApp } from './helpers.js';

// Temporary probe routes that only exist inside this test.
@Controller('rbac-probe')
class ProbeController {
  @Get('any')
  any() {
    return { ok: true };
  }

  @Roles('admin')
  @Get('admin')
  admin() {
    return { ok: true };
  }

  @Roles('driver', 'employee')
  @Get('staff')
  staff() {
    return { ok: true };
  }
}

const SEEDED = {
  citizen: 'citizen@ecoplus.test',
  business: 'business@ecoplus.test',
  driver: 'driver@ecoplus.test',
  employee: 'employee@ecoplus.test',
  admin: 'admin@ecoplus.test',
  factory: 'factory@ecoplus.test',
} as const;

type RoleName = keyof typeof SEEDED;
const ROLES = Object.keys(SEEDED) as RoleName[];

describe('Role-based access control', () => {
  let app: INestApplication;
  const tokens = {} as Record<RoleName, string>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp([ProbeController]);
    for (const role of ROLES) {
      const res = await http().post('/auth/login').send({ identifier: SEEDED[role], password: TEST_PASSWORD }).expect(200);
      tokens[role] = res.body.accessToken;
    }
  });
  afterAll(async () => {
    await app.close();
  });

  const call = (path: string, role?: RoleName) => {
    const req = http().get(`/rbac-probe/${path}`);
    return role ? req.set('Authorization', `Bearer ${tokens[role]}`) : req;
  };

  it('401 for anonymous callers on every probe route', async () => {
    for (const path of ['any', 'admin', 'staff']) await call(path).expect(401);
  });

  it('any logged-in role may use a route without @Roles', async () => {
    for (const role of ROLES) await call('any', role).expect(200);
  });

  it.each([
    ['admin', ['admin']],
    ['staff', ['driver', 'employee']],
  ] as const)('route "%s" is open only to its roles (others get 403)', async (path, allowed) => {
    for (const role of ROLES) {
      await call(path, role).expect(allowed.includes(role as never) ? 200 : 403);
    }
  });

  it('a disabled account loses access immediately, even with a valid token', async () => {
    const prisma = app.get(PrismaService);
    await call('any', 'citizen').expect(200);
    await prisma.user.update({ where: { email: SEEDED.citizen }, data: { isActive: false } });
    try {
      await call('any', 'citizen').expect(401);
      await http().post('/auth/login').send({ identifier: SEEDED.citizen, password: TEST_PASSWORD }).expect(401);
    } finally {
      await prisma.user.update({ where: { email: SEEDED.citizen }, data: { isActive: true } });
    }
  });
});
