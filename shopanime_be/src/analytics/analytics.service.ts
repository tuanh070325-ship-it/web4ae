import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { verifyAuthToken } from '../auth/token.js';
import { DbService } from '../db/db.service.js';
import { ANALYTICS_EVENT_NAMES, type AnalyticsEventInput, type AnalyticsEventName, type AnalyticsRange } from './analytics.types.js';

const EVENT_TYPES: Record<AnalyticsEventName, string> = {
  page_view: 'traffic',
  landing_view: 'traffic',
  product_impression: 'product',
  product_click: 'product',
  product_view: 'product',
  search_submitted: 'engagement',
  filter_changed: 'engagement',
  add_to_cart: 'commerce',
  checkout_started: 'commerce',
  order_completed: 'commerce',
};

const METADATA_KEYS = new Set([
  'source',
  'position',
  'query',
  'category_id',
  'category',
  'sort',
  'quantity',
  'price',
  'revenue',
  'order_code',
]);

interface SummaryRow extends RowDataPacket {
  pageviews: number;
  visitors: number;
  landing_views: number;
  product_impressions: number;
  product_clicks: number;
  product_views: number;
  add_to_cart: number;
  checkout_starts: number;
  orders_completed: number;
  revenue: number | string | null;
}

interface DailyRow extends RowDataPacket {
  date_key: string;
  pageviews: number;
  visitors: number;
  product_clicks: number;
  product_views: number;
  add_to_cart: number;
  orders_completed: number;
  revenue: number | string | null;
}

function nullableString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {return null;}
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function nullablePositiveInteger(value: unknown, fieldName: string) {
  if (value === null || value === undefined || value === '') {return null;}
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }
  return numberValue;
}

function parseEventName(value: unknown): AnalyticsEventName {
  if (typeof value !== 'string' || !ANALYTICS_EVENT_NAMES.includes(value as AnalyticsEventName)) {
    throw new BadRequestException('Invalid analytics event');
  }
  return value as AnalyticsEventName;
}

function clientIp(request: Request) {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.ip || request.socket.remoteAddress || '';
}

