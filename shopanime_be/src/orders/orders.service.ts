import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DbService } from '../db/db.service.js';

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'] as const;

function orderStatus(value: unknown) {
  const status = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) {
    throw new BadRequestException('Invalid order status');
  }
  return status;
}

@Injectable()
export class OrdersService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  getAllOrders() {
    return this.db.query('SELECT * FROM orders ORDER BY created_at DESC');
  }

  getUserOrders(userId: string) {
    return this.db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  async getOrderDetails(id: string): Promise<any> {
    const order = await this.db.one('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return null;
    }

    const items = await this.db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    return { ...order, items };
  }

  checkout(body: any) {
    return this.db.transaction(async (tx) => {
      const userId = Number(body.user_id);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new BadRequestException('Valid user_id is required');
      }

      const user = await tx.one('SELECT id FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const requestedItems = Array.isArray(body.items) ? body.items : [];
      const isBuyNowCheckout = requestedItems.length > 0;
      let cartItems: any[] = [];

      if (isBuyNowCheckout) {
        const quantitiesByProductId = new Map<number, number>();
        for (const requestedItem of requestedItems) {
          const productId = Number(requestedItem.product_id);
          const quantity = Number(requestedItem.quantity || 1);
          if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            throw new BadRequestException('Product and positive quantity are required');
          }
          quantitiesByProductId.set(productId, (quantitiesByProductId.get(productId) || 0) + quantity);
        }

        const productIds = [...quantitiesByProductId.keys()];
        const placeholders = productIds.map(() => '?').join(', ');
        const products = await tx.query<any>(
          `
            SELECT id, name, price, stock_quantity, shipping_final_fee, image_url AS image
            FROM products
            WHERE id IN (${placeholders})
            FOR UPDATE
          `,
          productIds,
        );

        if (products.length !== productIds.length) {
          throw new NotFoundException('Product not found');
        }

        cartItems = products.map((product) => ({
          ...product,
          quantity: quantitiesByProductId.get(Number(product.id)) || 1,
        }));
      } else {
        cartItems = await tx.query<any>(
          `
            SELECT c.quantity, p.id, p.name, p.price, p.stock_quantity, p.shipping_final_fee, p.image_url AS image
            FROM carts c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
            FOR UPDATE
          `,
          [userId],
        );
      }

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      let subtotal = 0;
      let shippingFee = 0;
      for (const item of cartItems) {
        if (Number(item.stock_quantity) < Number(item.quantity)) {
          throw new BadRequestException(`Product ${item.name} is out of stock`);
        }
        subtotal += Number(item.price) * Number(item.quantity);
        shippingFee += Number(item.shipping_final_fee || 0);
      }

      const finalAmount = subtotal + shippingFee;
      const orderCode = `ORD-${Date.now()}`;

      const orderResult = await tx.execute(
        `
          INSERT INTO orders (
            user_id, order_code, receiver_name, receiver_phone, shipping_address_line,
            shipping_ward, shipping_district, shipping_city, subtotal_amount, shipping_fee,
            total_amount, final_amount, status, shipping_method, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
        `,
        [
          userId,
          orderCode,
          body.receiver_name,
          body.receiver_phone,
          body.shipping_address_line || null,
          body.shipping_ward || null,
          body.shipping_district || null,
          body.shipping_city || null,
          subtotal,
          shippingFee,
          finalAmount,
          finalAmount,
          body.shipping_method || 'STANDARD',
          body.notes || null,
        ],
      );

      for (const item of cartItems) {
        const itemSubtotal = Number(item.price) * Number(item.quantity);
        await tx.execute(
          `
            INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, subtotal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [orderResult.insertId, item.id, item.name, item.image, item.price, item.quantity, itemSubtotal],
        );

        await tx.execute('UPDATE products SET stock_quantity = stock_quantity - ?, sold_count = sold_count + ? WHERE id = ?', [
          item.quantity,
          item.quantity,
          item.id,
        ]);

        await tx.execute('INSERT INTO inventory_transactions (product_id, type, quantity, note) VALUES (?, ?, ?, ?)', [
          item.id,
          'ORDER',
          -Number(item.quantity),
          `Order #${orderCode}`,
        ]);
      }

      if (!isBuyNowCheckout) {
        await tx.execute('DELETE FROM carts WHERE user_id = ?', [userId]);
      }

      return { orderId: orderResult.insertId, order_code: orderCode, final_amount: finalAmount };
    });
  }

  async updateOrderStatus(id: string, status: string) {
    const result = await this.db.execute('UPDATE orders SET status = ? WHERE id = ?', [orderStatus(status), id]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('Order not found');
    }
  }
}
