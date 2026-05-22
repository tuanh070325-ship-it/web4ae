import type { FormEvent} from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import type { ApiMutationResponse, ApiResponse, CartItem, Product } from '../lib/types';
import { OrderSummary } from '../components/checkout/OrderSummary';

const BUY_NOW_CHECKOUT_KEY = 'akibacore.buyNowCheckout';

interface BuyNowCheckoutItem extends Product {
  cart_item_id: number;
  quantity: number;
}

export function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowCheckoutItem | null>(null);
  const [form, setForm] = useState({
    receiver_name: '',
    receiver_phone: '',
    shipping_address_line: '',
    shipping_ward: '',
    shipping_district: '',
    shipping_city: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isBuyNowCheckout = new URLSearchParams(location.search).get('buyNow') === '1';
  const checkoutItems = buyNowItem ? [buyNowItem] : items;

  useEffect(() => {
    if (isBuyNowCheckout) {
      const storedBuyNow = sessionStorage.getItem(BUY_NOW_CHECKOUT_KEY);
      if (!storedBuyNow) {
        setError('Buy now item is no longer available. Please choose the product again.');
        setBuyNowItem(null);
        return;
      }

      try {
        const parsed = JSON.parse(storedBuyNow) as { product?: Product; quantity?: number };
        if (!parsed.product?.id) {
          throw new Error('Invalid buy now item');
        }
        setBuyNowItem({
          ...parsed.product,
          cart_item_id: parsed.product.id,
          quantity: Math.max(1, Number(parsed.quantity || 1)),
        });
      } catch {
        sessionStorage.removeItem(BUY_NOW_CHECKOUT_KEY);
        setError('Buy now item is invalid. Please choose the product again.');
        setBuyNowItem(null);
      }
      return;
    }

    setBuyNowItem(null);
    apiGet<ApiResponse<CartItem[]>>('/cart')
      .then((response) => setItems(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load cart'));
  }, [isBuyNowCheckout]);

  const updateField = useCallback((name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  }, []);

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await apiPost<ApiMutationResponse<{ orderId: number }>>('/orders/checkout', {
        ...form,
        shipping_method: 'STANDARD',
        items: buyNowItem ? [{ product_id: buyNowItem.id, quantity: buyNowItem.quantity }] : undefined,
      });
      if (buyNowItem) {
        sessionStorage.removeItem(BUY_NOW_CHECKOUT_KEY);
      } else {
        window.dispatchEvent(new Event('akibacore:cart-updated'));
      }
      navigate('/orders', { replace: true, state: { orderId: response.data?.orderId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order');
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
                  <input required value={form.receiver_name} onChange={(event) => updateField('receiver_name', event.target.value)} type="text" placeholder="Full Name" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  <input required value={form.receiver_phone} onChange={(event) => updateField('receiver_phone', event.target.value)} type="tel" placeholder="Phone Number" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  <input required value={form.shipping_address_line} onChange={(event) => updateField('shipping_address_line', event.target.value)} type="text" placeholder="Address Line" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input value={form.shipping_ward} onChange={(event) => updateField('shipping_ward', event.target.value)} type="text" placeholder="Ward" className="w-full bg-[#24262f] border border-[#2e333d] rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                    <input value={form.shipping_district} onChange={(event) => updateField('shipping_district', event.target.value)} type="text" placeholder="District" className="w-full bg-[#24262f] border border-[#2e333d] rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                    <input required value={form.shipping_city} onChange={(event) => updateField('shipping_city', event.target.value)} type="text" placeholder="City" className="w-full bg-[#24262f] border border-red-500/60 rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
                  </div>
                  <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Delivery notes" className="w-full min-h-24 bg-[#24262f] border border-[#2e333d] rounded-md px-4 py-3 text-white focus:outline-none placeholder-[#5e6677] transition-all" />
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

          <OrderSummary items={checkoutItems} error={error} submitting={submitting} />
        </div>
      </div>
    </form>
  );
}
