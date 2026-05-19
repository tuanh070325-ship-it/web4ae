import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CartService } from '../cart/cart.service.js';
import { DbService } from '../db/db.service.js';

@Injectable()
export class WishlistService {
  constructor(
    @Inject(DbService) private readonly db: DbService,
    @Inject(CartService) private readonly cartService: CartService,
  ) {}

  getWishlist(userId: number) {
    return this.db.query(
      `
        SELECT w.id AS wishlist_item_id, w.created_at AS added_at, p.*, p.image_url AS image,
               a.name AS author, a.name AS author_name, c.name AS category_name
        FROM wishlists w
        JOIN products p ON w.product_id = p.id
        LEFT JOIN authors a ON p.author_id = a.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
      `,
      [userId],
    );
  }

  async addToWishlist(userId: number, productId: number) {
    const product = await this.db.one('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.db.execute('INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)', [userId, productId]);
  }

  removeFromWishlist(userId: number, productId: number) {
    return this.db.execute('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
  }

  async moveToCart(userId: number, productId: number) {
    await this.addToWishlist(userId, productId);
    await this.cartService.addToCart({ user_id: userId, product_id: productId, quantity: 1 });
    await this.removeFromWishlist(userId, productId);
  }
}
