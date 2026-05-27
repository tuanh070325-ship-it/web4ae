import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { verifyAuthToken } from '../auth/token.js';

interface PostCommentRow {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  username: string;
  avatar_url: string | null;
  content: string | null;
  status: string;
  created_at: string;
}

function optionalString(value: unknown) {
  if (typeof value !== 'string') {return undefined;}
  const trimmed = value.trim();
  return trimmed || undefined;
}

function positiveId(value: unknown, fieldName: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }
  return id;
}

@Injectable()
export class CommunityService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  getOptionalUserId(request: any) {
    const authorization = request?.headers?.authorization;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    const tokenPayload = token ? verifyAuthToken(token) : null;
    const allowDevUserHeader = process.env.NODE_ENV !== 'production';
    const headerUserId = allowDevUserHeader ? request?.headers?.['x-user-id'] : null;
    const userId = Number(tokenPayload?.sub || headerUserId || 0);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  }

  async getPosts(currentUserId: number | null = null) {
    const posts = await this.db.query(`
      SELECT
        p.*,
        COALESCE(cc.active_comment_count, 0) AS comment_count,
        u.username,
        u.avatar_url,
        CASE
          WHEN ? > 0 AND EXISTS (
            SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?
          ) THEN 1 ELSE 0
        END AS liked_by_me
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS active_comment_count
        FROM post_comments
        WHERE status = 'ACTIVE'
        GROUP BY post_id
      ) cc ON cc.post_id = p.id
      WHERE p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
    `, [currentUserId || 0, currentUserId || 0]);

    if (posts.length === 0) {
      return posts;
    }

    const postIds = posts.map((post: any) => Number(post.id));
    const placeholders = postIds.map(() => '?').join(', ');
    const comments = await this.db.query<PostCommentRow & any>(`
      SELECT
        pc.id,
        pc.post_id,
        pc.user_id,
        pc.parent_id,
        CASE WHEN pc.status = 'HIDDEN' THEN NULL ELSE pc.content END AS content,
        pc.status,
        pc.created_at,
        pc.updated_at,
        u.username,
        u.avatar_url
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id IN (${placeholders}) AND pc.status IN ('ACTIVE', 'HIDDEN')
      ORDER BY pc.created_at ASC, pc.id ASC
    `, postIds);
    const commentsByPostId = new Map<number, PostCommentRow[]>();
    for (const comment of comments) {
      const postComments = commentsByPostId.get(Number(comment.post_id)) || [];
      postComments.push(comment);
      commentsByPostId.set(Number(comment.post_id), postComments);
    }

    return posts.map((post: any) => ({
      ...post,
      liked_by_me: Boolean(post.liked_by_me),
      comments: commentsByPostId.get(Number(post.id)) || [],
    }));
  }

  async createPost(userId: string, content: string) {
    const user = await this.db.one('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const result = await this.db.execute('INSERT INTO posts (user_id, content) VALUES (?, ?)', [userId, content]);
    return result.insertId;
  }

  async toggleLike(postIdValue: string, userId: number) {
    const postId = positiveId(postIdValue, 'post_id');
    return this.db.transaction(async (tx) => {
      const post = await tx.one('SELECT id FROM posts WHERE id = ? AND status = ? FOR UPDATE', [postId, 'ACTIVE']);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const insertResult = await tx.execute(
        'INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [postId, userId],
      );
      const liked = insertResult.affectedRows > 0;

      if (liked) {
        await tx.execute('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
      } else {
        await tx.execute('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
        await tx.execute('UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [postId]);
      }

      const updated = await tx.one<any>('SELECT like_count FROM posts WHERE id = ?', [postId]);
      return { liked, like_count: Number(updated?.like_count || 0) };
    });
  }

  async createComment(postIdValue: string, userId: number, body: any) {
    const postId = positiveId(postIdValue, 'post_id');
    const content = optionalString(body.content);
    const parentId = body.parent_id === null || body.parent_id === undefined || body.parent_id === ''
      ? null
      : positiveId(body.parent_id, 'parent_id');

    if (!content) {
      throw new BadRequestException('Comment content is required');
    }
    if (content.length > 2000) {
      throw new BadRequestException('Comment must be 2000 characters or fewer');
    }

    return this.db.transaction(async (tx) => {
      const post = await tx.one('SELECT id FROM posts WHERE id = ? AND status = ?', [postId, 'ACTIVE']);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (parentId) {
        const parent = await tx.one('SELECT id FROM post_comments WHERE id = ? AND post_id = ? AND status = ?', [parentId, postId, 'ACTIVE']);
        if (!parent) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      const result = await tx.execute(
        'INSERT INTO post_comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
        [postId, userId, parentId, content],
      );
      await tx.execute('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [postId]);

      return tx.one<PostCommentRow & any>(`
        SELECT pc.*, u.username, u.avatar_url
        FROM post_comments pc
        JOIN users u ON pc.user_id = u.id
        WHERE pc.id = ?
      `, [result.insertId]);
    });
  }

  async updateComment(postIdValue: string, commentIdValue: string, body: any, user: RequestUser) {
    const postId = positiveId(postIdValue, 'post_id');
    const commentId = positiveId(commentIdValue, 'comment_id');
    const content = optionalString(body.content);

    if (!content) {
      throw new BadRequestException('Comment content is required');
    }
    if (content.length > 2000) {
      throw new BadRequestException('Comment must be 2000 characters or fewer');
    }

    return this.db.transaction(async (tx) => {
      const comment = await tx.one<any>('SELECT id, user_id FROM post_comments WHERE id = ? AND post_id = ? AND status = ?', [commentId, postId, 'ACTIVE']);
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      if (Number(comment.user_id) !== user.id) {
        throw new ForbiddenException('Forbidden');
      }

      await tx.execute('UPDATE post_comments SET content = ? WHERE id = ? AND post_id = ?', [content, commentId, postId]);
      return tx.one<PostCommentRow & any>(`
        SELECT pc.*, u.username, u.avatar_url
        FROM post_comments pc
        JOIN users u ON pc.user_id = u.id
        WHERE pc.id = ?
      `, [commentId]);
    });
  }

  async hideComment(postIdValue: string, commentIdValue: string, user: RequestUser) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }

    const postId = positiveId(postIdValue, 'post_id');
    const commentId = positiveId(commentIdValue, 'comment_id');
    return this.db.transaction(async (tx) => {
      const comment = await tx.one<any>('SELECT id FROM post_comments WHERE id = ? AND post_id = ? AND status = ?', [commentId, postId, 'ACTIVE']);
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      await tx.execute('UPDATE post_comments SET status = ? WHERE id = ? AND post_id = ?', ['HIDDEN', commentId, postId]);
      await tx.execute('UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?', [postId]);
      return tx.one<PostCommentRow & any>(`
        SELECT
          pc.id,
          pc.post_id,
          pc.user_id,
          pc.parent_id,
          NULL AS content,
          pc.status,
          pc.created_at,
          pc.updated_at,
          u.username,
          u.avatar_url
        FROM post_comments pc
        JOIN users u ON pc.user_id = u.id
        WHERE pc.id = ?
      `, [commentId]);
    });
  }

  async deleteComment(postIdValue: string, commentIdValue: string, user: RequestUser) {
    const postId = positiveId(postIdValue, 'post_id');
    const commentId = positiveId(commentIdValue, 'comment_id');
    return this.db.transaction(async (tx) => {
      const comment = await tx.one<any>('SELECT id, user_id, status FROM post_comments WHERE id = ? AND post_id = ? AND status IN (?, ?)', [commentId, postId, 'ACTIVE', 'HIDDEN']);
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      if (Number(comment.user_id) !== user.id && user.role !== 'ADMIN') {
        throw new ForbiddenException('Forbidden');
      }

      await tx.execute('UPDATE post_comments SET status = ? WHERE id = ? AND post_id = ?', ['DELETED', commentId, postId]);
      if (comment.status === 'ACTIVE') {
        await tx.execute('UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?', [postId]);
      }
    });
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
