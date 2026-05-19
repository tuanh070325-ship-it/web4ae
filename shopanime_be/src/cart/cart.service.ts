import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DbService } from '../db/db.service.js';

@Injectable()
export class CartService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  getCart(userId: string) {
    return this.db.query(
      `
        SELECT c.id AS cart_item_id, c.quantity, p.*, p.image_url AS image
        FROM carts c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
      `,
      [userId],
    );
  }

  async addToCart(body: any) {
    const quantity = Number(body.quantity || 1);
    if (!body.product_id || quantity <= 0) {
      throw new BadRequestException('Product and positive quantity are required');
    }

    const product = await this.db.one<any>('SELECT stock_quantity FROM products WHERE id = ?', [body.product_id]);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (Number(product.stock_quantity) < quantity) {
      throw new BadRequestException('Not enough stock');
    }

    await this.db.execute(
      `
        INSERT INTO carts (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `,
      [body.user_id, body.product_id, quantity],
    );
  }

  async updateCart(userId: string, productId: string, quantity: number) {
    if (Number(quantity) <= 0) {
      await this.db.execute('DELETE FROM carts WHERE user_id = ? AND product_id = ?', [userId, productId]);
      return;
    }

    await this.db.execute('UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, userId, productId]);
  }

  removeFromCart(userId: string, productId: string) {
    return this.db.execute('DELETE FROM carts WHERE user_id = ? AND product_id = ?', [userId, productId]);
  }

  clearCart(userId: string) {
    return this.db.execute('DELETE FROM carts WHERE user_id = ?', [userId]);
  }
}
