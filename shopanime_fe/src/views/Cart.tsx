import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { apiDelete, apiGet, apiPut } from '../lib/api';
import { formatShippingFee, formatUsd, getProductDiscountAmount, getProductFinalPrice, getProductFinalShippingFee, getProductImage, getProductOriginalPrice, getProductPath, getProductShippingDiscountAmount, getProductShippingFee, hasProductDiscount } from '../lib/format';
import type { ApiResponse, CartItem } from '../lib/types';

const VAT_RATE = 0.1;

export function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<ApiResponse<CartItem[]>>('/cart');
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + getProductFinalPrice(item) * item.quantity, 0),
    [items],
  );
  const productSavings = useMemo(
    () => items.reduce((sum, item) => sum + getProductDiscountAmount(item) * item.quantity, 0),
    [items],
  );
  const originalShipping = useMemo(
    () => items.reduce((sum, item) => sum + getProductShippingFee(item), 0),
    [items],
  );
  const shipping = useMemo(
    () => items.reduce((sum, item) => sum + getProductFinalShippingFee(item), 0),
    [items],
  );
  const shippingSavings = useMemo(
    () => items.reduce((sum, item) => sum + getProductShippingDiscountAmount(item), 0),
    [items],
  );
  const vat = subtotal * VAT_RATE;
  const total = subtotal + shipping + vat;

  const updateQuantity = useCallback(async (item: CartItem, quantity: number) => {
    const nextQuantity = Math.max(1, quantity);
    setItems((current) => current.map((currentItem) => (
      currentItem.cart_item_id === item.cart_item_id ? { ...currentItem, quantity: nextQuantity } : currentItem
    )));
    try {
      await apiPut(`/cart/items/${item.id}`, { quantity: nextQuantity });
      window.dispatchEvent(new Event('akibacore:cart-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update cart');
      await loadCart();
    }
  }, [loadCart]);

  const removeItem = useCallback(async (item: CartItem) => {
    const previousItems = items;
    setItems((current) => current.filter((currentItem) => currentItem.cart_item_id !== item.cart_item_id));
    try {
      await apiDelete(`/cart/items/${item.id}`);
      window.dispatchEvent(new Event('akibacore:cart-updated'));
    } catch (err) {
      setItems(previousItems);
      setError(err instanceof Error ? err.message : 'Unable to update cart');
    }
  }, [items]);

  return (
    <div className="w-full bg-[#181a1f] min-h-[calc(100vh-72px)] text-[#a0a5b1]">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-72px)]">
        <div className="flex-1 bg-white text-zinc-900 px-8 py-12 lg:px-16">
          <h1 className="text-[26px] font-bold mb-10 text-black">Shopping Cart Summary ({items.length} Items)</h1>

          {loading && <div className="py-16 text-center text-zinc-500">Loading cart...</div>}
          {error && <div className="py-6 text-red-600">{error}</div>}
          {!loading && items.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-zinc-500 mb-6">Your cart is empty.</p>
              <Link to="/shop" className="inline-flex bg-black text-white px-6 py-3 rounded font-bold">Continue Shopping</Link>
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="hidden md:grid grid-cols-[100px_1fr_120px_120px_50px] gap-6 text-sm font-bold text-black border-b border-zinc-200 pb-4 mb-6">
                <span>Image</span>
                <span>Title</span>
                <span>Unit Price</span>
                <span>Quantity</span>
                <span></span>
              </div>

              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.cart_item_id} className="grid md:grid-cols-[100px_1fr_120px_120px_50px] gap-6 items-center border-b border-zinc-200 pb-6">
                    <div className="w-24 h-32 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={getProductImage(item)} alt={item.name} className="max-w-full max-h-full object-contain" />
                    </div>

                    <div className="flex-1 pr-6">
                      <Link to={getProductPath(item)} className="font-semibold text-[15px] leading-tight text-black hover:text-red-600">{item.name}</Link>
                    </div>

                    <div className="font-bold text-black text-[15px]">
                      <div>{formatUsd(getProductFinalPrice(item))}</div>
                      {hasProductDiscount(item) && (
                        <div className="mt-1 text-xs font-semibold text-red-600">
                          <span className="text-zinc-400 line-through">{formatUsd(getProductOriginalPrice(item))}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center border border-zinc-300 rounded">
                        <button onClick={() => void updateQuantity(item, item.quantity - 1)} className="px-3 py-1.5 text-zinc-500 hover:text-black transition-colors">-</button>
                        <span className="w-8 text-center font-semibold text-black text-sm">{item.quantity}</span>
                        <button onClick={() => void updateQuantity(item, item.quantity + 1)} className="px-3 py-1.5 text-zinc-500 hover:text-black transition-colors">+</button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => void removeItem(item)} className="text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-full lg:w-[420px] bg-[#181a1f] px-8 py-12 lg:px-10 flex flex-col justify-between border-l border-[#2e333d]">
          <div className="space-y-8">
            <h2 className="text-[26px] text-white font-bold tracking-wide">Order Summary</h2>

            <div className="space-y-4 text-[15px]">
              <div className="flex justify-between items-center text-white">
                <span className="font-medium text-white">Subtotal</span>
                <span className="font-bold">{formatUsd(subtotal)}</span>
              </div>
              {productSavings > 0 && (
                <div className="flex justify-between items-center text-[#ff8aa0]">
                  <span className="font-medium">Manga drop saved</span>
                  <span className="font-bold">-{formatUsd(productSavings)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white">
                <span className="font-medium text-white">Shipping</span>
                <span className="font-bold">
                  {shippingSavings > 0 && originalShipping > shipping && (
                    <span className="mr-2 text-sm text-zinc-500 line-through">{formatUsd(originalShipping)}</span>
                  )}
                  <span className={shipping <= 0 && items.length > 0 ? 'uppercase text-[#9bdcff]' : ''}>
                    {items.length ? formatShippingFee(shipping) : formatUsd(0)}
                  </span>
                </span>
              </div>
              {shippingSavings > 0 && (
                <div className="flex justify-between items-center text-[#9bdcff]">
                  <span className="font-medium">Shipping saved</span>
                  <span className="font-bold">-{formatUsd(shippingSavings)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white">
                <span className="font-medium text-white">VAT (10%)</span>
                <span className="font-bold">{formatUsd(vat)}</span>
              </div>
              <div className="flex justify-between items-center text-white border-t border-[#2e333d] pt-4">
                <span className="font-bold text-white">Total</span>
                <span className="font-black text-xl">{formatUsd(total)}</span>
              </div>
            </div>

            <Link to="/checkout" className={`w-full font-bold py-3.5 px-4 rounded transition-colors mt-8 text-[15px] text-center block ${items.length ? 'bg-[#cc2936] hover:bg-[#b0222e] text-white' : 'bg-zinc-800 text-zinc-500 pointer-events-none'}`}>
              Proceed to Checkout
            </Link>

            <p className="text-[13px] text-[#4a5568] pt-2">
              We accept: Visa, MasterCard, PayPal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
