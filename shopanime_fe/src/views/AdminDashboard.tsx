import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp } from 'lucide-react';
import { apiGet } from '../lib/api';
import { formatUsd, toNumber } from '../lib/format';
import type { ApiResponse, Category, Order, PaginatedApiResponse, Product, User } from '../lib/types';
import { AdminPage, AdminPanel, adminInputClass, adminPrimaryButtonClass, adminTdClass, adminThClass } from '../components/admin/AdminUI';

function formatDate(value?: string | null) {
  if (!value) {return 'N/A';}
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function orderTotal(order: Order) {
  return order.final_amount ?? order.total_amount ?? order.total ?? 0;
}

function statusClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'DELIVERED') {
    return 'border-emerald-500/40 bg-emerald-500 text-black';
  }
  if (normalized === 'PROCESSING' || normalized === 'SHIPPED') {
    return 'border-yellow-400/40 bg-yellow-400 text-black';
  }
  if (normalized === 'CANCELLED' || normalized === 'RETURNED') {
    return 'border-zinc-300/40 bg-zinc-300 text-black';
  }
  return 'border-red-500/40 bg-red-500 text-white';
}

export function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void Promise.all([
      apiGet<PaginatedApiResponse<Product[]>>('/products?limit=1').then((response) => {
        setProducts(response.data);
        setProductTotal(response.meta.total);
      }),
      apiGet<ApiResponse<Order[]>>('/orders').then((response) => setOrders(response.data)),
      apiGet<ApiResponse<User[]>>('/users').then((response) => setUsers(response.data)),
      apiGet<ApiResponse<Category[]>>('/categories').then((response) => setCategories(response.data)),
    ]);
  }, []);

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + toNumber(orderTotal(order)), 0),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const recentOrders = orders.slice(0, 8);
    if (!keyword) {return recentOrders;}
    return recentOrders.filter((order) =>
      [order.order_code, order.receiver_name, order.customer, order.status, order.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [orders, query]);

  const cards = [
    { label: 'Total Revenue', value: formatUsd(revenue), accent: true },
    { label: 'Total Orders', value: String(orders.length) },
    { label: 'Total Users', value: String(users.length) },
    { label: 'Total Products', value: String(productTotal || products.length || categories.length) },
  ];

  return (
    <AdminPage title="Dashboard">
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded border border-[#343d43] bg-[#171d21] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.24)]"
          >
            <div className="text-sm font-bold text-zinc-300">{card.label}</div>
            <div className="mt-1 text-2xl font-black leading-tight text-white">{card.value}</div>
            {card.accent && <TrendingUp className="absolute right-4 top-4 h-4 w-4 text-zinc-300" />}
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#d33a3a]" />
          </div>
        ))}
      </div>

      <AdminPanel>
        <div className="flex h-12 items-center justify-between border-b border-[#343d43] px-4">
          <h2 className="text-base font-bold text-white">Recent Orders</h2>
          <div className="relative w-full max-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className={`${adminInputClass} h-8 pl-8`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#343d43] text-zinc-200">
              <tr>
                <th className={adminThClass}>Order ID</th>
                <th className={adminThClass}>Customer</th>
                <th className={adminThClass}>Date</th>
                <th className={adminThClass}>Amount</th>
                <th className={adminThClass}>Status</th>
                <th className={`${adminThClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343d43]">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="text-zinc-200 hover:bg-white/[0.03]">
                  <td className={`${adminTdClass} font-mono`}>#{order.order_code || order.id}</td>
                  <td className={adminTdClass}>{order.receiver_name || order.customer || 'N/A'}</td>
                  <td className={adminTdClass}>{formatDate(order.created_at || order.date)}</td>
                  <td className={adminTdClass}>{formatUsd(orderTotal(order))}</td>
                  <td className={adminTdClass}>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${statusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className={`${adminTdClass} text-right`}>
                    <Link
                      to="/admin/orders"
                      className={`${adminPrimaryButtonClass} h-8 px-3`}
                    >
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-zinc-500" colSpan={6}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
