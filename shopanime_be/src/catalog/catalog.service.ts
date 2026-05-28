import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DbService, type DatabaseExecutor } from '../db/db.service.js';

interface ProductInput {
  name?: unknown;
  slug?: unknown;
  author_id?: unknown;
  category_id?: unknown;
  category_ids?: unknown;
  publisher_id?: unknown;
  series_id?: unknown;
  original_price?: unknown;
  discount_percent?: unknown;
  price?: unknown;
  discount_price?: unknown;
  shipping_fee?: unknown;
  shipping_discount_percent?: unknown;
  shipping_final_fee?: unknown;
  image_url?: unknown;
  description?: unknown;
  stock_quantity?: unknown;
  status?: unknown;
}

interface CategoryInput {
  name?: unknown;
  parent_id?: unknown;
  description?: unknown;
  status?: unknown;
}

interface AuthorInput {
  name?: unknown;
  slug?: unknown;
  bio?: unknown;
  avatar_url?: unknown;
  country?: unknown;
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
  status?: string;
  sort?: ProductSort;
  page: number;
  limit: number;
}

function nullableString(value: unknown) {
  if (typeof value !== 'string') {return null;}
  const trimmed = value.trim();
  return trimmed || null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {return null;}
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new BadRequestException('Invalid numeric value');
  }
  return numberValue;
}

function optionalNumber(value: unknown) {
  if (value === undefined) {return undefined;}
  return nullableNumber(value);
}

function nullableId(value: unknown, fieldName: string) {
  const numberValue = nullableNumber(value);
  if (numberValue === null) {
    return null;
  }
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }
  return numberValue;
}

function optionalId(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }
  return nullableId(value, fieldName);
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
  if (rawValue === undefined || rawValue === '') {return undefined;}
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
    status: nullableString(queryValue(query.status))?.toUpperCase() || undefined,
    sort,
    page,
    limit,
  };
}

function categoryIds(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [value];

  const ids = rawValues
    .map((item) => nullableId(item, 'category_ids'))
    .filter((id): id is number => id !== null);

  return [...new Set(ids)];
}

function slugBase(value: unknown, fallback: string) {
  const source = nullableString(value) || fallback;
  const slug = source
    .toLowerCase()
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || fallback;
}

function slugWithSuffix(base: string, suffix: number | null, maxLength = 190) {
  if (suffix === null) {
    return base.slice(0, maxLength).replace(/-+$/g, '') || 'item';
  }

  const suffixText = `-${suffix}`;
  return `${base.slice(0, maxLength - suffixText.length).replace(/-+$/g, '')}${suffixText}`;
}

function productStatus(value: unknown) {
  const status = typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : 'ACTIVE';
  if (!['ACTIVE', 'INACTIVE', 'DRAFT', 'OUT_OF_STOCK'].includes(status)) {
    throw new BadRequestException('Invalid product status');
  }
  return status;
}

