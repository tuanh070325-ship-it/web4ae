import { Logger } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { mockData } from '../../mockData.js';
import { encodePasswordHash, isPlainScryptPasswordHash } from '../auth/password.js';
import type { DatabaseExecutor } from './db.service.js';

const logger = new Logger('DatabaseSchema');
const MOCK_DATA_SEED_KEY = 'mock_data_v1';
const DEMO_PASSWORD_HASH = 'base64:c2NyeXB0OmIyNTk2MWVhMDNhZDZkMmRlNzU1ZjQ4ZmM0ZmMxNTgzOjk2YTA0ZTEzMDRlNzRjYWIyZDJlZGU2YTIxNDEwYjMwMzM5ZDA4ZmNjZGExOTExM2IxODM5ZWI3MzI0NGNkYzhkOTJhYTdhMmFhNWU4ODBhZmFlZTU3OTY0YWMwZDdmYjA2MGU3ZDAxMzM2ODJkZTA5MGNhZGRlMDA4YmJmYjQ3';

const tables = [
  'app_seed_runs',
  'analytics_product_stats',
  'analytics_daily_stats',
  'analytics_events',
  'post_likes',
  'post_comments',
  'posts',
  'reviews',
  'order_items',
  'orders',
  'wishlists',
  'carts',
  'inventory_transactions',
  'product_categories',
  'products',
  'categories',
  'book_series',
  'publishers',
  'authors',
  'user_addresses',
  'users',
  'banners',
];

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS app_seed_runs (
    seed_key VARCHAR(120) NOT NULL PRIMARY KEY,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(120) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(190) NULL,
    phone VARCHAR(50) NULL,
    avatar_url TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    role VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER',
    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,
    last_login_ip VARCHAR(80) NULL,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    remember_token VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS user_addresses (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    receiver_name VARCHAR(190) NULL,
    receiver_phone VARCHAR(50) NULL,
    address_line TEXT NULL,
    ward VARCHAR(120) NULL,
    district VARCHAR(120) NULL,
    city VARCHAR(120) NULL,
    country VARCHAR(120) NOT NULL DEFAULT 'Vietnam',
    postal_code VARCHAR(30) NULL,
    address_type VARCHAR(30) NOT NULL DEFAULT 'HOME',
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS authors (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    slug VARCHAR(190) NULL,
    bio TEXT NULL,
    avatar_url TEXT NULL,
    country VARCHAR(120) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS publishers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    slug VARCHAR(190) NULL,
    description TEXT NULL,
    logo_url TEXT NULL,
    website VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS book_series (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    slug VARCHAR(190) NULL,
    description TEXT NULL,
    cover_url TEXT NULL,
    total_volumes INT NULL,
    status VARCHAR(30) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    parent_id INT UNSIGNED NULL,
    name VARCHAR(190) NOT NULL,
    slug VARCHAR(190) NULL,
    description TEXT NULL,
    image_url TEXT NULL,
    sort_order INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NULL,
    author_id INT UNSIGNED NULL,
    publisher_id INT UNSIGNED NULL,
    series_id INT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(190) NULL UNIQUE,
    translator VARCHAR(190) NULL,
    isbn VARCHAR(80) NULL UNIQUE,
    book_format VARCHAR(40) NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'vi',
    page_count INT NULL,
    publication_date DATE NULL,
    volume_number INT NULL,
    age_rating VARCHAR(40) NULL,
    weight_gram INT NULL,
    dimensions VARCHAR(120) NULL,
    image_url TEXT NULL,
    description TEXT NULL,
    original_price DECIMAL(12,2) NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(12,2) NULL,
    shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    shipping_final_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    sku VARCHAR(120) NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    sold_count INT NOT NULL DEFAULT 0,
    view_count INT NOT NULL DEFAULT 0,
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    external_rating DECIMAL(3,2) NULL,
    external_rating_count INT NOT NULL DEFAULT 0,
    external_rating_source VARCHAR(80) NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_series FOREIGN KEY (series_id) REFERENCES book_series(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NULL,
    variant_id INT UNSIGNED NULL,
    type VARCHAR(40) NULL,
    quantity INT NULL,
    before_quantity INT NULL,
    after_quantity INT NULL,
    note TEXT NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS product_categories (
    product_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT fk_product_categories_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS carts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_carts_user_product (user_id, product_id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_carts_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS wishlists (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlists_user_product (user_id, product_id),
    CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    order_code VARCHAR(80) NULL UNIQUE,
    receiver_name VARCHAR(190) NULL,
    receiver_phone VARCHAR(50) NULL,
    shipping_address_line TEXT NULL,
    shipping_ward VARCHAR(120) NULL,
    shipping_district VARCHAR(120) NULL,
    shipping_city VARCHAR(120) NULL,
    shipping_address_id INT UNSIGNED NULL,
    coupon_id INT UNSIGNED NULL,
    total_amount DECIMAL(12,2) NULL,
    subtotal_amount DECIMAL(12,2) NULL,
    shipping_fee DECIMAL(12,2) NULL,
    tax_amount DECIMAL(12,2) NULL,
    discount_amount DECIMAL(12,2) NULL,
    final_amount DECIMAL(12,2) NULL,
    shipping_method VARCHAR(80) NULL,
    shipping_provider VARCHAR(120) NULL,
    tracking_code VARCHAR(120) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    payment_status VARCHAR(40) NOT NULL DEFAULT 'UNPAID',
    shipped_at DATETIME NULL,
    delivered_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    cancel_reason TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    product_name VARCHAR(255) NULL,
    product_sku VARCHAR(120) NULL,
    product_image TEXT NULL,
    price DECIMAL(12,2) NULL,
    discount_amount DECIMAL(12,2) NULL,
    final_price DECIMAL(12,2) NULL,
    quantity INT NULL,
    subtotal DECIMAL(12,2) NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(80) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    session_id VARCHAR(80) NOT NULL,
    user_id INT UNSIGNED NULL,
    product_id INT UNSIGNED NULL,
    order_id INT UNSIGNED NULL,
    path VARCHAR(500) NULL,
    referrer VARCHAR(500) NULL,
    utm_source VARCHAR(120) NULL,
    utm_medium VARCHAR(120) NULL,
    utm_campaign VARCHAR(160) NULL,
    device_type VARCHAR(40) NULL,
    browser VARCHAR(80) NULL,
    user_agent TEXT NULL,
    ip_hash VARCHAR(128) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analytics_created_at (created_at),
    INDEX idx_analytics_event_name (event_name),
    INDEX idx_analytics_product_id (product_id),
    INDEX idx_analytics_user_id (user_id),
    INDEX idx_analytics_path (path(191)),
    INDEX idx_analytics_session_id (session_id),
    CONSTRAINT fk_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_analytics_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_analytics_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS analytics_daily_stats (
    date_key DATE NOT NULL PRIMARY KEY,
    pageviews INT NOT NULL DEFAULT 0,
    visitors INT NOT NULL DEFAULT 0,
    product_views INT NOT NULL DEFAULT 0,
    product_clicks INT NOT NULL DEFAULT 0,
    add_to_cart INT NOT NULL DEFAULT 0,
    checkout_starts INT NOT NULL DEFAULT 0,
    orders_completed INT NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS analytics_product_stats (
    product_id INT UNSIGNED NOT NULL PRIMARY KEY,
    impressions INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    detail_views INT NOT NULL DEFAULT 0,
    add_to_cart INT NOT NULL DEFAULT 0,
    purchases INT NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_analytics_product_stats_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED NULL,
    rating INT NULL,
    comment TEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    admin_reply TEXT NULL,
    replied_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reviews_user_product_order (user_id, product_id, order_id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS posts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    content TEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS post_comments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    parent_id INT UNSIGNED NULL,
    content TEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS post_likes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_post_likes_post_user (post_id, user_id),
    CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS banners (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    image_url TEXT NULL,
    link_url TEXT NULL,
    title VARCHAR(255) NULL,
    sort_order INT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

const productColumnMigrations = [
  { column: 'original_price', ddl: 'ADD COLUMN original_price DECIMAL(12,2) NULL AFTER description' },
  { column: 'discount_percent', ddl: 'ADD COLUMN discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER original_price' },
  { column: 'shipping_fee', ddl: 'ADD COLUMN shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER discount_price' },
  { column: 'shipping_discount_percent', ddl: 'ADD COLUMN shipping_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER shipping_fee' },
  { column: 'shipping_final_fee', ddl: 'ADD COLUMN shipping_final_fee DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER shipping_discount_percent' },
  { column: 'external_rating', ddl: 'ADD COLUMN external_rating DECIMAL(3,2) NULL AFTER review_count' },
  { column: 'external_rating_count', ddl: 'ADD COLUMN external_rating_count INT NOT NULL DEFAULT 0 AFTER external_rating' },
  { column: 'external_rating_source', ddl: 'ADD COLUMN external_rating_source VARCHAR(80) NULL AFTER external_rating_count' },
];

const indexDefinitions = [
  { table: 'products', name: 'idx_products_status_created', columns: 'status, created_at' },
  { table: 'products', name: 'idx_products_price', columns: 'price' },
  { table: 'products', name: 'idx_products_category_author', columns: 'category_id, author_id' },
  { table: 'orders', name: 'idx_orders_user_status_created', columns: 'user_id, status, created_at' },
  { table: 'reviews', name: 'idx_reviews_product_status', columns: 'product_id, status, created_at' },
  { table: 'reviews', name: 'idx_reviews_order', columns: 'order_id' },
  { table: 'posts', name: 'idx_posts_user_status_created', columns: 'user_id, status, created_at' },
  { table: 'post_comments', name: 'idx_post_comments_post_parent', columns: 'post_id, parent_id' },
  { table: 'post_likes', name: 'idx_post_likes_user_created', columns: 'user_id, created_at' },
  { table: 'inventory_transactions', name: 'idx_inventory_product_created', columns: 'product_id, created_at' },
];

const foreignKeyDefinitions = [
  {
    name: 'fk_orders_shipping_address',
    cleanup: `
      UPDATE orders o
      LEFT JOIN user_addresses ua ON o.shipping_address_id = ua.id
      SET o.shipping_address_id = NULL
      WHERE o.shipping_address_id IS NOT NULL AND ua.id IS NULL
    `,
    ddl: `
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_shipping_address
      FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL
    `,
  },
  {
    name: 'fk_reviews_order',
    cleanup: `
      UPDATE reviews r
      LEFT JOIN orders o ON r.order_id = o.id
      SET r.order_id = NULL
      WHERE r.order_id IS NOT NULL AND o.id IS NULL
    `,
    ddl: `
      ALTER TABLE reviews
      ADD CONSTRAINT fk_reviews_order
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    `,
  },
  {
    name: 'fk_post_comments_parent',
    cleanup: `
      UPDATE post_comments pc
      LEFT JOIN post_comments parent ON pc.parent_id = parent.id
      SET pc.parent_id = NULL
      WHERE pc.parent_id IS NOT NULL AND parent.id IS NULL
    `,
    ddl: `
      ALTER TABLE post_comments
      ADD CONSTRAINT fk_post_comments_parent
      FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE
    `,
  },
];

async function ensureProductColumns(db: DatabaseExecutor) {
  for (const migration of productColumnMigrations) {
    const existing = await db.one<RowDataPacket & { total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'products'
          AND COLUMN_NAME = ?
      `,
      [migration.column],
    );

    if (!existing?.total) {
      await db.execute(`ALTER TABLE products ${migration.ddl}`);
      logger.log(`Added products.${migration.column}`);
    }
  }

  await db.execute(`
    UPDATE products
    SET original_price = price
    WHERE original_price IS NULL OR original_price <= 0
  `);

  await db.execute(`
    UPDATE products
    SET discount_percent = CASE
      WHEN discount_price IS NOT NULL
        AND discount_price > 0
        AND discount_price < original_price
      THEN ROUND(((original_price - discount_price) / original_price) * 100, 2)
      ELSE COALESCE(discount_percent, 0)
    END
  `);

  await db.execute(`
    UPDATE products
    SET price = ROUND(original_price * (1 - COALESCE(discount_percent, 0) / 100), 2),
        discount_price = CASE
          WHEN COALESCE(discount_percent, 0) > 0
          THEN ROUND(original_price * (1 - COALESCE(discount_percent, 0) / 100), 2)
          ELSE NULL
        END
    WHERE original_price IS NOT NULL AND original_price > 0
  `);

  await db.execute(`
    UPDATE products
    SET shipping_discount_percent = LEAST(GREATEST(COALESCE(shipping_discount_percent, 0), 0), 100),
        shipping_fee = GREATEST(COALESCE(shipping_fee, 0), 0)
  `);

  await db.execute(`
    UPDATE products
    SET shipping_final_fee = ROUND(shipping_fee * (1 - COALESCE(shipping_discount_percent, 0) / 100), 2)
  `);
}

async function ensureIndexes(db: DatabaseExecutor) {
  for (const index of indexDefinitions) {
    const existing = await db.one<RowDataPacket & { total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
      `,
      [index.table, index.name],
    );

    if (!existing?.total) {
      await db.execute(`ALTER TABLE ${index.table} ADD INDEX ${index.name} (${index.columns})`);
      logger.log(`Added index ${index.table}.${index.name}`);
    }
  }
}

async function ensureForeignKeys(db: DatabaseExecutor) {
  for (const foreignKey of foreignKeyDefinitions) {
    const existing = await db.one<RowDataPacket & { total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
          AND CONSTRAINT_NAME = ?
      `,
      [foreignKey.name],
    );

    if (existing?.total) {
      continue;
    }

    await db.execute(foreignKey.cleanup);
    await db.execute(foreignKey.ddl);
    logger.log(`Added foreign key ${foreignKey.name}`);
  }
}

async function ensureBase64PasswordHashes(db: DatabaseExecutor) {
  const legacySeedResult = await db.execute(
    'UPDATE users SET password_hash = ? WHERE password_hash = ?',
    [DEMO_PASSWORD_HASH, 'dev-password-hash'],
  );
  const users = await db.query<RowDataPacket & { id: number; password_hash: string }>(
    `
      SELECT id, password_hash
      FROM users
      WHERE password_hash LIKE 'scrypt:%'
    `,
  );

  for (const user of users) {
    if (!isPlainScryptPasswordHash(user.password_hash)) {
      continue;
    }

    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [encodePasswordHash(user.password_hash), user.id],
    );
  }

  const migratedCount = legacySeedResult.affectedRows + users.length;
  if (migratedCount > 0) {
    logger.log(`Migrated ${migratedCount} password hashes to base64-wrapped scrypt format.`);
  }
}

async function normalizeUserRoles(db: DatabaseExecutor) {
  const result = await db.execute(
    "UPDATE users SET role = 'CUSTOMER' WHERE role NOT IN ('ADMIN', 'CUSTOMER')",
  );

  if (result.affectedRows > 0) {
    logger.log(`Normalized ${result.affectedRows} unsupported user roles to CUSTOMER.`);
  }
}

async function hasSeedRun(db: DatabaseExecutor, seedKey: string) {
  const existing = await db.one<RowDataPacket & { seed_key: string }>(
    'SELECT seed_key FROM app_seed_runs WHERE seed_key = ?',
    [seedKey],
  );
  return Boolean(existing);
}

async function recordSeedRun(db: DatabaseExecutor, seedKey: string) {
  await db.execute('INSERT IGNORE INTO app_seed_runs (seed_key) VALUES (?)', [seedKey]);
}

export async function initializeSchema(db: DatabaseExecutor, options: { rebuild: boolean }) {
  if (options.rebuild) {
    logger.warn('DB_REBUILD_SCHEMA is enabled. Dropping and recreating application tables.');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) {
      await db.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
  }

  for (const statement of schemaStatements) {
    await db.execute(statement);
  }

  await ensureProductColumns(db);
  await ensureForeignKeys(db);
  await ensureIndexes(db);
  await ensureBase64PasswordHashes(db);
  await normalizeUserRoles(db);
}

export async function seedSchema(db: DatabaseExecutor) {
  if (await hasSeedRun(db, MOCK_DATA_SEED_KEY)) {
    logger.log(`Mock data seed skipped because ${MOCK_DATA_SEED_KEY} already ran.`);
    return;
  }

  const productCount = await db.one<RowDataPacket & { total: number }>('SELECT COUNT(*) AS total FROM products');
  if ((productCount?.total || 0) > 0) {
    await recordSeedRun(db, MOCK_DATA_SEED_KEY);
    logger.log('Mock data seed skipped because products already exist. Seed marker recorded.');
    return;
  }

  for (const user of mockData.users) {
    await db.execute(
      `INSERT IGNORE INTO users (id, username, email, password_hash, full_name, phone, avatar_url, status, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.username, user.email, user.password_hash, user.full_name, user.phone, user.avatar_url, user.status, user.role, user.created_at],
    );
  }

  for (const address of mockData.user_addresses) {
    await db.execute(
      `
        INSERT IGNORE INTO user_addresses (
          id, user_id, receiver_name, receiver_phone, address_line, ward, district,
          city, country, postal_code, address_type, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        address.id,
        address.user_id,
        address.receiver_name,
        address.receiver_phone,
        address.address_line,
        address.ward,
        address.district,
        address.city,
        address.country,
        address.postal_code,
        address.address_type,
        address.is_default ? 1 : 0,
        address.created_at,
        address.updated_at,
      ],
    );
  }

  for (const author of mockData.authors) {
    await db.execute('INSERT IGNORE INTO authors (id, name, slug, bio, country) VALUES (?, ?, ?, ?, ?)', [
      author.id,
      author.name,
      author.slug,
      author.bio,
      author.country,
    ]);
  }

  for (const publisher of mockData.publishers) {
    await db.execute('INSERT IGNORE INTO publishers (id, name, slug, description, website) VALUES (?, ?, ?, ?, ?)', [
      publisher.id,
      publisher.name,
      publisher.slug,
      publisher.description,
      publisher.website,
    ]);
  }

  for (const series of mockData.book_series) {
    await db.execute('INSERT IGNORE INTO book_series (id, name, slug, status, total_volumes) VALUES (?, ?, ?, ?, ?)', [
      series.id,
      series.name,
      series.slug,
      series.status,
      series.total_volumes,
    ]);
  }

  for (const category of mockData.categories) {
    await db.execute('INSERT IGNORE INTO categories (id, parent_id, name, slug, status) VALUES (?, ?, ?, ?, ?)', [
      category.id,
      category.parent_id,
      category.name,
      category.slug,
      category.status,
    ]);
  }

  for (const product of mockData.products) {
    const originalPrice = Number(product.price);
    const discountPrice = product.discount_price === null || product.discount_price === undefined
      ? null
      : Number(product.discount_price);
    const discountPercent = discountPrice !== null && discountPrice > 0 && discountPrice < originalPrice
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 10000) / 100
      : 0;
    const finalPrice = discountPercent > 0
      ? Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100
      : originalPrice;

    await db.execute(
      `INSERT IGNORE INTO products (
        id, category_id, author_id, publisher_id, series_id, name, slug, isbn, book_format,
        original_price, discount_percent, price, discount_price, shipping_fee, shipping_discount_percent, shipping_final_fee,
        stock_quantity, status, image_url, description, volume_number, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.category_id,
        product.author_id,
        product.publisher_id,
        product.series_id,
        product.name,
        product.slug,
        product.isbn,
        product.book_format,
        originalPrice,
        discountPercent,
        finalPrice,
        discountPercent > 0 ? finalPrice : null,
        product.shipping_fee ?? 0,
        product.shipping_discount_percent ?? 0,
        Math.round(Number(product.shipping_fee ?? 0) * (1 - Number(product.shipping_discount_percent ?? 0) / 100) * 100) / 100,
        product.stock_quantity,
        product.status,
        product.image,
        product.description,
        product.volume_number,
        product.created_at,
      ],
    );
  }

  for (const productCategory of mockData.product_categories) {
    await db.execute(
      'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
      [productCategory.product_id, productCategory.category_id],
    );
  }

  for (const transaction of mockData.inventory_transactions) {
    await db.execute(
      `
        INSERT IGNORE INTO inventory_transactions (
          id, product_id, variant_id, type, quantity, before_quantity, after_quantity,
          note, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        transaction.id,
        transaction.product_id,
        transaction.variant_id,
        transaction.type,
        transaction.quantity,
        transaction.before_quantity,
        transaction.after_quantity,
        transaction.note,
        transaction.created_by,
        transaction.created_at,
      ],
    );
  }

  for (const cart of mockData.carts) {
    await db.execute(
      'INSERT IGNORE INTO carts (id, user_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [cart.id, cart.user_id, cart.product_id, cart.quantity, cart.created_at, cart.updated_at],
    );
  }

  for (const wishlist of mockData.wishlists) {
    await db.execute(
      'INSERT IGNORE INTO wishlists (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)',
      [wishlist.id, wishlist.user_id, wishlist.product_id, wishlist.created_at],
    );
  }

  for (const order of mockData.orders) {
    await db.execute(
      `INSERT IGNORE INTO orders (
        id, user_id, order_code, receiver_name, shipping_address_line, shipping_city,
        shipping_address_id, subtotal_amount, shipping_fee, total_amount, final_amount,
        status, payment_status, shipping_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.user_id,
        order.order_code,
        order.receiver_name,
        order.shipping_address_line,
        order.shipping_city,
        order.shipping_address_id,
        order.subtotal_amount,
        order.shipping_fee,
        order.total_amount,
        order.final_amount,
        order.status,
        order.payment_status,
        order.shipping_method,
        order.created_at,
      ],
    );
  }

  for (const item of mockData.order_items) {
    await db.execute(
      `INSERT IGNORE INTO order_items (id, order_id, product_id, product_name, price, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.order_id, item.product_id, item.product_name, item.price, item.quantity, item.subtotal],
    );
  }

  for (const post of mockData.posts) {
    await db.execute('INSERT IGNORE INTO posts (id, user_id, content, status, like_count, comment_count) VALUES (?, ?, ?, ?, ?, ?)', [
      post.id,
      post.user_id,
      post.content,
      post.status,
      post.like_count,
      post.comment_count,
    ]);
  }

  for (const comment of mockData.post_comments) {
    await db.execute(
      `
        INSERT IGNORE INTO post_comments (id, post_id, user_id, parent_id, content, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [comment.id, comment.post_id, comment.user_id, comment.parent_id, comment.content, comment.status, comment.created_at],
    );
  }

  for (const review of mockData.reviews) {
    await db.execute(
      'INSERT IGNORE INTO reviews (id, user_id, product_id, order_id, rating, comment, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [review.id, review.user_id, review.product_id, review.order_id, review.rating, review.comment, review.status, review.created_at],
    );
  }

  for (const banner of mockData.banners) {
    await db.execute(
      'INSERT IGNORE INTO banners (id, image_url, link_url, title, sort_order, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [banner.id, banner.image_url, banner.link_url, banner.title, banner.sort_order, banner.status, banner.created_at],
    );
  }

  await db.execute(`
    UPDATE products p
    LEFT JOIN (
      SELECT product_id, AVG(rating) AS average_rating, COUNT(*) AS review_count
      FROM reviews
      WHERE status = 'APPROVED'
      GROUP BY product_id
    ) rs ON rs.product_id = p.id
    SET p.average_rating = COALESCE(rs.average_rating, 0),
        p.review_count = COALESCE(rs.review_count, 0)
  `);

  await recordSeedRun(db, MOCK_DATA_SEED_KEY);
  logger.log('Seed data inserted.');
}
