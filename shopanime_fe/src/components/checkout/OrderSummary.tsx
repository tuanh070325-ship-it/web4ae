import { memo } from 'react';
import { formatShippingFee, formatUsd, getProductDiscountAmount, getProductFinalPrice, getProductFinalShippingFee, getProductImage, getProductOriginalPrice, getProductShippingDiscountAmount, getProductShippingFee, hasProductDiscount, useProductPlaceholderImage } from '../../lib/format';
import type { CartItem, Product } from '../../lib/types';

interface BuyNowCheckoutItem extends Product {
  cart_item_id: number;
  quantity: number;
}

interface OrderSummaryProps {
  items: Array<CartItem | BuyNowCheckoutItem>;
  error: string | null;
  submitting: boolean;
}

export const OrderSummary = memo(function OrderSummary({ items, error, submitting }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + getProductFinalPrice(item) * item.quantity, 0);
  const productSavings = items.reduce((sum, item) => sum + getProductDiscountAmount(item) * item.quantity, 0);
  const originalShipping = items.reduce((sum, item) => sum + getProductShippingFee(item), 0);
  const shipping = items.reduce((sum, item) => sum + getProductFinalShippingFee(item), 0);
  const shippingSavings = items.reduce((sum, item) => sum + getProductShippingDiscountAmount(item), 0);
  const total = subtotal + shipping;

  return (
    <div className="w-full lg:w-[400px]">
      <div className="bg-[#1a1b22] px-6 py-8 rounded-2xl border border-[#2e333d]">
        <h2 className="text-[20px] text-white font-medium mb-6">Order Review</h2>
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div key={item.cart_item_id} className="flex items-center gap-4">
              <div className="w-14 h-16 bg-white rounded overflow-hidden flex items-center justify-center">
                <img src={getProductImage(item)} onError={useProductPlaceholderImage} alt={item.name} className="object-contain w-full h-full p-1" />
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
          {shippingSavings > 0 && (
            <div className="flex justify-between text-[#9bdcff]">
              <span>Shipping saved:</span>
              <span>-{formatUsd(shippingSavings)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#a0a5b1]">Shipping:</span>
            <span>
              {shippingSavings > 0 && originalShipping > shipping && (
                <span className="mr-2 text-zinc-600 line-through">{formatUsd(originalShipping)}</span>
              )}
              <span className={shipping <= 0 && items.length > 0 ? 'font-black uppercase text-[#9bdcff]' : ''}>
                {items.length ? formatShippingFee(shipping) : formatUsd(0)}
              </span>
            </span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2 pt-2"><span>Total:</span><span>{formatUsd(total)}</span></div>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button disabled={submitting || items.length === 0} className="w-full bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors text-[15px]">
          {submitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
});