function categoryStatus(value: unknown) {
  const status = typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : 'ACTIVE';
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new BadRequestException('Invalid category status');
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

function validateShipping(shippingFee: number, shippingDiscountPercent: number) {
  if (!Number.isFinite(shippingFee) || shippingFee < 0) {
    throw new BadRequestException('Shipping fee cannot be negative');
  }
  if (!Number.isFinite(shippingDiscountPercent) || shippingDiscountPercent < 0 || shippingDiscountPercent > 100) {
    throw new BadRequestException('Shipping discount percent must be between 0 and 100');
  }
}

function deriveDiscountPercent(originalPrice: number, discountPrice: number | null) {
  if (discountPrice === null || discountPrice <= 0 || discountPrice >= originalPrice) {
    return 0;
  }
  return roundCurrency(((originalPrice - discountPrice) / originalPrice) * 100);
}

function buildShipping(shippingFee: number, shippingDiscountPercent: number) {
  validateShipping(shippingFee, shippingDiscountPercent);
  return {
    shippingFee: roundCurrency(shippingFee),
    shippingDiscountPercent: roundCurrency(shippingDiscountPercent),
    shippingFinalFee: roundCurrency(shippingFee * (1 - shippingDiscountPercent / 100)),
  };
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

function createShipping(body: ProductInput) {
  return buildShipping(nullableNumber(body.shipping_fee) ?? 0, nullableNumber(body.shipping_discount_percent) ?? 0);
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

function isLegacyInlineImage(value: unknown) {
  return typeof value === 'string' && value.trim().toLowerCase().startsWith('data:image/');
}

function productWithPublicImage<T extends Record<string, any>>(product: T): T {
  if (!isLegacyInlineImage(product.image_url) && !isLegacyInlineImage(product.image)) {
    return product;
  }
  return { ...product, image_url: null, image: null };
}

function productImageUrl(value: unknown) {
  const imageUrl = nullableString(value);
  if (isLegacyInlineImage(imageUrl)) {
    throw new BadRequestException('Inline base64 images are not supported. Upload the image file and store the returned URL.');
  }
  return imageUrl;
}

@Injectable()
export class CatalogService {
  constructor(@Inject(DbService) private readonly db: DbService) {}


  private async uniqueSlug(table: 'products' | 'categories' | 'authors', name: string, fallback: string, excludeId?: number | null) {
    const base = slugBase(name, fallback);
    for (let index = 0; index < 500; index += 1) {
      const suffix = index === 0 ? null : index + 1;
      const candidate = slugWithSuffix(base, suffix);
      const existing = await this.db.one(
        `SELECT id FROM ${table} WHERE slug = ?${excludeId ? ' AND id <> ?' : ''} LIMIT 1`,
        excludeId ? [candidate, excludeId] : [candidate],
      );
      if (!existing) {
        return candidate;
      }
    }

    return slugWithSuffix(base, Date.now());
  }

  private async assertReference(
    table: 'authors' | 'book_series' | 'categories' | 'publishers',
    id: number | null | undefined,
    fieldName: string,
  ) {
    if (id === null || id === undefined) {
      return;
    }

    const existing = await this.db.one(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    if (!existing) {
      throw new BadRequestException(`${fieldName} does not exist`);
    }
  }

  private async assertCategoryIds(ids: number[]) {
    if (ids.length === 0) {
      return;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await this.db.query<RowDataPacket & { id: number }>(`SELECT id FROM categories WHERE id IN (${placeholders})`, ids);
    if (rows.length !== ids.length) {
      throw new BadRequestException('One or more category_ids do not exist');
    }
  }

  private async syncProductCategories(db: DatabaseExecutor, productId: number, ids: number[]) {
    await db.execute('DELETE FROM product_categories WHERE product_id = ?', [productId]);
    for (const categoryId of ids) {
      await db.execute('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, categoryId]);
    }
  }

  private async attachProductCategories<T extends Record<string, any>>(products: T[]) {
    if (products.length === 0) {
      return products;
    }

    const productIds = products.map((product) => Number(product.id)).filter((id) => Number.isInteger(id) && id > 0);
    if (productIds.length === 0) {
      return products;
    }

    const placeholders = productIds.map(() => '?').join(', ');
    const rows = await this.db.query<RowDataPacket & { product_id: number; category_id: number; category_name: string }>(
      `
        SELECT pc.product_id, pc.category_id, c.name AS category_name
        FROM product_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.product_id IN (${placeholders})
        ORDER BY c.name ASC
      `,
      productIds,
    );

    const categoriesByProductId = new Map<number, Array<{ id: number; name: string }>>();
    for (const row of rows) {
      const productId = Number(row.product_id);
      const categories = categoriesByProductId.get(productId) || [];
      categories.push({ id: Number(row.category_id), name: row.category_name });
      categoriesByProductId.set(productId, categories);
    }

    return products.map((product) => {
      const secondaryCategories = categoriesByProductId.get(Number(product.id)) || [];
      const categoryIds = [product.category_id, ...secondaryCategories.map((category) => category.id)]
        .filter((id): id is number => Number.isInteger(Number(id)) && Number(id) > 0)
        .map((id) => Number(id));
      const categoryNames = [product.category_name, ...secondaryCategories.map((category) => category.name)].filter(Boolean);
      return {
        ...product,
        category_ids: [...new Set(categoryIds)],
        secondary_category_ids: secondaryCategories.map((category) => category.id),
        category_names: [...new Set(categoryNames)],
      };
    });
  }

  async getProducts(query: Record<string, string | string[] | undefined> = {}, options: { includeInactive?: boolean } = {}) {
    const filters = productFilters(query);
    const conditions: string[] = [];
    const params: Array<string | number> = [];
    if (!options.includeInactive) {
      conditions.push('p.status = ?');
      params.push('ACTIVE');
    }
    const effectivePrice = 'p.price';

    if (filters.status) {
      if (!options.includeInactive) {
        throw new BadRequestException('Product status filter is only available for admin product listing');
      }
      const statuses = filters.status === 'ALL' ? [] : filters.status.split(',').map((status) => status.trim()).filter(Boolean);
      for (const status of statuses) {
        productStatus(status);
      }
      if (statuses.length > 0) {
        conditions.push(`p.status IN (${statuses.map(() => '?').join(', ')})`);
        params.push(...statuses);
      }
    }

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
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
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
      data: (await this.attachProductCategories(products as any[])).map((product: any) => productWithPublicImage(product)),
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

    const [productWithCategories] = await this.attachProductCategories([product as Record<string, any>]);
    return productWithPublicImage(productWithCategories);
  }

  async createProduct(body: ProductInput) {
    const name = nullableString(body.name);
    const pricing = createPricing(body);
    const shipping = createShipping(body);
    const stockQuantity = nullableNumber(body.stock_quantity) ?? 0;
    const authorId = nullableId(body.author_id, 'author_id');
    const categoryId = nullableId(body.category_id, 'category_id');
    const publisherId = nullableId(body.publisher_id, 'publisher_id');
    const seriesId = nullableId(body.series_id, 'series_id');
    const secondaryCategoryIds = (categoryIds(body.category_ids) || []).filter((id) => id !== categoryId);
    const allCategoryIds = [...new Set([categoryId, ...secondaryCategoryIds].filter((id): id is number => id !== null))];

    if (!name) {
      throw new BadRequestException('Product name is required');
    }

    if (stockQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    await this.assertReference('authors', authorId, 'author_id');
    await this.assertCategoryIds(allCategoryIds);
    await this.assertReference('publishers', publisherId, 'publisher_id');
    await this.assertReference('book_series', seriesId, 'series_id');
    const slug = await this.uniqueSlug('products', name, 'product');

    return this.db.transaction(async (tx) => {
      const result = await tx.execute(
        `
          INSERT INTO products (
            name, slug, author_id, category_id, publisher_id, series_id, original_price, discount_percent, price, discount_price,
            shipping_fee, shipping_discount_percent, shipping_final_fee, image_url, description, stock_quantity, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          slug,
          authorId,
          categoryId,
          publisherId,
          seriesId,
          pricing.originalPrice,
          pricing.discountPercent,
          pricing.finalPrice,
          pricing.discountPrice,
          shipping.shippingFee,
          shipping.shippingDiscountPercent,
          shipping.shippingFinalFee,
          productImageUrl(body.image_url),
          nullableString(body.description),
          stockQuantity,
          productStatus(body.status),
        ],
      );

      await this.syncProductCategories(tx, result.insertId, secondaryCategoryIds);
      return { id: result.insertId, slug };
    });
  }

  async updateProduct(id: string, body: ProductInput) {
    const name = body.name === undefined ? undefined : nullableString(body.name);
    const slug = name === undefined || name === null ? undefined : await this.uniqueSlug('products', name, 'product', Number(id));
    const stockQuantity = optionalNumber(body.stock_quantity);
    const status = body.status === undefined ? undefined : productStatus(body.status);
    const imageUrl = body.image_url === undefined ? undefined : productImageUrl(body.image_url);
    const description = body.description === undefined ? undefined : nullableString(body.description);
    const categoryId = optionalId(body.category_id, 'category_id');
    const authorId = optionalId(body.author_id, 'author_id');
    const publisherId = optionalId(body.publisher_id, 'publisher_id');
    const seriesId = optionalId(body.series_id, 'series_id');
    const secondaryCategoryIds = categoryIds(body.category_ids);
    const hasPricingChange = hasField(body, 'original_price')
      || hasField(body, 'discount_percent')
      || hasField(body, 'price')
      || hasField(body, 'discount_price');
    const hasShippingChange = hasField(body, 'shipping_fee')
      || hasField(body, 'shipping_discount_percent')
      || hasField(body, 'shipping_final_fee');

    if (body.name !== undefined && !name) {
      throw new BadRequestException('Product name cannot be empty');
    }

    if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    await this.assertReference('authors', authorId, 'author_id');
    await this.assertReference('categories', categoryId, 'category_id');
    await this.assertReference('publishers', publisherId, 'publisher_id');
    await this.assertReference('book_series', seriesId, 'series_id');
    if (secondaryCategoryIds !== undefined) {
      await this.assertCategoryIds(secondaryCategoryIds);
    }

    const existing = await this.db.one<RowDataPacket & {
      category_id: number | null;
      original_price: number | string | null;
      discount_percent: number | string | null;
      price: number | string;
      discount_price: number | string | null;
      shipping_fee: number | string | null;
      shipping_discount_percent: number | string | null;
    }>('SELECT category_id, original_price, discount_percent, price, discount_price, shipping_fee, shipping_discount_percent FROM products WHERE id = ?', [id]);

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    let pricing: ReturnType<typeof buildPricing> | null = null;
    let shipping: ReturnType<typeof buildShipping> | null = null;
    if (hasPricingChange) {
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

    if (hasShippingChange) {
      const shippingFee = hasField(body, 'shipping_fee')
        ? nullableNumber(body.shipping_fee) ?? 0
        : nullableNumber(existing.shipping_fee) ?? 0;
      const shippingDiscountPercent = hasField(body, 'shipping_discount_percent')
        ? nullableNumber(body.shipping_discount_percent) ?? 0
        : nullableNumber(existing.shipping_discount_percent) ?? 0;

      shipping = buildShipping(shippingFee, shippingDiscountPercent);
    }

    const updates: string[] = [];
    const params: Array<string | number | null> = [];
    const pushUpdate = (sql: string, value: string | number | null | undefined) => {
      if (value === undefined) {return;}
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
    if (shipping) {
      pushUpdate('shipping_fee = ?', shipping.shippingFee);
      pushUpdate('shipping_discount_percent = ?', shipping.shippingDiscountPercent);
      pushUpdate('shipping_final_fee = ?', shipping.shippingFinalFee);
    }
    pushUpdate('status = ?', status);
    pushUpdate('image_url = ?', imageUrl);
    pushUpdate('description = ?', description);
    pushUpdate('category_id = ?', categoryId);
    pushUpdate('author_id = ?', authorId);
    pushUpdate('publisher_id = ?', publisherId);
    pushUpdate('series_id = ?', seriesId);

    const effectivePrimaryCategoryId = categoryId === undefined ? Number(existing.category_id) || null : categoryId;
    const normalizedSecondaryCategoryIds = secondaryCategoryIds === undefined
      ? undefined
      : secondaryCategoryIds.filter((secondaryCategoryId) => secondaryCategoryId !== effectivePrimaryCategoryId);

    if (updates.length === 0 && normalizedSecondaryCategoryIds === undefined) {
      return;
    }

    await this.db.transaction(async (tx) => {
      if (updates.length > 0) {
        const result = await tx.execute(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
          [...params, id],
        );

        if (result.affectedRows === 0) {
          throw new NotFoundException('Product not found');
        }
      }

      if (normalizedSecondaryCategoryIds !== undefined) {
        await this.syncProductCategories(tx, Number(id), normalizedSecondaryCategoryIds);
      }
    });
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

  async createCategory(body: CategoryInput) {
    const name = nullableString(body.name);
    const parentId = nullableId(body.parent_id, 'parent_id');
    if (!name) {
      throw new BadRequestException('Category name is required');
    }
    await this.assertReference('categories', parentId, 'parent_id');
    const slug = await this.uniqueSlug('categories', name, 'category');
    const result = await this.db.execute('INSERT INTO categories (name, slug, parent_id, description) VALUES (?, ?, ?, ?)', [
      name,
      slug,
      parentId,
      nullableString(body.description),
    ]);
    return { id: result.insertId, slug };
  }

  async updateCategory(id: string, body: CategoryInput) {
    const name = body.name === undefined ? undefined : nullableString(body.name);
    if (body.name !== undefined && !name) {
      throw new BadRequestException('Category name cannot be empty');
    }
    const parentId = optionalId(body.parent_id, 'parent_id');
    const categoryId = nullableId(id, 'id');
    if (parentId !== undefined && parentId === categoryId) {
      throw new BadRequestException('Category cannot be its own parent');
    }
    await this.assertReference('categories', parentId, 'parent_id');

    const updates: string[] = [];
    const params: Array<string | number | null> = [];
    const pushUpdate = (sql: string, value: string | number | null | undefined) => {
      if (value === undefined) {return;}
      updates.push(sql);
      params.push(value);
    };

    pushUpdate('name = ?', name);
    pushUpdate('slug = ?', name === undefined || name === null ? undefined : await this.uniqueSlug('categories', name, 'category', categoryId));
    pushUpdate('parent_id = ?', parentId);
    pushUpdate('description = ?', body.description === undefined ? undefined : nullableString(body.description));
    pushUpdate('status = ?', body.status === undefined ? undefined : categoryStatus(body.status));

    if (updates.length === 0) {
      return;
    }
    params.push(id);

    const result = await this.db.execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      params,
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

  async createAuthor(body: AuthorInput) {
    const name = nullableString(body.name);
    if (!name) {
      throw new BadRequestException('Author name is required');
    }
    const slug = await this.uniqueSlug('authors', name, 'author');
    const result = await this.db.execute('INSERT INTO authors (name, slug, bio, avatar_url, country) VALUES (?, ?, ?, ?, ?)', [
      name,
      slug,
      nullableString(body.bio),
      nullableString(body.avatar_url),
      nullableString(body.country),
    ]);
    return { id: result.insertId, slug };
  }

  async updateAuthor(id: string, body: AuthorInput) {
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
