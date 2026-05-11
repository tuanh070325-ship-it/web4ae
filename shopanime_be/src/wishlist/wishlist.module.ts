import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module.js';
import { DbModule } from '../db/db.module.js';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';

@Module({
  imports: [DbModule, CartModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
