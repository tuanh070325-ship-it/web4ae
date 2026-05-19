import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { formatUsd } from "../lib/format";
import type { ApiResponse, Order } from "../lib/types";

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-500 text-black",
  PROCESSING: "bg-blue-500 text-white",
  SHIPPED: "bg-blue-500 text-white",
  COMPLETED: "bg-green-500 text-white",
  CANCELLED: "bg-zinc-500 text-white",
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<ApiResponse<Order[]>>("/orders/me/list")
      .then((response) => setOrders(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full bg-[#181a1f] min-h-[calc(100vh-72px)] py-12 px-8 font-sans relative overflow-hidden text-[#a0a5b1]">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000&auto=format&fit=crop")', backgroundSize: 'cover' }}>
      </div>

      <div className="max-w-[1000px] mx-auto relative z-10">
        <h1 className="text-3xl font-black text-[#e63946] tracking-widest mb-10 uppercase">
          Purchase History Table
        </h1>

        {loading && <div className="py-16 text-center">Loading orders...</div>}
        {error && <div className="py-6 text-red-400">{error}</div>}

        {!loading && orders.length === 0 && (
          <div className="bg-[#111216] rounded-xl border border-[#2e333d] p-12 text-center">No orders yet.</div>
        )}

        {orders.length > 0 && (
          <div className="bg-[#111216] rounded-xl overflow-hidden shadow-2xl border border-[#2e333d]">
            <div className="hidden sm:grid sm:grid-cols-5 px-8 py-5 bg-[#0a0a0c] border-b border-[#2e333d] font-bold text-white text-sm">
              <div>ORDER ID</div>
              <div>DATE</div>
              <div>TOTAL PRICE</div>
              <div>STATUS</div>
              <div className="text-right pr-12">ACTION</div>
            </div>

            <div className="divide-y divide-[#24262f]">
              {orders.map((order, i) => (
                <div key={order.id} className={`grid gap-4 px-5 py-5 sm:grid-cols-5 sm:items-center sm:gap-0 sm:px-8 ${i % 2 !== 0 ? 'bg-[#1a1b22]' : 'bg-[#111216]'}`}>
                  <div className="min-w-0">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#6f7480] sm:hidden">ORDER ID</div>
                    <div className="break-words text-white font-medium">#{order.order_code || order.id}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#6f7480] sm:hidden">DATE</div>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#6f7480] sm:hidden">TOTAL PRICE</div>
                    {formatUsd(order.total_amount ?? order.total)}
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6f7480] sm:hidden">STATUS</div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusColor[order.status] || "bg-zinc-500 text-white"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-stretch sm:justify-end sm:gap-3">
                    <button className="w-full whitespace-nowrap px-4 py-2 border border-[#e63946] text-[#e63946] hover:bg-[#e63946]/10 rounded font-bold text-xs tracking-wider transition-colors sm:w-auto sm:py-1.5">
                      VIEW DETAILS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
