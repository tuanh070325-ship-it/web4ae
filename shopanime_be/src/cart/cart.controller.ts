import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException, Inject } from '@nestjs/common';
import { CartService, type CartItemInput } from './cart.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { AuthGuard, CurrentUser } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller('cart')
export class CartController {
  constructor(@Inject(CartService) private readonly cartService: CartService) {
    bindControllerMethods(this, [
      'getMyCart',
      'getCart',
      'addMyCartItem',
      'addToCart',
      'updateMyCartItem',
      'updateCart',
      'removeMyCartItem',
      'clearMyCart',
      'removeFromCart',
    ]);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getMyCart(@CurrentUser() user: RequestUser) {
    return { data: await this.cartService.getCart(String(user.id)) };
  }

  @Get(':user_id')
  @UseGuards(AuthGuard)
  async getCart(@Param('user_id') userId: string, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(userId) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Cannot access other users cart');
    }
    return { data: await this.cartService.getCart(userId) };
  }

  @Post('items')
  @UseGuards(AuthGuard)
  async addMyCartItem(@Body() body: { product_id?: number; quantity?: number }, @CurrentUser() user: RequestUser) {
    await this.cartService.addToCart({ user_id: user.id, product_id: body.product_id, quantity: body.quantity || 1 });
    return { success: true, message: 'Added to cart' };
  }

  @Post()
  @UseGuards(AuthGuard)
  async addToCart(@Body() body: CartItemInput, @CurrentUser() user: RequestUser) {
    if (user.id !== Number(body.user_id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    await this.cartService.addToCart(body);
    return { success: true, message: 'Added to cart' };
  }

  @Put('items/:product_id')
  @UseGuards(AuthGuard)
  async updateMyCartItem(
    @Param('product_id') productId: string,
    @Body() body: { quantity?: number },
    @CurrentUser() user: RequestUser,
  ) {
    await this.cartService.updateCart(String(user.id), productId, Number(body.quantity));
    return { success: true };
  }

  @Put(':user_id/:product_id')
  @UseGuards(AuthGuard)
  async updateCart(
    @Param('user_id') userId: string, 
    @Param('product_id') productId: string, 
    @Body() body: { quantity?: unknown }, 
    @CurrentUser() user: RequestUser,
  ) {
    if (user.id !== parseInt(userId) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    await this.cartService.updateCart(userId, productId, Number(body.quantity));
    return { success: true };
  }

  @Delete('items/:product_id')
  @UseGuards(AuthGuard)
  async removeMyCartItem(@Param('product_id') productId: string, @CurrentUser() user: RequestUser) {
    await this.cartService.removeFromCart(String(user.id), productId);
    return { success: true, message: 'Item removed from cart' };
  }

  @Delete()
  @UseGuards(AuthGuard)
  async clearMyCart(@CurrentUser() user: RequestUser) {
    await this.cartService.clearCart(String(user.id));
    return { success: true, message: 'Cart cleared' };
  }

  @Delete(':user_id/:product_id')
  @UseGuards(AuthGuard)
  async removeFromCart(
    @Param('user_id') userId: string, 
    @Param('product_id') productId: string, 
    @CurrentUser() user: RequestUser,
  ) {
    if (user.id !== parseInt(userId) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    await this.cartService.removeFromCart(userId, productId);
    return { success: true, message: 'Item removed from cart' };
  }
}
