import { apiPost } from './api';

export type AnalyticsEventName =
  | 'page_view'
  | 'landing_view'
  | 'product_impression'
  | 'product_click'
  | 'product_view'
  | 'search_submitted'
  | 'filter_changed'
  | 'add_to_cart'
  | 'checkout_started'
  | 'order_completed';

export interface AnalyticsMetadata {
  source?: string;
  position?: number;
  query?: string;
  category_id?: number | string | null;
  category?: string | null;
  sort?: string;
  quantity?: number;
  price?: number;
  revenue?: number;
  order_code?: string | null;
}

const SESSION_KEY = 'akibacore.analyticsSessionId';

function sessionId() {
  if (typeof window === 'undefined') {return 'server';}
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) {return existing;}
  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(SESSION_KEY, next);
  return next;
}

function utmParam(name: string) {
  if (typeof window === 'undefined') {return null;}
  return new URLSearchParams(window.location.search).get(name);
}

export function trackEvent(eventName: AnalyticsEventName, metadata: AnalyticsMetadata = {}, options: { productId?: number; orderId?: number; path?: string } = {}) {
  if (typeof window === 'undefined') {return;}
  const path = options.path || `${window.location.pathname}${window.location.search}`;
  void apiPost('/analytics/events', {
    event_name: eventName,
    session_id: sessionId(),
    product_id: options.productId,
    order_id: options.orderId,
    path,
    referrer: document.referrer || null,
    utm_source: utmParam('utm_source'),
    utm_medium: utmParam('utm_medium'),
    utm_campaign: utmParam('utm_campaign'),
    metadata,
  }, { suppressUnauthorizedEvent: true }).catch(() => {
    // Analytics should never block the user flow.
  });
}
