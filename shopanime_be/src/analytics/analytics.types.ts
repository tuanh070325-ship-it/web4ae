export const ANALYTICS_EVENT_NAMES = [
  'page_view',
  'landing_view',
  'product_impression',
  'product_click',
  'product_view',
  'search_submitted',
  'filter_changed',
  'add_to_cart',
  'checkout_started',
  'order_completed',
] as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENT_NAMES[number];

export interface AnalyticsEventInput {
  event_name?: unknown;
  session_id?: unknown;
  product_id?: unknown;
  order_id?: unknown;
  path?: unknown;
  referrer?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  metadata?: unknown;
}

export interface AnalyticsRange {
  from: string;
  to: string;
}
