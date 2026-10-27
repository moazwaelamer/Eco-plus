import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';

/** Admins see every factory (undefined = no filter); a factory login sees only its own factory. */
export function factoryScope(user: AuthUser): number | undefined {
  if (user.role === 'admin') return undefined;
  if (user.factoryId === null) throw new ForbiddenException('Your account is not linked to a factory.');
  return user.factoryId;
}
