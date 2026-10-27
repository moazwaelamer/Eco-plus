import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type AuthUser, CurrentUser } from './auth-user.js';
import { AuthService } from './auth.service.js';
import {
  type LoginDto,
  type RefreshDto,
  type RegisterDto,
  loginSchema,
  refreshSchema,
  registerSchema,
} from './auth.schemas.js';
import { Public } from './public.decorator.js';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Create a citizen or business account (staff accounts are created by an admin)' })
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('auth/login')
  @ApiOperation({ summary: 'Log in with phone or email and password' })
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('auth/refresh')
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair (the old refresh token stops working)' })
  refresh(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(204)
  @Post('auth/logout')
  @ApiOperation({ summary: 'Revoke a refresh token' })
  async logout(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'The logged-in user with profile and level' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
