import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, CreditCard, MapPin, PackageCheck, ReceiptText, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { formatUsd, useProductPlaceholderImage } from '../lib/format';
import {
  formatOrderDateTime,
  getEstimatedDelivery,
  getOrderCode,
  getOrderItemCount,
  getOrderItemImage,
  getOrderStatusClass,
  getOrderStatusLabel,
  getOrderStepIndex,
  getShippingAddress,
  orderTimelineSteps,
  orderTotal,
  printOrderInvoice,
} from '../lib/orderDisplay';
import type { ApiResponse, OrderDetails } from '../lib/types';

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      if (!id) {
        setError('Order id is required');
        setLoading(false);
        return;
      }

      try {
        const response = await apiGet<ApiResponse<OrderDetails>>(`/orders/${id}`);
        if (active) {
          setOrder(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load order details');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrder();
    return () => {
      active = false;
    };
  }, [id]);

  const handlePrintInvoice = useCallback(() => {
    if (!order) {
      return;
    }

    setInvoiceError(null);
    try {
      printOrderInvoice(order);
    } catch (err) {
      setInvoiceError(err instanceof Error ? err.message : 'Unable to export invoice');
    }
  }, [order]);

  if (loading) {
    return <div className="min-h-[calc(100vh-72px)] bg-[#111216] px-4 py-12 text-center text-sm text-zinc-400">Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#111216] px-4 py-12 text-center">
        <div className="mx-auto max-w-lg rounded-lg border border-[#2e333d] bg-[#181a1f] p-8">
          <ClipboardList className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
          <h1 className="text-xl font-black text-white">Order not available</h1>
          <p className="mt-2 text-sm text-zinc-400">{error || 'Unable to load this order.'}</p>
          <Link to="/orders" className="mt-6 inline-flex h-10 items-center rounded-md bg-[#e63946] px-4 text-xs font-black uppercase tracking-wide text-white hover:bg-[#c92f3b]">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const stepIndex = getOrderStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const itemCount = getOrderItemCount(order);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#111216] px-4 py-8 text-[#a0a5b1] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/orders" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to purchase history
            </Link>
            <div className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#e63946]">Order detail</div>
            <h1 className="text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">{getOrderCode(order)}</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Placed {formatOrderDateTime(order.created_at || order.date)} / {itemCount} item{itemCount === 1 ? '' : 's'} / ETA {getEstimatedDelivery(order)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex h-11 items-center rounded-md border px-4 text-xs font-black uppercase tracking-wide ${getOrderStatusClass(order.status)}`}>
              {getOrderStatusLabel(order.status)}
            </span>
            <button
              onClick={handlePrintInvoice}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#e63946] px-4 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-[#c92f3b]"
            >
              <ReceiptText className="h-4 w-4" />
              Export invoice PDF
            </button>
          </div>
        </div>

        {invoiceError && <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{invoiceError}</div>}

        <section className="mb-5 rounded-lg border border-[#2e333d] bg-[#181a1f] p-5 shadow-xl shadow-black/20">
          <div className="mb-5 flex items-center gap-3">
            <PackageCheck className="h-5 w-5 text-[#e63946]" />
            <h2 className="text-lg font-black uppercase tracking-wide text-white">Tracking</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {orderTimelineSteps.map((step, index) => {
              const active = !isCancelled && index <= stepIndex;
              return (
                <div key={step} className="min-w-0">
                  <div className={`h-2 rounded-full ${active ? 'bg-[#e63946]' : 'bg-[#2e333d]'}`} />
                  <div className={`mt-3 text-[11px] font-black uppercase tracking-wide sm:text-xs ${active ? 'text-white' : 'text-zinc-600'}`}>{step}</div>
                </div>
              );
            })}
          </div>
          {isCancelled && <div className="mt-4 rounded-md border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-300">This order was cancelled. Fulfillment tracking has stopped.</div>}
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <main className="space-y-5">
            <section className="rounded-lg border border-[#2e333d] bg-[#181a1f] shadow-xl shadow-black/20">
              <div className="border-b border-[#2e333d] px-5 py-4">
                <h2 className="text-lg font-black uppercase tracking-wide text-white">Products</h2>
              </div>
              <div className="divide-y divide-[#2e333d]">
                {order.items.map((item) => (
                  <div key={item.id} className="grid gap-4 p-5 sm:grid-cols-[76px_1fr_auto] sm:items-center">
                    <div className="h-24 w-20 overflow-hidden rounded-md border border-[#2e333d] bg-[#101115] sm:h-[104px] sm:w-[76px]">
                      <img
                        src={getOrderItemImage(item)}
                        onError={useProductPlaceholderImage}
                        alt={item.product_name || `Product #${item.product_id}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-2 font-black text-white">{item.product_name || `Product #${item.product_id}`}</div>
                      <div className="mt-2 text-sm text-zinc-500">Unit price {formatUsd(item.price)} / Quantity {item.quantity}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Amount</div>
                      <div className="mt-1 text-lg font-black text-white">{formatUsd(item.subtotal)}</div>
                    </div>
                  </div>
                ))}
                {order.items.length === 0 && <div className="p-10 text-center text-sm text-zinc-500">No items found.</div>}
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-[#2e333d] bg-[#181a1f] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#e63946]" />
                  <h2 className="font-black uppercase tracking-wide text-white">Shipping address</h2>
                </div>
                <div className="font-bold text-white">{order.receiver_name || 'N/A'}</div>
                <div className="mt-1 text-sm text-zinc-400">{order.receiver_phone || 'No phone'}</div>
                <div className="mt-3 text-sm leading-6 text-zinc-300">{getShippingAddress(order)}</div>
                {order.notes && <div className="mt-3 rounded-md border border-[#2e333d] bg-[#101115] px-3 py-2 text-sm text-zinc-400">Note: {order.notes}</div>}
              </div>

              <div className="rounded-lg border border-[#2e333d] bg-[#181a1f] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Truck className="h-5 w-5 text-[#e63946]" />
                  <h2 className="font-black uppercase tracking-wide text-white">Fulfillment</h2>
                </div>
                <div className="grid gap-3 text-sm">
                  <InfoRow label="Method" value={order.shipping_method || 'STANDARD'} />
                  <InfoRow label="Estimated delivery" value={getEstimatedDelivery(order)} />
                  <InfoRow label="Current status" value={getOrderStatusLabel(order.status)} />
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-5">
            <section className="rounded-lg border border-[#2e333d] bg-[#181a1f] p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#e63946]" />
                <h2 className="font-black uppercase tracking-wide text-white">Payment summary</h2>
              </div>
              <div className="space-y-3 text-sm">
                <SummaryRow label="Subtotal" value={formatUsd(order.subtotal_amount ?? 0)} />
                <SummaryRow label="Shipping" value={formatUsd(order.shipping_fee ?? 0)} />
                <div className="flex justify-between border-t border-[#2e333d] pt-4 text-base font-black text-white">
                  <span>Total</span>
                  <span>{formatUsd(orderTotal(order))}</span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#2e333d] bg-[#181a1f] p-5">
              <h2 className="font-black uppercase tracking-wide text-white">Invoice</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The invoice opens in a printable A4 layout. Choose Save as PDF in your browser print dialog to create the file.
              </p>
              <button
                onClick={handlePrintInvoice}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#e63946] px-4 text-xs font-black uppercase tracking-wide text-[#e63946] transition-colors hover:bg-[#e63946]/10"
              >
                <ReceiptText className="h-4 w-4" />
                Create invoice PDF
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-zinc-400">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#2e333d] pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  );
}
