import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { RolesGuard } from './auth/roles.guard.js';
import { requestId } from './common/request-id.middleware.js';
import { type Env, validateEnv } from './config/env.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, cache: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const inTest = config.get('NODE_ENV', { infer: true }) === 'test';
        return {
          throttlers: [
            { name: 'default', ttl: 60_000, limit: config.get('THROTTLE_LIMIT', { infer: true }), skipIf: () => inTest },
            {
              // Stricter limit for login, register and refresh to slow down password guessing.
              name: 'auth',
              ttl: 60_000,
              limit: config.get('AUTH_THROTTLE_LIMIT', { infer: true }),
              skipIf: (ctx) => inTest || !ctx.switchToHttp().getRequest<{ url: string }>().url.startsWith('/auth'),
            },
          ],
        };
      },
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: rate limit first, then login check, then role check.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestId).forRoutes('*path');
  }
}
