import { useEffect, useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { apiGet, apiPut } from "../lib/api";
import { formatUsd } from "../lib/format";
import type { ApiResponse, Order, OrderDetails, OrderStatus } from "../lib/types";
import { AdminPage, AdminTable, adminIconButtonClass, adminInputClass, adminPanelClass, adminSecondaryButtonClass, adminTdClass, adminThClass } from "../components/admin/AdminUI";

const orderStatuses: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];

function orderTotal(order: Order) {
  return order.final_amount ?? order.total_amount ?? order.total ?? 0;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusClass(status: string) {
  if (status === "COMPLETED") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (status === "SHIPPED") return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  if (status === "PROCESSING") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (status === "CANCELLED") return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  return "bg-red-500/15 text-red-300 border-red-500/30";
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    const response = await apiGet<ApiResponse<Order[]>>("/orders");
    setOrders(response.data);
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        [order.order_code, order.receiver_name, order.receiver_phone, order.shipping_city, order.status, order.id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesStatus && matchesKeyword;
    });
  }, [orders, query, statusFilter]);

  const updateOrderStatus = async (order: Order, status: string) => {
    await apiPut(`/orders/${order.id}/status`, { status });
    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status } : item)));
    setSelectedOrder((current) => (current?.id === order.id ? { ...current, status } : current));
    setMessage(`Order ${order.order_code || `#${order.id}`} updated`);
  };

  const openDetails = async (order: Order) => {
    const response = await apiGet<ApiResponse<OrderDetails>>(`/orders/${order.id}`);
    setSelectedOrder(response.data);
  };

  return (
    <AdminPage title="Orders" description="Track fulfillment, inspect order items and update customer order status." message={message}>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders"
            className={`${adminInputClass} w-full pl-9`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={adminInputClass}
        >
          <option value="ALL">All statuses</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

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
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-white/[0.03]">
                <td className={adminTdClass}>
                  <div className="font-mono text-xs text-zinc-400">{order.order_code || `#${order.id}`}</div>
                  <div className={`mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{order.status}</div>
                </td>
                <td className={adminTdClass}>
                  <div className="font-semibold text-white">{order.receiver_name || order.customer || "Guest"}</div>
                  <div className="text-xs text-zinc-500">{order.receiver_phone || order.shipping_city || "No contact"}</div>
                </td>
                <td className={adminTdClass}>{formatDate(order.created_at || order.date)}</td>
                <td className={`${adminTdClass} font-semibold text-white`}>{formatUsd(orderTotal(order))}</td>
                <td className={adminTdClass}>
                  <select
                    value={order.status}
                    onChange={(event) => void updateOrderStatus(order, event.target.value)}
                    className={`${adminInputClass} h-9 text-xs font-semibold`}
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className={adminTdClass}>
                  <div className="flex justify-end">
                    <button onClick={() => void openDetails(order)} className={adminSecondaryButtonClass}>
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-[#16171d] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedOrder.order_code || `Order #${selectedOrder.id}`}</h2>
                <p className="mt-1 text-sm text-zinc-500">{formatDate(selectedOrder.created_at || selectedOrder.date)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className={adminIconButtonClass} aria-label="Close order details">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
              <div className={`${adminPanelClass} p-4`}>
                <div className="text-xs uppercase text-zinc-500">Customer</div>
                <div className="mt-1 font-semibold text-white">{selectedOrder.receiver_name || "N/A"}</div>
                <div className="mt-1 text-zinc-400">{selectedOrder.receiver_phone || "No phone"}</div>
              </div>
              <div className={`${adminPanelClass} p-4`}>
                <div className="text-xs uppercase text-zinc-500">Status</div>
                <select
                  value={selectedOrder.status}
                  onChange={(event) => void updateOrderStatus(selectedOrder, event.target.value)}
                  className={`mt-2 w-full ${adminInputClass}`}
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className={`col-span-2 ${adminPanelClass} p-4`}>
                <div className="text-xs uppercase text-zinc-500">Shipping address</div>
                <div className="mt-1 text-white">
                  {[selectedOrder.shipping_address_line, selectedOrder.shipping_ward, selectedOrder.shipping_district, selectedOrder.shipping_city].filter(Boolean).join(", ") || "N/A"}
                </div>
              </div>
            </div>

            <div className={`mb-6 ${adminPanelClass}`}>
              <div className="border-b border-zinc-800 px-4 py-3 text-sm font-semibold text-white">Items</div>
              <div className="divide-y divide-zinc-800">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <div className="font-semibold text-white">{item.product_name || `Product #${item.product_id}`}</div>
                      <div className="text-xs text-zinc-500">{formatUsd(item.price)} x {item.quantity}</div>
                    </div>
                    <div className="font-semibold text-white">{formatUsd(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${adminPanelClass} space-y-2 p-4 text-sm`}>
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatUsd(selectedOrder.subtotal_amount ?? 0)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Shipping</span>
                <span>{formatUsd(selectedOrder.shipping_fee ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-bold text-white">
                <span>Total</span>
                <span>{formatUsd(orderTotal(selectedOrder))}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AdminPage>
  );
}
