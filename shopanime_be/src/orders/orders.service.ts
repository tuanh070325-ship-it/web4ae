import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.js';

@Injectable()
export class OrdersService {
  constructor(private readonly db: DbService) {}

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
      const cartItems = await tx.query<any>(
        `
          SELECT c.quantity, p.id, p.name, p.price, p.stock_quantity, p.image_url AS image
          FROM carts c
          JOIN products p ON c.product_id = p.id
          WHERE c.user_id = ?
          FOR UPDATE
        `,
        [body.user_id],
      );

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      let subtotal = 0;
      for (const item of cartItems) {
        if (Number(item.stock_quantity) < Number(item.quantity)) {
          throw new BadRequestException(`Product ${item.name} is out of stock`);
        }
        subtotal += Number(item.price) * Number(item.quantity);
      }

      const shippingFee = 15;
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
          body.user_id,
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

      await tx.execute('DELETE FROM carts WHERE user_id = ?', [body.user_id]);

      return { orderId: orderResult.insertId, order_code: orderCode, final_amount: finalAmount };
    });
  }

  async updateOrderStatus(id: string, status: string) {
    const result = await this.db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('Order not found');
    }
  }
}
