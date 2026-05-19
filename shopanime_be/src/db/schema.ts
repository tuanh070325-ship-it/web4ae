import { Logger } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { mockData } from '../../mockData.js';
import type { DatabaseExecutor } from './db.service.js';

const logger = new Logger('DatabaseSchema');

const tables = [
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
}

export async function seedSchema(db: DatabaseExecutor) {
  const productCount = await db.one<RowDataPacket & { total: number }>('SELECT COUNT(*) AS total FROM products');
  if ((productCount?.total || 0) > 0) {
    logger.log('Seed skipped because products already exist.');
    return;
  }

  for (const user of mockData.users) {
    await db.execute(
      `INSERT IGNORE INTO users (id, username, email, password_hash, full_name, phone, avatar_url, status, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.username, user.email, 'dev-password-hash', user.full_name, user.phone, user.avatar_url, user.status, user.id === 1 ? 'ADMIN' : 'CUSTOMER', user.created_at],
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

  for (const order of mockData.orders) {
    await db.execute(
      `INSERT IGNORE INTO orders (
        id, user_id, order_code, receiver_name, shipping_address_line, shipping_city,
        total_amount, final_amount, status, payment_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.user_id <= 2 ? order.user_id : 1,
        order.order_code,
        order.receiver_name,
        order.shipping_address_line,
        order.shipping_city,
        order.total_amount,
        order.total_amount,
        order.status,
        order.payment_status,
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

  for (const review of mockData.reviews) {
    await db.execute(
      'INSERT IGNORE INTO reviews (id, user_id, product_id, order_id, rating, comment, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [review.id, review.user_id, review.product_id, review.order_id, review.rating, review.comment, review.status, review.created_at],
    );
  }

  logger.log('Seed data inserted.');
}
