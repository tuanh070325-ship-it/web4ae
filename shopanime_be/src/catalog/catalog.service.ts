import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DbService } from '../db/db.service.js';

interface ProductInput {
  name?: unknown;
  slug?: unknown;
  author_id?: unknown;
  category_id?: unknown;
  publisher_id?: unknown;
  original_price?: unknown;
  discount_percent?: unknown;
  price?: unknown;
  discount_price?: unknown;
  image_url?: unknown;
  description?: unknown;
  stock_quantity?: unknown;
  status?: unknown;
}

type ProductSort = 'popularity' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

interface ProductFilters {
  search?: string;
  category?: string;
  genres?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  seriesStatus?: string;
  sort?: ProductSort;
  page: number;
  limit: number;
}

function nullableString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new BadRequestException('Invalid numeric value');
  }
  return numberValue;
}

function optionalNumber(value: unknown) {
  if (value === undefined) return undefined;
  return nullableNumber(value);
}

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function queryList(value: string | string[] | undefined) {
  const rawValues = Array.isArray(value) ? value : [value];
  return rawValues
    .flatMap((item) => String(item || '').split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalQueryNumber(value: string | string[] | undefined, fieldName: string) {
  const rawValue = queryValue(value);
  if (rawValue === undefined || rawValue === '') return undefined;
  const numberValue = Number(rawValue);
  if (!Number.isFinite(numberValue)) {
    throw new BadRequestException(`Invalid ${fieldName}`);
  }
  return numberValue;
}

function productFilters(query: Record<string, string | string[] | undefined>): ProductFilters {
  const sortValue = queryValue(query.sort);
  const sort = sortValue && ['popularity', 'newest', 'price_asc', 'price_desc', 'rating'].includes(sortValue)
    ? sortValue as ProductSort
    : undefined;
  const minPrice = optionalQueryNumber(query.minPrice, 'minPrice');
  const maxPrice = optionalQueryNumber(query.maxPrice, 'maxPrice');
  const minRating = optionalQueryNumber(query.minRating, 'minRating');
  const page = Math.max(1, Math.floor(optionalQueryNumber(query.page, 'page') ?? 1));
  const limit = Math.min(60, Math.max(1, Math.floor(optionalQueryNumber(query.limit, 'limit') ?? 20)));

  if (minPrice !== undefined && minPrice < 0) {
    throw new BadRequestException('minPrice cannot be negative');
  }
  if (maxPrice !== undefined && maxPrice < 0) {
    throw new BadRequestException('maxPrice cannot be negative');
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new BadRequestException('maxPrice must be greater than minPrice');
  }
  if (minRating !== undefined && (minRating < 1 || minRating > 5)) {
    throw new BadRequestException('minRating must be between 1 and 5');
  }

  return {
    search: nullableString(queryValue(query.search)) || undefined,
    category: nullableString(queryValue(query.category)) || undefined,
    genres: queryList(query.genres),
    minPrice,
    maxPrice,
    minRating,
    seriesStatus: nullableString(queryValue(query.seriesStatus))?.toUpperCase() || undefined,
    sort,
    page,
    limit,
  };
}

function productStatus(value: unknown) {
  const status = typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : 'ACTIVE';
  if (!['ACTIVE', 'INACTIVE', 'DRAFT', 'OUT_OF_STOCK'].includes(status)) {
    throw new BadRequestException('Invalid product status');
  }
  return status;
}

function hasField(body: ProductInput, field: keyof ProductInput) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validatePricing(originalPrice: number, discountPercent: number) {
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    throw new BadRequestException('Original price must be greater than 0');
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 95) {
    throw new BadRequestException('Discount percent must be between 0 and 95');
  }
}

function deriveDiscountPercent(originalPrice: number, discountPrice: number | null) {
  if (discountPrice === null || discountPrice <= 0 || discountPrice >= originalPrice) {
    return 0;
  }
  return roundCurrency(((originalPrice - discountPrice) / originalPrice) * 100);
}

function buildPricing(originalPrice: number, discountPercent: number) {
  validatePricing(originalPrice, discountPercent);
  const finalPrice = roundCurrency(originalPrice * (1 - discountPercent / 100));
  return {
    originalPrice: roundCurrency(originalPrice),
    discountPercent: roundCurrency(discountPercent),
    finalPrice,
    discountPrice: discountPercent > 0 ? finalPrice : null,
  };
}

function createPricing(body: ProductInput) {
  const originalPrice = nullableNumber(body.original_price) ?? nullableNumber(body.price);
  if (originalPrice === null) {
    throw new BadRequestException('Original price is required');
  }

  const discountPercentInput = nullableNumber(body.discount_percent);
  const discountPercent = discountPercentInput ?? deriveDiscountPercent(originalPrice, nullableNumber(body.discount_price));
  return buildPricing(originalPrice, discountPercent);
}

@Injectable()
export class CatalogService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  async getProducts(query: Record<string, string | string[] | undefined> = {}) {
    const filters = productFilters(query);
    const conditions = ['p.status = ?'];
    const params: Array<string | number> = ['ACTIVE'];
    const effectivePrice = 'p.price';

    if (filters.search) {
      const searchValue = `%${filters.search}%`;
      conditions.push(`(
        p.name LIKE ?
        OR p.slug LIKE ?
        OR p.description LIKE ?
        OR a.name LIKE ?
        OR c.name LIKE ?
        OR bs.name LIKE ?
      )`);
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    if (filters.category) {
      const categoryId = Number(filters.category);
      if (Number.isInteger(categoryId)) {
        conditions.push('(p.category_id = ? OR EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = ?))');
        params.push(categoryId, categoryId);
      } else {
        conditions.push(`(
          LOWER(c.slug) = LOWER(?)
          OR LOWER(c.name) = LOWER(?)
          OR EXISTS (
            SELECT 1
            FROM product_categories pc
            JOIN categories gc ON pc.category_id = gc.id
            WHERE pc.product_id = p.id
              AND (LOWER(gc.slug) = LOWER(?) OR LOWER(gc.name) = LOWER(?))
          )
        )`);
        params.push(filters.category, filters.category, filters.category, filters.category);
      }
    }

    if (filters.genres && filters.genres.length > 0) {
      const placeholders = filters.genres.map(() => '?').join(', ');
      conditions.push(`(
        LOWER(c.slug) IN (${placeholders})
        OR EXISTS (
          SELECT 1
          FROM product_categories pc
          JOIN categories gc ON pc.category_id = gc.id
          WHERE pc.product_id = p.id AND LOWER(gc.slug) IN (${placeholders})
        )
      )`);
      const genreSlugs = filters.genres.map((genre) => genre.toLowerCase().replace(/\s+/g, '-'));
      params.push(...genreSlugs, ...genreSlugs);
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`${effectivePrice} >= ?`);
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`${effectivePrice} <= ?`);
      params.push(filters.maxPrice);
    }

    if (filters.minRating !== undefined) {
      conditions.push('COALESCE(rs.average_rating, 0) >= ?');
      params.push(filters.minRating);
    }

    if (filters.seriesStatus) {
      conditions.push('bs.status = ?');
      params.push(filters.seriesStatus);
    }

    const orderBy: Record<ProductSort, string> = {
      popularity: 'p.sold_count DESC, p.view_count DESC, p.created_at DESC, p.id DESC',
      newest: 'p.created_at DESC, p.id DESC',
      price_asc: `${effectivePrice} ASC, p.created_at DESC, p.id DESC`,
      price_desc: `${effectivePrice} DESC, p.created_at DESC, p.id DESC`,
      rating: 'COALESCE(rs.average_rating, 0) DESC, COALESCE(rs.review_count, 0) DESC, p.created_at DESC, p.id DESC',
    };

    const fromClause = `
      FROM products p
      LEFT JOIN authors a ON p.author_id = a.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN publishers pub ON p.publisher_id = pub.id
      LEFT JOIN book_series bs ON p.series_id = bs.id
      LEFT JOIN (
        SELECT product_id, AVG(rating) AS average_rating, COUNT(*) AS review_count
        FROM reviews
        GROUP BY product_id
      ) rs ON rs.product_id = p.id
      WHERE ${conditions.join(' AND ')}
    `;
    const countRow = await this.db.one<{ total: number } & RowDataPacket>(
      `SELECT COUNT(DISTINCT p.id) AS total ${fromClause}`,
      params,
    );
    const total = Number(countRow?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));
    const page = Math.min(filters.page, totalPages);
    const offset = (page - 1) * filters.limit;
    const products = await this.db.query(`
      SELECT
        p.*,
        p.image_url AS image,
        a.name AS author,
        a.name AS author_name,
        c.name AS category_name,
        c.slug AS category_slug,
        pub.name AS publisher_name,
        bs.name AS series_name,
        bs.slug AS series_slug,
        bs.status AS series_status,
        COALESCE(rs.average_rating, 0) AS average_rating,
        COALESCE(rs.review_count, 0) AS review_count,
        GREATEST(COALESCE(p.original_price, p.price) - p.price, 0) AS discount_amount,
        CASE WHEN COALESCE(p.discount_percent, 0) > 0 THEN 1 ELSE 0 END AS has_discount
      ${fromClause}
      ORDER BY ${orderBy[filters.sort || 'popularity']}
      LIMIT ? OFFSET ?
    `, [...params, filters.limit, offset]);

    return {
      data: products,
      meta: {
        page,
        limit: filters.limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getProduct(slug: string) {
    const identifier = nullableString(slug);
    if (!identifier) {
      throw new NotFoundException('Product not found');
    }

    const numericId = Number(identifier);
    const isNumericId = Number.isInteger(numericId);
    const product = await this.db.one(
      `
        SELECT
          p.*,
          p.image_url AS image,
          a.name AS author,
          a.name AS author_name,
          c.name AS category_name,
          c.slug AS category_slug,
          pub.name AS publisher_name,
          bs.name AS series_name,
          bs.slug AS series_slug,
          bs.status AS series_status,
          COALESCE(rs.average_rating, 0) AS average_rating,
          COALESCE(rs.review_count, 0) AS review_count,
          GREATEST(COALESCE(p.original_price, p.price) - p.price, 0) AS discount_amount,
          CASE WHEN COALESCE(p.discount_percent, 0) > 0 THEN 1 ELSE 0 END AS has_discount
        FROM products p
        LEFT JOIN authors a ON p.author_id = a.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN publishers pub ON p.publisher_id = pub.id
        LEFT JOIN book_series bs ON p.series_id = bs.id
        LEFT JOIN (
          SELECT product_id, AVG(rating) AS average_rating, COUNT(*) AS review_count
          FROM reviews
          GROUP BY product_id
        ) rs ON rs.product_id = p.id
        WHERE p.slug = ?${isNumericId ? ' OR p.id = ?' : ''}
      `,
      isNumericId ? [identifier, numericId] : [identifier],
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(body: ProductInput) {
    const name = nullableString(body.name);
    const slug = nullableString(body.slug);
    const pricing = createPricing(body);
    const stockQuantity = nullableNumber(body.stock_quantity) ?? 0;

    if (!name) {
      throw new BadRequestException('Product name is required');
    }

    if (stockQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    const result = await this.db.execute(
      `
        INSERT INTO products (
          name, slug, author_id, category_id, publisher_id, original_price, discount_percent, price, discount_price,
          image_url, description, stock_quantity, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        slug,
        nullableNumber(body.author_id),
        nullableNumber(body.category_id),
        nullableNumber(body.publisher_id),
        pricing.originalPrice,
        pricing.discountPercent,
        pricing.finalPrice,
        pricing.discountPrice,
        nullableString(body.image_url),
        nullableString(body.description),
        stockQuantity,
        productStatus(body.status),
      ],
    );

    return result.insertId;
  }

  async updateProduct(id: string, body: ProductInput) {
    const name = body.name === undefined ? undefined : nullableString(body.name);
    const slug = body.slug === undefined ? undefined : nullableString(body.slug);
    const stockQuantity = optionalNumber(body.stock_quantity);
    const status = body.status === undefined ? undefined : productStatus(body.status);
    const imageUrl = body.image_url === undefined ? undefined : nullableString(body.image_url);
    const description = body.description === undefined ? undefined : nullableString(body.description);
    const categoryId = optionalNumber(body.category_id);
    const authorId = optionalNumber(body.author_id);
    const hasPricingChange = hasField(body, 'original_price')
      || hasField(body, 'discount_percent')
      || hasField(body, 'price')
      || hasField(body, 'discount_price');

    if (body.name !== undefined && !name) {
      throw new BadRequestException('Product name cannot be empty');
    }

    if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    let pricing: ReturnType<typeof buildPricing> | null = null;
    if (hasPricingChange) {
      const existing = await this.db.one<RowDataPacket & {
        original_price: number | string | null;
        discount_percent: number | string | null;
        price: number | string;
        discount_price: number | string | null;
      }>('SELECT original_price, discount_percent, price, discount_price FROM products WHERE id = ?', [id]);

      if (!existing) {
        throw new NotFoundException('Product not found');
      }

      const currentOriginal = nullableNumber(existing.original_price) ?? nullableNumber(existing.price) ?? 0;
      const originalPrice = hasField(body, 'original_price')
        ? nullableNumber(body.original_price)
        : hasField(body, 'price')
          ? nullableNumber(body.price)
          : currentOriginal;

      if (originalPrice === null) {
        throw new BadRequestException('Original price is required');
      }

      const discountPercent = hasField(body, 'discount_percent')
        ? nullableNumber(body.discount_percent) ?? 0
        : hasField(body, 'discount_price')
          ? deriveDiscountPercent(originalPrice, nullableNumber(body.discount_price))
          : nullableNumber(existing.discount_percent) ?? 0;

      pricing = buildPricing(originalPrice, discountPercent);
    }

    const updates: string[] = [];
    const params: Array<string | number | null> = [];
    const pushUpdate = (sql: string, value: string | number | null | undefined) => {
      if (value === undefined) return;
      updates.push(sql);
      params.push(value);
    };

    pushUpdate('name = ?', name);
    pushUpdate('slug = ?', slug);
    pushUpdate('stock_quantity = ?', stockQuantity);
    if (pricing) {
      pushUpdate('original_price = ?', pricing.originalPrice);
      pushUpdate('discount_percent = ?', pricing.discountPercent);
      pushUpdate('price = ?', pricing.finalPrice);
      pushUpdate('discount_price = ?', pricing.discountPrice);
    }
    pushUpdate('status = ?', status);
    pushUpdate('image_url = ?', imageUrl);
    pushUpdate('description = ?', description);
    pushUpdate('category_id = ?', categoryId);
    pushUpdate('author_id = ?', authorId);

    if (updates.length === 0) {
      return;
    }
    params.push(id);

    const result = await this.db.execute(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params,
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Product not found');
    }
  }

  async deleteProduct(id: string) {
    const result = await this.db.execute('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('Product not found');
    }
  }

  getCategories() {
    return this.db.query('SELECT * FROM categories ORDER BY sort_order IS NULL, sort_order, name');
  }

  async createCategory(body: any) {
    const name = nullableString(body.name);
    if (!name) {
      throw new BadRequestException('Category name is required');
    }
    const result = await this.db.execute('INSERT INTO categories (name, slug, parent_id, description) VALUES (?, ?, ?, ?)', [
      name,
      nullableString(body.slug),
      nullableNumber(body.parent_id),
      nullableString(body.description),
    ]);
    return result.insertId;
  }

  async updateCategory(id: string, body: any) {
    const name = body.name === undefined ? undefined : nullableString(body.name);
    if (body.name !== undefined && !name) {
      throw new BadRequestException('Category name cannot be empty');
    }
    const result = await this.db.execute(
      `
        UPDATE categories
        SET name = COALESCE(?, name),
            slug = COALESCE(?, slug),
            parent_id = COALESCE(?, parent_id),
            description = COALESCE(?, description),
            status = COALESCE(?, status)
        WHERE id = ?
      `,
      [
        name ?? null,
        body.slug === undefined ? null : nullableString(body.slug),
        optionalNumber(body.parent_id) ?? null,
        body.description === undefined ? null : nullableString(body.description),
        body.status === undefined ? null : nullableString(body.status),
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Category not found');
    }
  }

  async deleteCategory(id: string) {
    const result = await this.db.execute('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('Category not found');
    }
  }

  getAuthors() {
    return this.db.query('SELECT * FROM authors ORDER BY name');
  }

  async createAuthor(body: any) {
    const name = nullableString(body.name);
    if (!name) {
      throw new BadRequestException('Author name is required');
    }
    const result = await this.db.execute('INSERT INTO authors (name, slug, bio, avatar_url, country) VALUES (?, ?, ?, ?, ?)', [
      name,
      nullableString(body.slug),
      nullableString(body.bio),
      nullableString(body.avatar_url),
      nullableString(body.country),
    ]);
    return result.insertId;
  }

  async updateAuthor(id: string, body: any) {
    const name = body.name === undefined ? undefined : nullableString(body.name);
    if (body.name !== undefined && !name) {
      throw new BadRequestException('Author name cannot be empty');
    }
    const result = await this.db.execute(
      `
        UPDATE authors
        SET name = COALESCE(?, name),
            slug = COALESCE(?, slug),
            bio = COALESCE(?, bio),
            avatar_url = COALESCE(?, avatar_url),
            country = COALESCE(?, country)
        WHERE id = ?
      `,
      [
        name ?? null,
        body.slug === undefined ? null : nullableString(body.slug),
        body.bio === undefined ? null : nullableString(body.bio),
        body.avatar_url === undefined ? null : nullableString(body.avatar_url),
        body.country === undefined ? null : nullableString(body.country),
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Author not found');
    }
  }

  async deleteAuthor(id: string) {
    const result = await this.db.execute('DELETE FROM authors WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('Author not found');
    }
  }
}
