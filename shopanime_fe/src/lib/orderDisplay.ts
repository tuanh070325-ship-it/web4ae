import { PRODUCT_PLACEHOLDER_IMAGE, formatUsd, toNumber } from './format';
import type { ApiNumber, Order, OrderDetails, OrderItem, OrderStatus } from './types';

export const orderTimelineSteps = ['Ordered', 'Confirmed', 'Processing', 'Delivery'] as const;

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function orderTotal(order: Order): ApiNumber {
  return order.final_amount ?? order.total_amount ?? order.total ?? 0;
}

export function formatOrderDate(value?: string | null, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-US', options);
}

export function formatOrderDateTime(value?: string | null) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getOrderStatusLabel(status: string) {
  return statusLabels[status as OrderStatus] || status;
}

export function getOrderStatusClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
    case 'PROCESSING':
      return 'border-sky-400/40 bg-sky-400/10 text-sky-200';
    case 'SHIPPED':
      return 'border-indigo-400/40 bg-indigo-400/10 text-indigo-200';
    case 'COMPLETED':
      return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
    case 'CANCELLED':
      return 'border-zinc-500/60 bg-zinc-500/15 text-zinc-300';
    default:
      return 'border-zinc-600 bg-zinc-800 text-zinc-300';
  }
}

export function getOrderStepIndex(status: string) {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'PROCESSING':
      return 2;
    case 'SHIPPED':
    case 'COMPLETED':
      return 3;
    case 'CANCELLED':
      return -1;
    default:
      return 0;
  }
}

export function getOrderCode(order: Order) {
  return order.order_code || `ORD-${order.id}`;
}

export function getShippingAddress(order: Order) {
  return [order.shipping_address_line, order.shipping_ward, order.shipping_district, order.shipping_city].filter(Boolean).join(', ') || 'N/A';
}

export function getOrderItemImage(item?: OrderItem | null) {
  return item?.product_image || PRODUCT_PLACEHOLDER_IMAGE;
}

export function getOrderItemCount(order?: OrderDetails | null) {
  return order?.items.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0;
}

export function getOrderPreviewItems(order?: Order | OrderDetails | null) {
  if (!order) {
    return [];
  }

  if ('items' in order && Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }

  return order.order_preview_items || [];
}

export function getOrderListItemCount(order: Order, details?: OrderDetails | null) {
  if (details) {
    return getOrderItemCount(details);
  }

  return toNumber(order.order_items_count, 0);
}

export function getOrderProductLineCount(order: Order, details?: OrderDetails | null) {
  if (details) {
    return details.items.length;
  }

  return toNumber(order.order_product_count, order.order_preview_items?.length || 0);
}

export function getOrderPreviewTitle(order: Order, details?: OrderDetails | null) {
  const previewItems = getOrderPreviewItems(details || order);
  const firstName = previewItems[0]?.product_name || 'Order details';
  const productLineCount = getOrderProductLineCount(order, details);
  if (productLineCount <= 1) {
    return firstName;
  }

  return `${firstName} + ${productLineCount - 1} more`;
}

export function buildInvoiceHtml(order: OrderDetails) {
  const createdAt = formatOrderDateTime(order.created_at || order.date);
  const address = getShippingAddress(order);
  const subtotal = formatUsd(order.subtotal_amount ?? 0);
  const shipping = formatUsd(order.shipping_fee ?? 0);
  const total = formatUsd(orderTotal(order));
  const rows = order.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.product_name || `Product #${item.product_id}`)}</td>
      <td>${formatUsd(item.price)}</td>
      <td>${item.quantity}</td>
      <td>${formatUsd(item.subtotal)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(getOrderCode(order))}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { color: #111827; font-family: Arial, sans-serif; margin: 0; }
    .header { align-items: flex-start; border-bottom: 2px solid #111827; display: flex; justify-content: space-between; padding-bottom: 20px; }
    .brand { color: #e63946; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    .muted { color: #6b7280; font-size: 12px; line-height: 1.6; }
    h1 { font-size: 28px; margin: 0 0 8px; text-transform: uppercase; }
    .grid { display: grid; gap: 18px; grid-template-columns: 1fr 1fr; margin: 28px 0; }
    .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
    .label { color: #6b7280; font-size: 11px; font-weight: 700; letter-spacing: .7px; margin-bottom: 6px; text-transform: uppercase; }
    .value { font-size: 14px; font-weight: 700; }
    table { border-collapse: collapse; margin-top: 12px; width: 100%; }
    th { background: #111827; color: white; font-size: 11px; letter-spacing: .7px; padding: 11px; text-align: left; text-transform: uppercase; }
    td { border-bottom: 1px solid #e5e7eb; font-size: 13px; padding: 12px 11px; vertical-align: top; }
    td:nth-child(1), td:nth-child(4) { text-align: center; width: 48px; }
    td:nth-child(3), td:nth-child(5) { text-align: right; white-space: nowrap; }
    .summary { margin-left: auto; margin-top: 24px; width: 280px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .summary-total { border-top: 2px solid #111827; font-size: 18px; font-weight: 800; margin-top: 8px; padding-top: 12px; }
    .footer { border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; margin-top: 40px; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">AkibaCore</div>
      <div class="muted">Anime collectibles and figure store</div>
    </div>
    <div style="text-align:right">
      <h1>Invoice</h1>
      <div class="muted">${escapeHtml(getOrderCode(order))}</div>
      <div class="muted">Issued: ${escapeHtml(createdAt)}</div>
    </div>
  </div>
  <div class="grid">
    <div class="box">
      <div class="label">Bill to</div>
      <div class="value">${escapeHtml(order.receiver_name || 'Customer')}</div>
      <div class="muted">${escapeHtml(order.receiver_phone || 'No phone')}</div>
      <div class="muted">${escapeHtml(address)}</div>
    </div>
    <div class="box">
      <div class="label">Order</div>
      <div class="value">Status: ${escapeHtml(getOrderStatusLabel(order.status))}</div>
      <div class="muted">Shipping method: ${escapeHtml(order.shipping_method || 'STANDARD')}</div>
      <div class="muted">Items: ${getOrderItemCount(order)}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Product</th><th>Price</th><th>Qty</th><th>Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">No items found.</td></tr>'}</tbody>
  </table>
  <div class="summary">
    <div class="summary-row"><span>Subtotal</span><strong>${subtotal}</strong></div>
    <div class="summary-row"><span>Shipping</span><strong>${shipping}</strong></div>
    <div class="summary-row summary-total"><span>Total</span><span>${total}</span></div>
  </div>
  <div class="footer">This invoice was generated from AkibaCore order data. Keep this PDF for your records.</div>
</body>
</html>`;
}

export function printOrderInvoice(order: OrderDetails) {
  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) {
    throw new Error('Unable to open invoice print window. Please allow pop-ups and try again.');
  }

  printWindow.document.open();
  printWindow.document.write(buildInvoiceHtml(order));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 250);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case "'":
        return '&#39;';
      case '"':
        return '&quot;';
      default:
        return char;
    }
  });
}

export function getEstimatedDelivery(order: Order) {
  const source = order.created_at || order.date;
  if (!source) {
    return 'Pending schedule';
  }

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    return 'Pending schedule';
  }

  date.setDate(date.getDate() + 5);
  if (order.status === 'COMPLETED') {
    return 'Delivered';
  }
  if (order.status === 'CANCELLED') {
    return 'Cancelled';
  }
  return formatOrderDate(date.toISOString(), { month: 'short', day: 'numeric', year: 'numeric' });
}
