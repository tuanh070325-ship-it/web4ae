import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { initializeSchema, seedSchema } from '../src/db/schema.js';

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

async function seedAnalyticsDemoData() {
  const existing = await executor.one('SELECT COUNT(*) AS total FROM analytics_events');
  if (Number(existing?.total || 0) > 0) {
    return;
  }

  const products = await executor.query('SELECT id, price FROM products ORDER BY sold_count DESC, id ASC LIMIT 12');
  if (products.length === 0) {
    return;
  }

  const paths = ['/', '/shop', '/feed', '/cart'];
  const now = new Date();
  let eventCount = 0;

  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const datePrefix = date.toISOString().slice(0, 10);
    const sessions = 10 + (13 - dayOffset) * 2;

    for (let sessionIndex = 0; sessionIndex < sessions; sessionIndex += 1) {
      const sessionId = `demo-${datePrefix}-${sessionIndex}`;
      const product = products[(sessionIndex + dayOffset) % products.length] as { id: number; price: number | string };
      const productId = Number(product.id);
      const productPrice = Number(product.price || 0);
      const hour = String(8 + (sessionIndex % 12)).padStart(2, '0');
      const minute = String((sessionIndex * 7) % 60).padStart(2, '0');
      const createdAt = `${datePrefix} ${hour}:${minute}:00`;

      const events = [
        { name: 'page_view', type: 'traffic', path: paths[sessionIndex % paths.length], productId: null, metadata: { source: 'demo' } },
        { name: 'landing_view', type: 'traffic', path: '/', productId: null, metadata: { source: 'demo' } },
        { name: 'product_impression', type: 'product', path: '/shop', productId, metadata: { source: 'shop_grid', position: sessionIndex % 12 + 1 } },
      ];

      if (sessionIndex % 2 === 0) {
        events.push({ name: 'product_click', type: 'product', path: '/shop', productId, metadata: { source: 'shop_grid', position: sessionIndex % 12 + 1 } });
        events.push({ name: 'product_view', type: 'product', path: `/product/${productId}`, productId, metadata: { source: 'product_detail' } });
      }
      if (sessionIndex % 4 === 0) {
        events.push({ name: 'add_to_cart', type: 'commerce', path: `/product/${productId}`, productId, metadata: { source: 'product_detail', quantity: 1, price: productPrice } });
      }
      if (sessionIndex % 7 === 0) {
        events.push({ name: 'checkout_started', type: 'commerce', path: '/checkout', productId, metadata: { source: 'cart', revenue: productPrice } });
        events.push({ name: 'order_completed', type: 'commerce', path: '/checkout', productId, metadata: { source: 'demo_order', quantity: 1, revenue: productPrice } });
      }

      for (const event of events) {
        await executor.execute(
          `
            INSERT INTO analytics_events (
              event_name, event_type, session_id, product_id, path, referrer, utm_source,
              device_type, browser, user_agent, ip_hash, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            event.name,
            event.type,
            sessionId,
            event.productId,
            event.path,
            'https://google.com',
            'demo',
            sessionIndex % 3 === 0 ? 'mobile' : 'desktop',
            sessionIndex % 3 === 0 ? 'Safari' : 'Chrome',
            'AkibaCore demo analytics seed',
            `demo-${sessionIndex}`,
            JSON.stringify(event.metadata),
            createdAt,
          ],
        );
        eventCount += 1;
      }
    }
  }

  console.log(`Seeded ${eventCount} demo analytics events.`);
}

try {
  await initializeSchema(executor, { rebuild: false });
  await seedSchema(executor);
  await seedAnalyticsDemoData();

  const [tables] = await pool.query(`
    SELECT TABLE_NAME AS table_name
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('analytics_events', 'analytics_daily_stats', 'analytics_product_stats')
    ORDER BY TABLE_NAME
  `);
  const [counts] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM analytics_events) AS analytics_events
  `);

  console.log(JSON.stringify({ tables, counts }, null, 2));
} finally {
  await pool.end();
}
