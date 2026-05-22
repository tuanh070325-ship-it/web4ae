import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { AuthGuard, CurrentUser } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    bindControllerMethods(this, ['register', 'login', 'me', 'logout']);
  }

  @Post('register')
  async register(@Body() body: { username?: string; email?: string; password?: string; full_name?: string }) {
    return { data: await this.authService.register(body) };
  }

  @Post('login')
  async login(@Body() body: { email?: string; username?: string; password?: string }) {
    return { data: await this.authService.login(body) };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: RequestUser) {
    return { data: await this.authService.me(user) };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout() {
    return { success: true, message: 'Logged out' };
  }
}
