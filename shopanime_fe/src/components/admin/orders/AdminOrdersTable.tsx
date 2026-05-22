import { memo } from 'react';
import { Eye } from 'lucide-react';
import { formatUsd } from '../../../lib/format';
import type { Order, OrderStatus } from '../../../lib/types';
import { AdminTable, adminInputClass, adminSecondaryButtonClass, adminTdClass, adminThClass } from '../AdminUI';

interface AdminOrdersTableProps {
  orders: Order[];
  orderStatuses: OrderStatus[];
  onOpenDetails: (order: Order) => void;
  onUpdateStatus: (order: Order, status: string) => void;
}

function orderTotal(order: Order) {
  return order.final_amount ?? order.total_amount ?? order.total ?? 0;
}

function formatDate(value?: string | null) {
  if (!value) {return 'N/A';}
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusClass(status: string) {
  if (status === 'COMPLETED') {return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';}
  if (status === 'SHIPPED') {return 'bg-sky-500/15 text-sky-300 border-sky-500/30';}
  if (status === 'PROCESSING') {return 'bg-amber-500/15 text-amber-300 border-amber-500/30';}
  if (status === 'CANCELLED') {return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';}
  return 'bg-red-500/15 text-red-300 border-red-500/30';
}

export const AdminOrdersTable = memo(function AdminOrdersTable({
  orders,
  orderStatuses,
  onOpenDetails,
  onUpdateStatus,
}: AdminOrdersTableProps) {
  return (
    <AdminTable>
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-[#16171d] text-xs uppercase text-zinc-500">
          <tr>
            <th className={adminThClass}>Order</th>
            <th className={adminThClass}>Customer</th>
            <th className={adminThClass}>Date</th>
            <th className={adminThClass}>Total</th>
            <th className={adminThClass}>Status</th>
            <th className={`${adminThClass} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-white/[0.03]">
              <td className={adminTdClass}>
                <div className="font-mono text-xs text-zinc-400">{order.order_code || `#${order.id}`}</div>
                <div className={`mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{order.status}</div>
              </td>
              <td className={adminTdClass}>
                <div className="font-semibold text-white">{order.receiver_name || order.customer || 'Guest'}</div>
                <div className="text-xs text-zinc-500">{order.receiver_phone || order.shipping_city || 'No contact'}</div>
              </td>
              <td className={adminTdClass}>{formatDate(order.created_at || order.date)}</td>
              <td className={`${adminTdClass} font-semibold text-white`}>{formatUsd(orderTotal(order))}</td>
              <td className={adminTdClass}>
                <select
                  value={order.status}
                  onChange={(event) => onUpdateStatus(order, event.target.value)}
                  className={`${adminInputClass} h-9 text-xs font-semibold`}
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td className={adminTdClass}>
                <div className="flex justify-end">
                  <button onClick={() => onOpenDetails(order)} className={adminSecondaryButtonClass}>
                    <Eye className="h-4 w-4" /> View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTable>
  );
});
