import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.js';

@Injectable()
export class CommunityService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  getPosts() {
    return this.db.query(`
      SELECT p.*, u.username, u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
  }

  async createPost(userId: string, content: string) {
    const user = await this.db.one('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const result = await this.db.execute('INSERT INTO posts (user_id, content) VALUES (?, ?)', [userId, content]);
    return result.insertId;
  }

  async likePost(id: string) {
    const result = await this.db.execute('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('Post not found');
    }
  }

  getProductReviews(productId: string) {
    return this.db.query(
      `
        SELECT r.*, u.username, u.avatar_url
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
      `,
      [productId],
    );
  }

  async createReview(body: any) {
    const rating = Number(body.rating);
    if (!body.product_id || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Product and rating between 1 and 5 are required');
    }

    const user = await this.db.one('SELECT id FROM users WHERE id = ?', [body.user_id]);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const product = await this.db.one('SELECT id FROM products WHERE id = ?', [body.product_id]);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (body.order_id) {
      const order = await this.db.one('SELECT id FROM orders WHERE id = ? AND user_id = ?', [body.order_id, body.user_id]);
      if (!order) {
        throw new NotFoundException('Order not found for this user');
      }
    }

    const existing = await this.db.one('SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id <=> ?', [
      body.user_id,
      body.product_id,
      body.order_id || null,
    ]);

    if (existing) {
      throw new BadRequestException('You have already reviewed this product for this order');
    }

    const result = await this.db.execute('INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)', [
      body.user_id,
      body.product_id,
      body.order_id || null,
      rating,
      body.comment,
    ]);

    await this.db.execute(
      `
        UPDATE products p
        JOIN (
          SELECT product_id, AVG(rating) AS average_rating, COUNT(*) AS review_count
          FROM reviews
          WHERE product_id = ?
          GROUP BY product_id
        ) rs ON rs.product_id = p.id
        SET p.average_rating = rs.average_rating,
            p.review_count = rs.review_count
        WHERE p.id = ?
      `,
      [body.product_id, body.product_id],
    );

    return result.insertId;
  }
}
