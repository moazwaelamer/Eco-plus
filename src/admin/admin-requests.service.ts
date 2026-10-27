import { randomBytes } from 'node:crypto';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { ScansService } from '../scans/scans.service.js';
import type { StaffRequestDto } from './admin-requests.schemas.js';

@Injectable()
export class AdminRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scans: ScansService,
    private readonly requests: RequestsService,
  ) {}

  /**
   * For customers without a smartphone: staff enter the bag by phone or WhatsApp.
   * The customer is found by phone number or created as a citizen. A new account gets a random password
   * nobody knows, so the customer can only use it after a password reset (not built yet).
   */
  async createForCustomer(staff: AuthUser, dto: StaffRequestDto) {
    let customer = await this.prisma.user.findUnique({ where: { phone: dto.customer.phone } });
    if (customer && customer.role !== 'citizen' && customer.role !== 'business') {
      throw new UnprocessableEntityException({ code: 'not_a_customer', message: 'This phone number belongs to a staff account.' });
    }

    if (!customer) {
      const level = await this.prisma.level.findFirst({ orderBy: { minPoints: 'asc' } });
      if (!level) throw new UnprocessableEntityException({ code: 'setup_incomplete', message: 'Levels are not configured yet. Run the seed.' });
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('base64url'), 10);
      customer = await this.prisma.user.create({
        data: {
          name: dto.customer.name,
          phone: dto.customer.phone,
          passwordHash,
          role: 'citizen',
          citizenProfile: { create: { levelId: level.id, lat: dto.lat, lng: dto.lng } },
        },
      });
    }

    const scan = await this.scans.create(customer.id, {
      contentType: dto.contentType,
      fillLevel: dto.fillLevel,
      lat: dto.lat,
      lng: dto.lng,
    });
    const result = await this.requests.createFromScan({ scanId: scan.id, channel: dto.channel, createdById: staff.id });
    return { customerId: customer.id, scanId: scan.id, ...result };
  }
}
