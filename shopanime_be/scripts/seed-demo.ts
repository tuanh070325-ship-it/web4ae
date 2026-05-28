import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { hashPassword } from '../src/auth/password.js';
import { initializeSchema } from '../src/db/schema.js';

dotenv.config({ path: '.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopanime',
  waitForConnections: true,
  connectionLimit: 2,
  timezone: 'Z',
});

const executor = {
  async execute(sql: string, params: unknown[] = []) {
    const [result] = await pool.execute(sql, params);
    return result as any;
  },
  async query(sql: string, params: unknown[] = []) {
    const [rows] = await pool.query(sql, params);
    return rows as any[];
  },
  async one(sql: string, params: unknown[] = []) {
    const rows = await this.query(sql, params);
    return rows[0] ?? null;
  },
};

const customers = [
  ['aya.sato', 'aya.sato@example.com', 'Aya Sato', '0901000001', 'Tokyo'],
  ['ren.mori', 'ren.mori@example.com', 'Ren Mori', '0901000002', 'Osaka'],
  ['mika.endo', 'mika.endo@example.com', 'Mika Endo', '0901000003', 'Kyoto'],
  ['haru.kim', 'haru.kim@example.com', 'Haru Kim', '0901000004', 'Seoul'],
  ['linh.nguyen', 'linh.nguyen@example.com', 'Linh Nguyen', '0901000005', 'Ho Chi Minh City'],
  ['minh.tran', 'minh.tran@example.com', 'Minh Tran', '0901000006', 'Hanoi'],
  ['nora.lee', 'nora.lee@example.com', 'Nora Lee', '0901000007', 'Singapore'],
  ['kai.chen', 'kai.chen@example.com', 'Kai Chen', '0901000008', 'Taipei'],
  ['emi.tanaka', 'emi.tanaka@example.com', 'Emi Tanaka', '0901000009', 'Yokohama'],
  ['leo.park', 'leo.park@example.com', 'Leo Park', '0901000010', 'Busan'],
  ['sora.ito', 'sora.ito@example.com', 'Sora Ito', '0901000011', 'Nagoya'],
  ['mai.pham', 'mai.pham@example.com', 'Mai Pham', '0901000012', 'Da Nang'],
] as const;

const orderStatuses = ['COMPLETED', 'SHIPPED', 'PROCESSING', 'PENDING', 'COMPLETED', 'SHIPPED', 'CANCELLED'] as const;

function dateTime(daysAgo: number, index: number) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  date.setUTCHours(8 + (index % 10), (index * 11) % 60, 0, 0);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function resetOperationalData() {
  await executor.execute('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['analytics_product_stats', 'analytics_daily_stats', 'analytics_events', 'post_likes', 'post_comments', 'posts', 'reviews', 'order_items', 'orders', 'wishlists', 'carts', 'inventory_transactions']) {
    await executor.execute(`DELETE FROM ${table}`);
  }
  await executor.execute("DELETE FROM user_addresses WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER')");
  await executor.execute("DELETE FROM users WHERE role = 'CUSTOMER'");
  await executor.execute('SET FOREIGN_KEY_CHECKS = 1');
  await executor.execute('UPDATE products SET sold_count = 0, stock_quantity = GREATEST(stock_quantity, 60), status = \'ACTIVE\'');
}

async function seedCustomers() {
  const passwordHash = await hashPassword('password123');
  const userIds: number[] = [];
  for (let index = 0; index < customers.length; index += 1) {
    const [username, email, fullName, phone, city] = customers[index];
    const createdAt = dateTime(34 - index, index);
    const result = await executor.execute(
      `
        INSERT INTO users (username, email, password_hash, full_name, phone, status, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE', 'CUSTOMER', ?, ?)
      `,
      [username, email, passwordHash, fullName, phone, createdAt, createdAt],
    );
    userIds.push(Number(result.insertId));
    await executor.execute(
      `
        INSERT INTO user_addresses (user_id, receiver_name, receiver_phone, address_line, ward, district, city, country, address_type, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Vietnam', 'HOME', 1, ?, ?)
      `,
      [result.insertId, fullName, phone, `${120 + index} Akiba Street`, `Ward ${index % 9 + 1}`, 'Central', city, createdAt, createdAt],
    );
  }
  return userIds;
}

