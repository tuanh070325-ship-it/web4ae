import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { AuthGuard, CurrentUser } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

class RegisterDto {
  @IsString()
  username?: string;

  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  full_name?: string;
}

class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    bindControllerMethods(this, ['register', 'login', 'me', 'logout']);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return { data: await this.authService.register(body) };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
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
