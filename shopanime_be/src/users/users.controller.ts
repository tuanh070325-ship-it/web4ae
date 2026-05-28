import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException, Inject } from '@nestjs/common';
import { UsersService, type AddressInput, type UserInput } from './users.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { AuthGuard, AdminGuard, CurrentUser } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {
    bindControllerMethods(this, [
      'getAllUsers',
      'createUser',
      'getUser',
      'updateUser',
      'deleteUser',
      'getAddresses',
      'createAddress',
      'updateAddress',
      'deleteAddress',
    ]);
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  async getAllUsers() {
    return { data: await this.usersService.getAllUsers() };
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  async createUser(@Body() body: UserInput) {
    const newId = await this.usersService.createUser(body);
    return { data: { id: newId }, message: 'User created' };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getUser(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Cannot view other users profiles');
    }
    return { data: await this.usersService.getUser(id) };
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateUser(@Param('id') id: string, @Body() body: UserInput, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Cannot update other users profiles');
    }
    const updateBody = user.role === 'ADMIN'
      ? body
      : {
        full_name: body.full_name,
        phone: body.phone,
        avatar_url: body.avatar_url,
      };
    await this.usersService.updateUser(id, updateBody);
    return { message: 'User updated successfully' };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { success: true, message: 'User deleted' };
  }

  @Get(':id/addresses')
  @UseGuards(AuthGuard)
  async getAddresses(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Cannot view other users addresses');
    }
    return { data: await this.usersService.getAddresses(id) };
  }

  @Post(':id/addresses')
  @UseGuards(AuthGuard)
  async createAddress(@Param('id') id: string, @Body() body: AddressInput, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Cannot create address for other users');
    }
    const newId = await this.usersService.createAddress(id, body);
    return { data: { id: newId }, message: 'Address created' };
  }

  @Put(':id/addresses/:addressId')
  @UseGuards(AuthGuard)
  async updateAddress(@Param('id') id: string, @Param('addressId') addressId: string, @Body() body: AddressInput, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Cannot update address for other users');
    }
    await this.usersService.updateAddress(id, addressId, body);
    return { message: 'Address updated' };
  }

  @Delete(':id/addresses/:addressId')
  @UseGuards(AuthGuard)
  async deleteAddress(@Param('id') id: string, @Param('addressId') addressId: string, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Cannot delete address for other users');
    }
    await this.usersService.deleteAddress(id, addressId);
    return { message: 'Address deleted' };
  }
}
