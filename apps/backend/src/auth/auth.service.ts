import { createHash, randomBytes } from 'node:crypto';
import { ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto, RegisterDto } from './auth.schemas.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

const BCRYPT_COST = 10;
// Compared against when the account does not exist, so response time does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto) {
    const clash = await this.prisma.user.findFirst({
      where: { OR: [...(dto.email ? [{ email: dto.email }] : []), ...(dto.phone ? [{ phone: dto.phone }] : [])] },
      select: { id: true },
    });
    if (clash) throw new ConflictException('An account with this phone or email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          role: dto.role,
        },
      });

      if (dto.role === 'citizen') {
        const firstLevel = await tx.level.findFirst({ orderBy: { minPoints: 'asc' } });
        if (!firstLevel) {
          throw new HttpException(
            { code: 'setup_incomplete', message: 'Levels are not configured yet. Run the seed.' },
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        await tx.citizenProfile.create({ data: { userId: created.id, levelId: firstLevel.id } });
      } else {
        await tx.businessProfile.create({
          data: { userId: created.id, businessName: dto.businessName!, businessType: dto.businessType! },
        });
      }
      return created;
    });

    return { user: this.publicUser(user), ...(await this.issueTokens(user.id, user.role)) };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.includes('@') ? dto.identifier.toLowerCase() : dto.identifier;
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok || !user.isActive) {
      throw new UnauthorizedException('Wrong phone, email or password.');
    }

    return { user: this.publicUser(user), ...(await this.issueTokens(user.id, user.role)) };
  }

  /** Rotates the refresh token. Presenting an already-used token revokes every session of that user. */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token.');

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token was already used. Please log in again.');
    }
    if (stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Refresh token expired. Please log in again.');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.user.id, stored.user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { citizenProfile: { include: { level: true } }, businessProfile: true },
    });
    return {
      ...this.publicUser(user),
      citizenProfile: user.citizenProfile,
      businessProfile: user.businessProfile,
    };
  }

  private async issueTokens(userId: number, role: string): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync({ sub: userId, role });

    const refreshToken = randomBytes(48).toString('base64url');
    const days = this.config.get('REFRESH_TTL_DAYS', { infer: true });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  private publicUser(u: { id: number; name: string; phone: string | null; email: string | null; role: string }) {
    return { id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role };
  }
}
