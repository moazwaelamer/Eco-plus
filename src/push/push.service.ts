import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Sends a push message to every phone a user has registered.
 * Only "none" and "log" exist so far: a real FCM sender needs Firebase credentials and is not built yet.
 * Push is a convenience on top of the stored notification, so a failure here never fails the request.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async sendToUser(userId: number, title: string): Promise<void> {
    try {
      const provider = this.config.get('PUSH_PROVIDER', { infer: true });
      if (provider === 'none') return;
      const devices = await this.prisma.deviceToken.count({ where: { userId } });
      // Title only: never log message bodies (they can contain handover codes) or tokens.
      if (devices > 0) this.logger.log(`push to user ${userId} (${devices} device(s)): ${title}`);
    } catch (e) {
      this.logger.warn(`push failed for user ${userId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
