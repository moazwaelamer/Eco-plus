import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { type Pagination, toPage } from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateScanDto } from './scans.schemas.js';

const STAFF = ['admin', 'employee'];

@Injectable()
export class ScansService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: number, dto: CreateScanDto) {
    return this.prisma.bagScan.create({
      data: {
        userId,
        imageUrl: dto.imageUrl,
        contentType: dto.contentType,
        fillLevel: dto.fillLevel,
        lat: dto.lat,
        lng: dto.lng,
        source: 'manual',
      },
    });
  }

  async list(userId: number, { limit, cursor }: Pagination) {
    const rows = await this.prisma.bagScan.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return toPage(rows, limit);
  }

  /** Owners see their own scans; admin and employee may read any. */
  async get(user: AuthUser, id: number) {
    const scan = await this.prisma.bagScan.findUnique({ where: { id } });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (scan.userId !== user.id && !STAFF.includes(user.role)) {
      throw new ForbiddenException('This scan belongs to someone else.');
    }
    return scan;
  }
}
