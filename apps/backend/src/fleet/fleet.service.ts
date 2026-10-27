import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Prisma } from '../generated/prisma/client.js';
import { type Pagination, toPage } from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateDriverDto, CreateVehicleDto, UpdateDriverDto, UpdateVehicleDto } from './fleet.schemas.js';

const BCRYPT_COST = 10;

const driverSelect = {
  userId: true,
  licenseNo: true,
  status: true,
  user: { select: { name: true, phone: true, email: true, isActive: true } },
} as const;

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Vehicles ----------

  async createVehicle(dto: CreateVehicleDto) {
    try {
      return await this.prisma.vehicle.create({ data: dto });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('A vehicle with this plate already exists.');
      throw e;
    }
  }

  async listVehicles({ limit, cursor }: Pagination) {
    const rows = await this.prisma.vehicle.findMany({
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  async updateVehicle(id: number, dto: UpdateVehicleDto) {
    const exists = await this.prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Vehicle not found.');
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  // ---------- Drivers ----------

  /** Staff accounts are created by an admin. The driver logs in with the phone or email and this password. */
  async createDriver(dto: CreateDriverDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          role: 'driver',
          driver: { create: { licenseNo: dto.licenseNo } },
        },
        select: { id: true },
      });
      return this.getDriver(user.id);
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('This phone number or email is already used.');
      throw e;
    }
  }

  async listDrivers({ limit, cursor }: Pagination) {
    const rows = await this.prisma.driver.findMany({
      select: driverSelect,
      orderBy: { userId: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { userId: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1]!.userId : null };
  }

  async getDriver(userId: number) {
    const driver = await this.prisma.driver.findUnique({ where: { userId }, select: driverSelect });
    if (!driver) throw new NotFoundException('Driver not found.');
    return driver;
  }

  async updateDriver(userId: number, dto: UpdateDriverDto) {
    await this.getDriver(userId);
    const { isActive, ...driverFields } = dto;
    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(driverFields).length > 0) await tx.driver.update({ where: { userId }, data: driverFields });
      if (isActive !== undefined) await tx.user.update({ where: { id: userId }, data: { isActive } });
    });
    return this.getDriver(userId);
  }
}
