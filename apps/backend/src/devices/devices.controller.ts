import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../auth/auth-user.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type RegisterDeviceDto, registerDeviceSchema } from './devices.schemas.js';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('me/device-tokens')
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @HttpCode(204)
  @Post()
  @ApiOperation({ summary: 'Register this phone for push notifications (moves the token if another user had it)' })
  async register(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(registerDeviceSchema)) dto: RegisterDeviceDto) {
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId: user.id, platform: dto.platform },
      create: { userId: user.id, token: dto.token, platform: dto.platform },
    });
  }

  @HttpCode(204)
  @Delete(':token')
  @ApiOperation({ summary: 'Stop push notifications on this phone (call on logout)' })
  async remove(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token, userId: user.id } });
  }
}