function hashIp(value: string) {
  if (!value) {return null;}
  const salt = process.env.ANALYTICS_IP_SALT || process.env.JWT_SECRET || 'dev-analytics-salt';
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

function browserName(userAgent: string | null) {
  const value = String(userAgent || '').toLowerCase();
  if (value.includes('edg/')) {return 'Edge';}
  if (value.includes('chrome/')) {return 'Chrome';}
  if (value.includes('firefox/')) {return 'Firefox';}
  if (value.includes('safari/') && !value.includes('chrome/')) {return 'Safari';}
  return value ? 'Other' : null;
}

function deviceType(userAgent: string | null) {
  const value = String(userAgent || '').toLowerCase();
  if (/bot|crawler|spider|crawling/.test(value)) {return 'bot';}
  if (/tablet|ipad/.test(value)) {return 'tablet';}
  if (/mobile|iphone|android/.test(value)) {return 'mobile';}
  return value ? 'desktop' : null;
}

function metadataValue(value: unknown): string | number | boolean | null {
  if (typeof value === 'string') {return value.slice(0, 500);}
  if (typeof value === 'number' && Number.isFinite(value)) {return value;}
  if (typeof value === 'boolean') {return value;}
  return null;
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {return null;}
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (METADATA_KEYS.has(key)) {
      result[key] = metadataValue(rawValue);
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

function rangeFromQuery(query: Record<string, string | string[] | undefined>): AnalyticsRange {
  const to = nullableString(Array.isArray(query.to) ? query.to[0] : query.to, 10) || new Date().toISOString().slice(0, 10);
  const fromDefault = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const from = nullableString(Array.isArray(query.from) ? query.from[0] : query.from, 10) || fromDefault;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new BadRequestException('Invalid date range');
  }
  return { from, to };
}

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  async recordEvent(body: AnalyticsEventInput, request: Request) {
    const eventName = parseEventName(body.event_name);
    const sessionId = nullableString(body.session_id, 80);
    if (!sessionId) {
      throw new BadRequestException('session_id is required');
    }

    const userAgent = nullableString(request.headers['user-agent'], 1000);
    const token = this.authToken(request);
    const tokenPayload = token ? verifyAuthToken(token) : null;
    const userId = tokenPayload?.sub || null;
    const productId = nullablePositiveInteger(body.product_id, 'product_id');
    const orderId = nullablePositiveInteger(body.order_id, 'order_id');
    const metadata = cleanMetadata(body.metadata);
    const revenue = Number(metadata?.revenue || 0);

    await this.db.execute(
      `
        INSERT INTO analytics_events (
          event_name, event_type, session_id, user_id, product_id, order_id, path, referrer,
          utm_source, utm_medium, utm_campaign, device_type, browser, user_agent, ip_hash, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        eventName,
        EVENT_TYPES[eventName],
        sessionId,
        userId,
        productId,
        orderId,
        nullableString(body.path, 500),
        nullableString(body.referrer, 500),
        nullableString(body.utm_source, 120),
        nullableString(body.utm_medium, 120),
        nullableString(body.utm_campaign, 160),
        deviceType(userAgent),
        browserName(userAgent),
        userAgent,
        hashIp(clientIp(request)),
        JSON.stringify(metadata || {}),
      ],
    );

    await this.updateAggregates(eventName, sessionId, productId, Number.isFinite(revenue) ? revenue : 0);
    return { success: true };
  }

  async getSummary(query: Record<string, string | string[] | undefined>) {
    const range = rangeFromQuery(query);
    const summary = await this.db.one<SummaryRow>(
      `
        SELECT
          SUM(event_name = 'page_view') AS pageviews,
          COUNT(DISTINCT session_id) AS visitors,
          SUM(event_name = 'landing_view') AS landing_views,
          SUM(event_name = 'product_impression') AS product_impressions,
          SUM(event_name = 'product_click') AS product_clicks,
          SUM(event_name = 'product_view') AS product_views,
          SUM(event_name = 'add_to_cart') AS add_to_cart,
          SUM(event_name = 'checkout_started') AS checkout_starts,
          COUNT(DISTINCT CASE WHEN event_name = 'order_completed' THEN order_id END) AS orders_completed,
          SUM(CASE WHEN event_name = 'order_completed' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.revenue')) AS DECIMAL(12,2)), 0) ELSE 0 END) AS revenue
        FROM analytics_events
        WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
      `,
      [range.from, range.to],
    );
    const daily = await this.db.query<DailyRow>(
      `
        SELECT
          DATE(created_at) AS date_key,
          SUM(event_name = 'page_view') AS pageviews,
          COUNT(DISTINCT session_id) AS visitors,
          SUM(event_name = 'product_click') AS product_clicks,
          SUM(event_name = 'product_view') AS product_views,
          SUM(event_name = 'add_to_cart') AS add_to_cart,
          COUNT(DISTINCT CASE WHEN event_name = 'order_completed' THEN order_id END) AS orders_completed,
          SUM(CASE WHEN event_name = 'order_completed' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.revenue')) AS DECIMAL(12,2)), 0) ELSE 0 END) AS revenue
        FROM analytics_events
        WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date_key ASC
      `,
      [range.from, range.to],
    );
    return { range, summary: this.normalizeSummary(summary), daily };
  }

  getPages(query: Record<string, string | string[] | undefined>) {
    const range = rangeFromQuery(query);
    return this.db.query(
      `
        SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors
        FROM analytics_events
        WHERE event_name = 'page_view' AND created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY path
        ORDER BY views DESC
        LIMIT 25
      `,
      [range.from, range.to],
    );
  }

  getProducts(query: Record<string, string | string[] | undefined>) {
    const range = rangeFromQuery(query);
    return this.db.query(
      `
        SELECT
          p.id, p.name, p.slug, p.image_url,
          SUM(ae.event_name = 'product_impression') AS impressions,
          SUM(ae.event_name = 'product_click') AS clicks,
          SUM(ae.event_name = 'product_view') AS detail_views,
          SUM(ae.event_name = 'add_to_cart') AS add_to_cart,
          SUM(ae.event_name = 'order_completed') AS purchases,
          SUM(CASE WHEN ae.event_name = 'order_completed' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ae.metadata, '$.revenue')) AS DECIMAL(12,2)), 0) ELSE 0 END) AS revenue
        FROM analytics_events ae
        JOIN products p ON p.id = ae.product_id
        WHERE ae.product_id IS NOT NULL AND ae.created_at >= ? AND ae.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY p.id, p.name, p.slug, p.image_url
        ORDER BY clicks DESC, detail_views DESC
        LIMIT 25
      `,
      [range.from, range.to],
    );
  }

  async getFunnel(query: Record<string, string | string[] | undefined>) {
    const range = rangeFromQuery(query);
    const rows = await this.db.query<RowDataPacket & { event_name: string; sessions: number }>(
      `
        SELECT event_name, COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events
        WHERE event_name IN ('page_view', 'product_click', 'product_view', 'add_to_cart', 'checkout_started', 'order_completed')
          AND created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY event_name
      `,
      [range.from, range.to],
    );
    const counts = new Map(rows.map((row) => [row.event_name, Number(row.sessions || 0)]));
    return [
      { label: 'Visits', event_name: 'page_view', sessions: counts.get('page_view') || 0 },
      { label: 'Product Clicks', event_name: 'product_click', sessions: counts.get('product_click') || 0 },
      { label: 'Product Views', event_name: 'product_view', sessions: counts.get('product_view') || 0 },
      { label: 'Add to Cart', event_name: 'add_to_cart', sessions: counts.get('add_to_cart') || 0 },
      { label: 'Checkout', event_name: 'checkout_started', sessions: counts.get('checkout_started') || 0 },
      { label: 'Orders', event_name: 'order_completed', sessions: counts.get('order_completed') || 0 },
    ];
  }

  private authToken(request: Request) {
    const authorization = request.headers.authorization;
    return typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  }

  private normalizeSummary(summary: SummaryRow | null) {
    return {
      pageviews: Number(summary?.pageviews || 0),
      visitors: Number(summary?.visitors || 0),
      landing_views: Number(summary?.landing_views || 0),
      product_impressions: Number(summary?.product_impressions || 0),
      product_clicks: Number(summary?.product_clicks || 0),
      product_views: Number(summary?.product_views || 0),
      add_to_cart: Number(summary?.add_to_cart || 0),
      checkout_starts: Number(summary?.checkout_starts || 0),
      orders_completed: Number(summary?.orders_completed || 0),
      revenue: Number(summary?.revenue || 0),
    };
  }

  private async updateAggregates(eventName: AnalyticsEventName, sessionId: string, productId: number | null, revenue: number) {
    const dailyColumn = this.dailyColumn(eventName);
    if (dailyColumn) {
      const visitorIncrement = eventName === 'page_view' ? await this.isFirstSessionEventToday(sessionId) : false;
      await this.db.execute(
        `
          INSERT INTO analytics_daily_stats (date_key, ${dailyColumn}, visitors, revenue)
          VALUES (CURRENT_DATE(), 1, ?, ?)
          ON DUPLICATE KEY UPDATE ${dailyColumn} = ${dailyColumn} + 1, visitors = visitors + ?, revenue = revenue + ?
        `,
        [visitorIncrement ? 1 : 0, eventName === 'order_completed' ? revenue : 0, visitorIncrement ? 1 : 0, eventName === 'order_completed' ? revenue : 0],
      );
    }

    const productColumn = this.productColumn(eventName);
    if (productColumn && productId) {
      await this.db.execute(
        `
          INSERT INTO analytics_product_stats (product_id, ${productColumn}, revenue)
          VALUES (?, 1, ?)
          ON DUPLICATE KEY UPDATE ${productColumn} = ${productColumn} + 1, revenue = revenue + ?
        `,
        [productId, eventName === 'order_completed' ? revenue : 0, eventName === 'order_completed' ? revenue : 0],
      );
    }
  }

  private dailyColumn(eventName: AnalyticsEventName) {
    return ({
      page_view: 'pageviews',
      product_view: 'product_views',
      product_click: 'product_clicks',
      add_to_cart: 'add_to_cart',
      checkout_started: 'checkout_starts',
      order_completed: 'orders_completed',
    } as Partial<Record<AnalyticsEventName, string>>)[eventName];
  }

  private productColumn(eventName: AnalyticsEventName) {
    return ({
      product_impression: 'impressions',
      product_click: 'clicks',
      product_view: 'detail_views',
      add_to_cart: 'add_to_cart',
      order_completed: 'purchases',
    } as Partial<Record<AnalyticsEventName, string>>)[eventName];
  }

  private async isFirstSessionEventToday(sessionId: string) {
    const existing = await this.db.one<RowDataPacket & { total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM analytics_events
        WHERE session_id = ? AND event_name = 'page_view' AND DATE(created_at) = CURRENT_DATE()
      `,
      [sessionId],
    );
    return Number(existing?.total || 0) <= 1;
  }
}
