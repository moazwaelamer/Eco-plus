import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Prisma } from '../generated/prisma/client.js';
import { type Pagination, toPage } from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFactoryDto, CreateFactoryUserDto, UpdateFactoryDto } from './factories.schemas.js';

const BCRYPT_COST = 10;

@Injectable()
export class FactoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFactoryDto) {
    return this.prisma.factory.create({ data: dto });
  }

  async list({ limit, cursor }: Pagination) {
    const rows = await this.prisma.factory.findMany({
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  async get(id: number) {
    const factory = await this.prisma.factory.findUnique({
      where: { id },
      include: { users: { select: { id: true, name: true, phone: true, email: true, isActive: true } } },
    });
    if (!factory) throw new NotFoundException('Factory not found.');
    return factory;
  }

  async update(id: number, dto: UpdateFactoryDto) {
    await this.get(id);
    return this.prisma.factory.update({ where: { id }, data: dto });
  }

  /** A login for someone who orders for this factory. Created by an admin; there is no public sign-up. */
  async createUser(factoryId: number, dto: CreateFactoryUserDto) {
    await this.get(factoryId);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    try {
      return await this.prisma.user.create({
        data: { name: dto.name, phone: dto.phone, email: dto.email, passwordHash, role: 'factory', factoryId },
        select: { id: true, name: true, phone: true, email: true, role: true, factoryId: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This phone number or email is already used.');
      }
      throw e;
    }
  }
}
