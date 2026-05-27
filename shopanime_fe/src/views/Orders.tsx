import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, PackageCheck, ReceiptText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { PRODUCT_PLACEHOLDER_IMAGE, formatUsd, useProductPlaceholderImage } from '../lib/format';
import {
  formatOrderDate,
  getEstimatedDelivery,
  getOrderCode,
  getOrderItemImage,
  getOrderListItemCount,
  getOrderPreviewItems,
  getOrderPreviewTitle,
  getOrderStatusClass,
  getOrderStatusLabel,
  getOrderStepIndex,
  orderTimelineSteps,
  orderTotal,
  printOrderInvoice,
} from '../lib/orderDisplay';
import type { ApiResponse, Order, OrderDetails, OrderItem } from '../lib/types';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [detailsById, setDetailsById] = useState<Record<number, OrderDetails>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [invoiceOrderId, setInvoiceOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrderDetails = useCallback(async (orderId: number) => {
    const cached = detailsById[orderId];
    if (cached) {
      return cached;
    }

    const response = await apiGet<ApiResponse<OrderDetails>>(`/orders/${orderId}`);
    setDetailsById((current) => ({ ...current, [orderId]: response.data }));
    return response.data;
  }, [detailsById]);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await apiGet<ApiResponse<Order[]>>('/orders/me/list');
        if (active) {
          setOrders(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load orders');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrders();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMissingOrderDetails() {
      const ordersMissingPreview = orders.filter((order) => getOrderPreviewItems(order).length === 0 && !detailsById[order.id]);
      if (ordersMissingPreview.length === 0) {
        return;
      }

      const results = await Promise.allSettled(
        ordersMissingPreview.map(async (order) => {
          const response = await apiGet<ApiResponse<OrderDetails>>(`/orders/${order.id}`);
          return response.data;
        }),
      );

      if (!active) {
        return;
      }

      setDetailsById((current) => {
        const next = { ...current };
        for (const result of results) {
          if (result.status === 'fulfilled') {
            next[result.value.id] = result.value;
          }
        }
        return next;
      });
    }

    void loadMissingOrderDetails();
    return () => {
      active = false;
    };
  }, [detailsById, orders]);
  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return orders;
    }

    return orders.filter((order) => {
      const details = detailsById[order.id];
      const previewItems = getOrderPreviewItems(details || order);
      const values = [
        getOrderCode(order),
        order.receiver_name,
        order.receiver_phone,
        order.shipping_city,
        order.status,
        ...previewItems.map((item) => item.product_name),
      ];
      return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [detailsById, orders, query]);

  const handlePrintInvoice = useCallback(async (order: Order) => {
    setInvoiceOrderId(order.id);
    setError(null);
    try {
      const details = await loadOrderDetails(order.id);
      printOrderInvoice(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export invoice');
    } finally {
      setInvoiceOrderId(null);
    }
  }, [loadOrderDetails]);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#111216] px-4 py-8 text-[#a0a5b1] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#e63946]">Order center</div>
            <h1 className="text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">Purchase history</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Track fulfillment, review ordered items, and export an invoice when you need a PDF record.
            </p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order, city, product"
              className="h-12 w-full rounded-lg border border-[#2e333d] bg-[#181a1f] pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#e63946]"
            />
          </div>
        </div>

        {loading && <div className="rounded-lg border border-[#2e333d] bg-[#181a1f] p-12 text-center text-sm text-zinc-400">Loading orders...</div>}
        {error && <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {!loading && filteredOrders.length === 0 && (
          <div className="rounded-lg border border-[#2e333d] bg-[#181a1f] p-12 text-center">
            <PackageCheck className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
            <div className="font-bold text-white">No orders found.</div>
            <p className="mt-2 text-sm text-zinc-500">Your order history will appear here after checkout.</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const details = detailsById[order.id];
            const previewItems = getOrderPreviewItems(details || order);
            const stepIndex = getOrderStepIndex(order.status);
            const isCancelled = order.status === 'CANCELLED';
            const itemCount = getOrderListItemCount(order, details);
            const title = getOrderPreviewTitle(order, details);

            return (
              <article key={order.id} className="overflow-hidden rounded-lg border border-[#2e333d] bg-[#181a1f] shadow-xl shadow-black/20">
                <div className="grid gap-5 p-4 md:grid-cols-[88px_1fr_auto] md:p-5">
                  <OrderPreviewImages items={previewItems} orderCode={getOrderCode(order)} />

                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getOrderStatusClass(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{getOrderCode(order)}</span>
                    </div>
                    <Link to={`/orders/${order.id}`} className="block text-lg font-black text-white transition-colors hover:text-[#e63946]">
                      {title}
                    </Link>
                    <div className="mt-1 text-sm text-zinc-500">
                      {itemCount} item{itemCount === 1 ? '' : 's'} / Ordered {formatOrderDate(order.created_at || order.date)} / ETA {getEstimatedDelivery(order)}
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-2">
                      {orderTimelineSteps.map((step, index) => {
                        const active = !isCancelled && index <= stepIndex;
                        return (
                          <div key={step} className="min-w-0">
                            <div className={`h-1.5 rounded-full ${active ? 'bg-[#e63946]' : 'bg-[#2e333d]'}`} />
                            <div className={`mt-2 truncate text-[11px] font-bold uppercase tracking-wide ${active ? 'text-white' : 'text-zinc-600'}`}>{step}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 md:min-w-[190px] md:items-end">
                    <div className="md:text-right">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total paid</div>
                      <div className="mt-1 text-2xl font-black text-white">{formatUsd(orderTotal(order))}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        onClick={() => void handlePrintInvoice(order)}
                        disabled={invoiceOrderId === order.id}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-[#2e333d] px-3 text-xs font-black uppercase tracking-wide text-white transition-colors hover:border-[#e63946] hover:text-[#e63946] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ReceiptText className="h-4 w-4" />
                        {invoiceOrderId === order.id ? 'Exporting' : 'Invoice'}
                      </button>
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#e63946] px-4 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-[#c92f3b]"
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && orders.length > 0 && filteredOrders.length > 0 && (
          <div className="mt-5 text-xs text-zinc-600">
            Showing {filteredOrders.length} of {orders.length} order{orders.length === 1 ? '' : 's'}.
          </div>
        )}
      </div>
    </div>
  );
}

function OrderPreviewImages({ items, orderCode }: { items: OrderItem[]; orderCode: string }) {
  const visibleItems = items.slice(0, 4);
  const extraCount = Math.max(0, items.length - visibleItems.length);

  if (visibleItems.length <= 1) {
    const item = visibleItems[0];
    return (
      <div className="h-24 w-20 overflow-hidden rounded-md border border-[#2e333d] bg-[#101115] md:h-[118px] md:w-[88px]">
        <img
          src={item ? getOrderItemImage(item) : PRODUCT_PLACEHOLDER_IMAGE}
          onError={useProductPlaceholderImage}
          alt={item?.product_name || orderCode}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid h-24 w-20 grid-cols-2 gap-1 overflow-hidden rounded-md border border-[#2e333d] bg-[#101115] p-1 md:h-[118px] md:w-[88px]">
      {visibleItems.map((item, index) => (
        <div key={item.id} className="relative min-h-0 overflow-hidden rounded bg-[#0d0f13]">
          <img
            src={getOrderItemImage(item)}
            onError={useProductPlaceholderImage}
            alt={item.product_name || `${orderCode} item ${index + 1}`}
            className="h-full w-full object-cover"
          />
          {extraCount > 0 && index === visibleItems.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65 text-sm font-black text-white">
              +{extraCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