async function seedOrdersAndAnalytics(userIds: number[]) {
  const products = await executor.query('SELECT id, name, price, shipping_final_fee, stock_quantity, image_url FROM products WHERE status = \'ACTIVE\' ORDER BY id ASC LIMIT 30') as Array<{ id: number; name: string; price: string | number; shipping_final_fee: string | number; image_url: string | null }>;
  if (products.length < 6) {
    throw new Error('At least 6 active products are required for demo seed.');
  }

  let orderCount = 0;
  let eventCount = 0;
  for (let day = 29; day >= 0; day -= 1) {
    const sessions = 16 + (29 - day);
    for (let sessionIndex = 0; sessionIndex < sessions; sessionIndex += 1) {
      const product = products[(sessionIndex + day) % products.length];
      const productId = Number(product.id);
      const price = Number(product.price || 0);
      const sessionId = `demo-${dateTime(day, sessionIndex).slice(0, 10)}-${sessionIndex}`;
      const createdAt = dateTime(day, sessionIndex);
      const events = [
        ['page_view', 'traffic', '/', null, { source: 'demo' }],
        ['product_impression', 'product', '/shop', productId, { source: 'shop_grid', position: sessionIndex % 12 + 1 }],
      ] as Array<[string, string, string, number | null, Record<string, string | number>] >;
      if (sessionIndex % 2 === 0) {
        events.push(['product_click', 'product', '/shop', productId, { source: 'shop_grid', position: sessionIndex % 12 + 1 }]);
        events.push(['product_view', 'product', `/product/${productId}`, productId, { source: 'product_detail' }]);
      }
      if (sessionIndex % 4 === 0) {
        events.push(['add_to_cart', 'commerce', `/product/${productId}`, productId, { source: 'product_detail', quantity: 1, price }]);
      }

      let orderId: number | null = null;
      if (sessionIndex % 9 === 0) {
        const userId = userIds[(sessionIndex + day) % userIds.length];
        const status = orderStatuses[orderCount % orderStatuses.length];
        const itemA = products[(sessionIndex + day) % products.length];
        const itemB = products[(sessionIndex + day + 5) % products.length];
        const quantityA = orderCount % 3 === 0 ? 2 : 1;
        const quantityB = orderCount % 4 === 0 ? 1 : 0;
        const subtotal = Number(itemA.price) * quantityA + (quantityB ? Number(itemB.price) * quantityB : 0);
        const shipping = Math.round((Number(itemA.shipping_final_fee || 0) + (quantityB ? Number(itemB.shipping_final_fee || 0) : 0)) * 100) / 100;
        const finalAmount = Math.round((subtotal + shipping) * 100) / 100;
        const orderCode = `ORD-DEMO-${String(orderCount + 1).padStart(4, '0')}`;
        const customer = customers[userIds.indexOf(userId) % customers.length];
        const orderResult = await executor.execute(
          `
            INSERT INTO orders (user_id, order_code, receiver_name, receiver_phone, shipping_address_line, shipping_city, subtotal_amount, shipping_fee, total_amount, final_amount, status, payment_status, shipping_method, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', 'STANDARD', ?, ?)
          `,
          [userId, orderCode, customer[2], customer[3], `${100 + orderCount} Akiba Street`, customer[4], subtotal, shipping, finalAmount, finalAmount, status, createdAt, createdAt],
        );
        orderId = Number(orderResult.insertId);
        for (const item of [{ product: itemA, quantity: quantityA }, ...(quantityB ? [{ product: itemB, quantity: quantityB }] : [])]) {
          const lineSubtotal = Math.round(Number(item.product.price) * item.quantity * 100) / 100;
          await executor.execute(
            'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [orderId, item.product.id, item.product.name, item.product.image_url, item.product.price, item.quantity, lineSubtotal],
          );
          if (status !== 'CANCELLED') {
            await executor.execute('UPDATE products SET sold_count = sold_count + ?, stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id = ?', [item.quantity, item.quantity, item.product.id]);
          }
        }
        if (status !== 'CANCELLED') {
          events.push(['checkout_started', 'commerce', '/checkout', productId, { source: 'cart', revenue: finalAmount }]);
          events.push(['order_completed', 'commerce', '/checkout', productId, { source: 'checkout', revenue: finalAmount, quantity: quantityA }]);
        }
        orderCount += 1;
      }

      for (const [eventName, eventType, path, eventProductId, metadata] of events) {
        await executor.execute(
          `
            INSERT INTO analytics_events (event_name, event_type, session_id, product_id, order_id, path, referrer, utm_source, device_type, browser, user_agent, ip_hash, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [eventName, eventType, sessionId, eventProductId, orderId, path, 'https://google.com', 'demo', sessionIndex % 3 === 0 ? 'mobile' : 'desktop', sessionIndex % 3 === 0 ? 'Safari' : 'Chrome', 'AkibaCore deterministic demo seed', `demo-${sessionIndex}`, JSON.stringify(metadata), createdAt],
        );
        eventCount += 1;
      }
    }
  }

  for (let index = 0; index < userIds.length; index += 1) {
    const userId = userIds[index];
    const product = products[index % products.length];
    await executor.execute('INSERT INTO carts (user_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', [userId, product.id, index % 2 + 1]);
    await executor.execute('INSERT INTO wishlists (user_id, product_id, created_at) VALUES (?, ?, NOW())', [userId, products[(index + 8) % products.length].id]);
  }

  return { orders: orderCount, events: eventCount };
}

try {
  await initializeSchema(executor, { rebuild: false });
  await resetOperationalData();
  const userIds = await seedCustomers();
  const result = await seedOrdersAndAnalytics(userIds);
  const counts = await executor.one(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM order_items) AS order_items,
      (SELECT COUNT(*) FROM analytics_events) AS analytics_events
  `);
  console.log(JSON.stringify({ seeded: result, counts }, null, 2));
} finally {
  await pool.end();
}
