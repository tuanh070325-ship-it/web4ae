import { useEffect, useMemo, useState } from 'react';
import { Activity, MousePointerClick, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { apiGet } from '../lib/api';
import { formatUsd, toNumber } from '../lib/format';
import type { ApiResponse } from '../lib/types';
import { AdminPage, AdminPanel, adminInputClass, adminTdClass, adminThClass } from '../components/admin/AdminUI';

interface AnalyticsSummary {
  pageviews: number;
  visitors: number;
  landing_views: number;
  product_impressions: number;
  product_clicks: number;
  product_views: number;
  add_to_cart: number;
  checkout_starts: number;
  orders_completed: number;
  revenue: number;
}

interface DailyStat extends AnalyticsSummary {
  date_key: string;
}

interface SummaryResponse {
  range: { from: string; to: string };
  summary: AnalyticsSummary;
  daily: DailyStat[];
}

interface PageStat {
  path: string | null;
  views: number;
  visitors: number;
}

interface ProductStat {
  id: number;
  name: string;
  slug?: string | null;
  impressions: number;
  clicks: number;
  detail_views: number;
  add_to_cart: number;
  purchases: number;
  revenue: number;
}

interface FunnelStep {
  label: string;
  event_name: string;
  sessions: number;
}

function dateOffset(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function percent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function shortDate(value: string) {
  const normalized = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {return 'N/A';}
  const [, month, day] = normalized.split('-');
  return `${month}/${day}`;
}

export function AdminAnalytics() {
  const [from, setFrom] = useState(dateOffset(29));
  const [to, setTo] = useState(dateOffset(0));
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [pages, setPages] = useState<PageStat[]>([]);
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    setError(null);
    void Promise.all([
      apiGet<ApiResponse<SummaryResponse>>(`/admin/analytics/summary?${query}`).then((response) => setSummary(response.data)),
      apiGet<ApiResponse<PageStat[]>>(`/admin/analytics/pages?${query}`).then((response) => setPages(response.data)),
      apiGet<ApiResponse<ProductStat[]>>(`/admin/analytics/products?${query}`).then((response) => setProducts(response.data)),
      apiGet<ApiResponse<FunnelStep[]>>(`/admin/analytics/funnel?${query}`).then((response) => setFunnel(response.data)),
    ]).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load analytics'));
  }, [from, to]);

  const metrics = summary?.summary;
  const conversionRate = metrics && metrics.visitors > 0 ? metrics.orders_completed / metrics.visitors * 100 : 0;
  const maxDaily = useMemo(() => Math.max(1, ...(summary?.daily || []).map((day) => Number(day.pageviews || 0))), [summary]);
  const maxFunnel = Math.max(1, ...funnel.map((step) => Number(step.sessions || 0)));

  const cards = [
    { label: 'Visitors', value: String(metrics?.visitors || 0), icon: Users },
    { label: 'Pageviews', value: String(metrics?.pageviews || 0), icon: Activity },
    { label: 'Product Clicks', value: String(metrics?.product_clicks || 0), icon: MousePointerClick },
    { label: 'Add to Cart', value: String(metrics?.add_to_cart || 0), icon: ShoppingCart },
    { label: 'Orders', value: String(metrics?.orders_completed || 0), icon: TrendingUp },
    { label: 'Revenue', value: formatUsd(metrics?.revenue || 0), icon: TrendingUp },
  ];

  return (
    <AdminPage title="Analytics" description="Traffic, product engagement, and conversion performance.">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-bold uppercase text-zinc-500">
          From
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={adminInputClass} />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase text-zinc-500">
          To
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={adminInputClass} />
        </label>
        {error && <div className="text-sm font-semibold text-red-300">{error}</div>}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-[#343d43] bg-[#171d21] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
            <div className="mb-3 flex items-center justify-between text-zinc-400">
              <span className="text-xs font-black uppercase tracking-wide">{label}</span>
              <Icon className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <AdminPanel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black text-white">Daily Traffic</h2>
            <span className="text-xs font-bold uppercase text-zinc-500">Conversion {percent(conversionRate)}</span>
          </div>
          <div className="h-64 border-b border-[#343d43] pb-3">
            <div className="flex h-52 items-end gap-2">
            {(summary?.daily || []).map((day) => {
              const pageviews = Number(day.pageviews || 0);
              const height = Math.max(8, pageviews / maxDaily * 190);
              return (
                <div key={day.date_key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="text-[10px] font-bold text-zinc-500">{pageviews}</div>
                  <div title={`${shortDate(day.date_key)}: ${pageviews} views`} className="w-full max-w-9 rounded-t bg-[#e63946] shadow-[0_0_18px_rgba(230,57,70,0.25)]" style={{ height: `${height}px` }} />
                </div>
              );
            })}
            </div>
            <div className="mt-2 flex gap-2">
              {(summary?.daily || []).map((day) => (
                <div key={`label-${day.date_key}`} className="min-w-0 flex-1 text-center text-[10px] font-semibold text-zinc-500">
                  {shortDate(day.date_key)}
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel className="p-5">
          <h2 className="mb-4 text-base font-black text-white">Funnel</h2>
          <div className="space-y-3">
            {funnel.map((step) => (
              <div key={step.event_name}>
                <div className="mb-1 flex justify-between text-xs font-bold uppercase text-zinc-400">
                  <span>{step.label}</span>
                  <span>{step.sessions}</span>
                </div>
                <div className="h-2 rounded bg-[#101417]">
                  <div className="h-2 rounded bg-[#5ea5c8]" style={{ width: `${Math.max(2, Number(step.sessions || 0) / maxFunnel * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminPanel>
          <div className="border-b border-[#343d43] px-4 py-3 text-base font-black text-white">Top Pages</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead><tr><th className={adminThClass}>Path</th><th className={adminThClass}>Views</th><th className={adminThClass}>Visitors</th></tr></thead>
              <tbody className="divide-y divide-[#343d43]">
                {pages.map((page) => (
                  <tr key={page.path || 'unknown'}><td className={adminTdClass}>{page.path || 'N/A'}</td><td className={adminTdClass}>{page.views}</td><td className={adminTdClass}>{page.visitors}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel>
          <div className="border-b border-[#343d43] px-4 py-3 text-base font-black text-white">Product Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr><th className={adminThClass}>Product</th><th className={adminThClass}>CTR</th><th className={adminThClass}>Views</th><th className={adminThClass}>Cart</th><th className={adminThClass}>Orders</th><th className={adminThClass}>Revenue</th></tr></thead>
              <tbody className="divide-y divide-[#343d43]">
                {products.map((product) => {
                  const ctr = toNumber(product.impressions) > 0 ? toNumber(product.clicks) / toNumber(product.impressions) * 100 : 0;
                  return (
                    <tr key={product.id}>
                      <td className={adminTdClass}>{product.name}</td>
                      <td className={adminTdClass}>{percent(ctr)}</td>
                      <td className={adminTdClass}>{product.detail_views}</td>
                      <td className={adminTdClass}>{product.add_to_cart}</td>
                      <td className={adminTdClass}>{product.purchases}</td>
                      <td className={adminTdClass}>{formatUsd(product.revenue || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}
