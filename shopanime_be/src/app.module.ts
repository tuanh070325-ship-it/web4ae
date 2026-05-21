import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module.js';
import { UsersModule } from './users/users.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { CommunityModule } from './community/community.module.js';
import { AuthModule } from './auth/auth.module.js';
import { WishlistModule } from './wishlist/wishlist.module.js';
import { ChatbotModule } from './chatbot/chatbot.module.js';

@Module({
  imports: [DbModule, AuthModule, UsersModule, CatalogModule, CartModule, WishlistModule, OrdersModule, CommunityModule, ChatbotModule],
})
export class AppModule {}
