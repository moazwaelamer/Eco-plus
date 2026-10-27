/**
 * Development seed. Safe to run more than once (everything is an upsert).
 *
 * All numbers below (point factors, prices, multipliers, capacities) are PLACEHOLDERS until real
 * buyer prices and quotes exist. The test accounts use a known password and must never exist in production.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Role } from '../src/generated/prisma/client.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed test accounts in production.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TEST_PASSWORD = 'Test1234!';

const LEVELS = [
  { name: 'Bronze', minPoints: 0, multiplier: 1.0 },
  { name: 'Silver', minPoints: 500, multiplier: 1.1 },
  { name: 'Gold', minPoints: 2000, multiplier: 1.25 },
  { name: 'Platinum', minPoints: 5000, multiplier: 1.5 },
];

const MATERIALS = [
  { name: 'PET plastic', pointFactor: 10, pricePerKg: 12 },
  { name: 'HDPE plastic', pointFactor: 8, pricePerKg: 9 },
  { name: 'Cardboard', pointFactor: 3, pricePerKg: 4 },
  { name: 'Paper', pointFactor: 2, pricePerKg: 3 },
  { name: 'Glass', pointFactor: 1, pricePerKg: 1 },
  { name: 'Aluminium', pointFactor: 20, pricePerKg: 40 },
  { name: 'Steel', pointFactor: 4, pricePerKg: 6 },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const l of LEVELS) {
    await prisma.level.upsert({ where: { name: l.name }, update: l, create: l });
  }
  for (const m of MATERIALS) {
    await prisma.materialType.upsert({ where: { name: m.name }, update: m, create: m });
  }

  const warehouse =
    (await prisma.warehouse.findFirst({ where: { name: 'Main warehouse' } })) ??
    (await prisma.warehouse.create({
      data: { name: 'Main warehouse', address: 'Placeholder address', capacityKg: 20000 },
    }));

  const factory =
    (await prisma.factory.findFirst({ where: { name: 'Test recycling factory' } })) ??
    (await prisma.factory.create({
      data: { name: 'Test recycling factory', contact: 'factory@ecoplus.test', address: 'Placeholder address' },
    }));

  const bronze = await prisma.level.findUniqueOrThrow({ where: { name: 'Bronze' } });

  const accounts: { name: string; email: string; phone: string; role: Role }[] = [
    { name: 'Test Citizen', email: 'citizen@ecoplus.test', phone: '+201000000001', role: 'citizen' },
    { name: 'Test Business', email: 'business@ecoplus.test', phone: '+201000000002', role: 'business' },
    { name: 'Test Driver', email: 'driver@ecoplus.test', phone: '+201000000003', role: 'driver' },
    { name: 'Test Employee', email: 'employee@ecoplus.test', phone: '+201000000004', role: 'employee' },
    { name: 'Test Admin', email: 'admin@ecoplus.test', phone: '+201000000005', role: 'admin' },
    { name: 'Test Factory User', email: 'factory@ecoplus.test', phone: '+201000000006', role: 'factory' },
  ];

  for (const a of accounts) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { name: a.name, role: a.role, factoryId: a.role === 'factory' ? factory.id : null },
      create: {
        ...a,
        passwordHash,
        factoryId: a.role === 'factory' ? factory.id : null,
      },
    });

    if (a.role === 'citizen') {
      await prisma.citizenProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, levelId: bronze.id, address: 'Placeholder address', lat: 30.0444, lng: 31.2357 },
      });
    }
    if (a.role === 'business') {
      await prisma.businessProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, businessName: 'Test Cafe', businessType: 'cafe', lat: 30.0626, lng: 31.2497 },
      });
    }
    if (a.role === 'driver') {
      await prisma.driver.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, licenseNo: 'TEST-LICENSE-001' },
      });
    }
    if (a.role === 'employee') {
      await prisma.employee.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, warehouseId: warehouse.id, position: 'Weighing clerk' },
      });
    }
  }

  await prisma.vehicle.upsert({
    where: { plate: 'TEST-123' },
    update: {},
    create: { plate: 'TEST-123', type: 'pickup truck', capacityKg: 1000 },
  });

  console.log('Seed finished: 4 levels, %d materials, 1 warehouse, 1 factory, %d test users.', MATERIALS.length, accounts.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
