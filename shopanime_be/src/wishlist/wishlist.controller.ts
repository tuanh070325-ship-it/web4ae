import { Body, Controller, Delete, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, RequestUser } from '../db/auth.guard.js';
import { WishlistService } from './wishlist.service.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(@Inject(WishlistService) private readonly wishlistService: WishlistService) {
    bindControllerMethods(this, ['getWishlist', 'addToWishlist', 'removeFromWishlist', 'moveToCart']);
  }

  @Get()
  async getWishlist(@CurrentUser() user: RequestUser) {
    return { data: await this.wishlistService.getWishlist(user.id) };
  }

  @Post()
  async addToWishlist(@Body() body: { product_id?: number }, @CurrentUser() user: RequestUser) {
    await this.wishlistService.addToWishlist(user.id, Number(body.product_id));
    return { success: true, message: 'Added to wishlist' };
  }

  @Delete(':productId')
  async removeFromWishlist(@Param('productId') productId: string, @CurrentUser() user: RequestUser) {
    await this.wishlistService.removeFromWishlist(user.id, Number(productId));
    return { success: true, message: 'Removed from wishlist' };
  }

  @Post(':productId/move-to-cart')
  async moveToCart(@Param('productId') productId: string, @CurrentUser() user: RequestUser) {
    await this.wishlistService.moveToCart(user.id, Number(productId));
    return { success: true, message: 'Moved to cart' };
  }
}
