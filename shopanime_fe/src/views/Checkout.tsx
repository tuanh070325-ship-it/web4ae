import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import { formatUsd, getProductDiscountAmount, getProductFinalPrice, getProductImage, getProductOriginalPrice, hasProductDiscount } from "../lib/format";
import type { ApiMutationResponse, ApiResponse, CartItem } from "../lib/types";

const SHIPPING_FEE = 15;

export function Checkout() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    receiver_name: "",
    receiver_phone: "",
    shipping_address_line: "",
    shipping_ward: "",
    shipping_district: "",
    shipping_city: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<ApiResponse<CartItem[]>>("/cart")
      .then((response) => setItems(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load cart"));
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + getProductFinalPrice(item) * item.quantity, 0),
    [items],
  );
  const productSavings = useMemo(
    () => items.reduce((sum, item) => sum + getProductDiscountAmount(item) * item.quantity, 0),
    [items],
  );
  const total = subtotal + (items.length ? SHIPPING_FEE : 0);

  const updateField = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await apiPost<ApiMutationResponse<{ orderId: number }>>("/orders/checkout", {
        ...form,
        shipping_method: "STANDARD",
      });
      navigate("/orders", { replace: true, state: { orderId: response.data?.orderId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={placeOrder} className="w-full bg-[#111216] min-h-screen text-[#a0a5b1] font-sans pb-20">
      <div className="pt-8 pb-10 px-8 mx-auto max-w-[1200px]">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-3xl font-black text-[#e63946]">Akiba</span>
          <span className="text-2xl font-bold tracking-tight text-white ml-2">Core Checkout</span>
        </div>

        <div className="flex bg-[#1a1b22] p-1.5 rounded-full mb-12">
          <div className="flex-1 text-center py-2.5 rounded-full bg-transparent border border-red-500 shadow-[0_0_15px_rgba(230,57,70,0.4)] text-white text-sm font-medium">
            Shipping Information
          </div>
          <div className="flex-1 text-center py-2.5 text-[#5e6677] text-sm font-medium">Payment Method</div>
          <div className="flex-1 text-center py-2.5 text-[#5e6677] text-sm font-medium">Order Confirmation</div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-2xl font-medium text-white mb-6">Shipping Information</h2>
              <div className="bg-[#1a1b22] p-8 rounded-xl border border-[#2e333d]">
                <div className="space-y-4">
                  <input required value={form.receiver_name} onChange={(event) => updateField("receiver_name", event.target.value)} type="text" placeholder="Full Name" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  <input required value={form.receiver_phone} onChange={(event) => updateField("receiver_phone", event.target.value)} type="tel" placeholder="Phone Number" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  <input required value={form.shipping_address_line} onChange={(event) => updateField("shipping_address_line", event.target.value)} type="text" placeholder="Address Line" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input value={form.shipping_ward} onChange={(event) => updateField("shipping_ward", event.target.value)} type="text" placeholder="Ward" className="w-full bg-[#24262f] border border-[#2e333d] rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                    <input value={form.shipping_district} onChange={(event) => updateField("shipping_district", event.target.value)} type="text" placeholder="District" className="w-full bg-[#24262f] border border-[#2e333d] rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                    <input required value={form.shipping_city} onChange={(event) => updateField("shipping_city", event.target.value)} type="text" placeholder="City" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  </div>
                  <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Delivery notes" className="w-full min-h-24 bg-[#24262f] border border-[#2e333d] rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-medium text-[#5e6677] mb-6">Payment Method</h2>
              <div className="bg-[#1a1b22] p-8 rounded-xl border border-[#2e333d]">
                <label className="inline-flex items-center gap-4 cursor-pointer group">
                  <div className="w-4 h-4 rounded-full border border-red-500 flex justify-center items-center shadow-[0_0_8px_rgba(230,57,70,0.5)]">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <div className="bg-white rounded-lg p-3 w-16 h-12 flex items-center justify-center">
                    <CreditCard className="text-black" />
                  </div>
                  <span className="text-sm font-medium text-white">Cash on Delivery / Manual Payment</span>
                </label>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[400px]">
            <div className="bg-[#1a1b22] px-6 py-8 rounded-2xl border border-[#2e333d]">
              <h2 className="text-[20px] text-white font-medium mb-6">Order Review</h2>
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item.cart_item_id} className="flex items-center gap-4">
                    <div className="w-14 h-16 bg-white rounded overflow-hidden flex items-center justify-center">
                      <img src={getProductImage(item)} alt={item.name} className="object-contain w-full h-full p-1" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-white line-clamp-1">{item.name}</span>
                      <div className="mt-1 text-xs text-zinc-500">
                        {formatUsd(getProductFinalPrice(item))}
                        {hasProductDiscount(item) && (
                          <span className="ml-2 text-zinc-600 line-through">{formatUsd(getProductOriginalPrice(item))}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-white">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-[14px] text-white border-t border-[#3a3f4e] pt-6 mb-6">
                <div className="flex justify-between"><span className="text-[#a0a5b1]">Subtotal:</span><span>{formatUsd(subtotal)}</span></div>
                {productSavings > 0 && (
                  <div className="flex justify-between text-[#ff8aa0]"><span>Manga drop saved:</span><span>-{formatUsd(productSavings)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-[#a0a5b1]">Shipping:</span><span>{formatUsd(items.length ? SHIPPING_FEE : 0)}</span></div>
                <div className="flex justify-between font-bold text-base mt-2 pt-2"><span>Total:</span><span>{formatUsd(total)}</span></div>
              </div>

              {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
              <button disabled={submitting || items.length === 0} className="w-full bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors text-[15px]">
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
