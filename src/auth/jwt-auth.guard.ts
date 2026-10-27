import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Role } from '../generated/prisma/enums.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

interface AccessTokenPayload {
  sub: number;
  role: Role;
}

/**
 * Runs on every route. Public routes pass. Others need a valid access token,
 * and the user must still exist and be active, so disabling an account takes effect at once.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const [type, token] = (req.header('authorization') ?? '').split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Missing access token.');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, factoryId: true, isActive: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Account is not active.');

    req.user = { id: user.id, role: user.role, factoryId: user.factoryId };
    return true;
  }
}
