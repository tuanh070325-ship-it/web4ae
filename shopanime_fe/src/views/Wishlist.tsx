import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { apiDelete, apiGet, apiPost } from '../lib/api';
import { formatUsd, getProductAuthor, getProductDiscountPercent, getProductFinalPrice, getProductImage, getProductOriginalPrice, getProductPath, hasProductDiscount, useProductPlaceholderImage } from '../lib/format';
import type { ApiResponse, WishlistItem } from '../lib/types';

export function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<ApiResponse<WishlistItem[]>>('/wishlist');
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist();
  }, []);

  const removeItem = async (productId: number) => {
    await apiDelete(`/wishlist/${productId}`);
    window.dispatchEvent(new Event('akibacore:wishlist-updated'));
    await loadWishlist();
  };

  const moveToCart = async (productId: number) => {
    await apiPost(`/wishlist/${productId}/move-to-cart`);
    window.dispatchEvent(new Event('akibacore:cart-updated'));
    window.dispatchEvent(new Event('akibacore:wishlist-updated'));
    await loadWishlist();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 text-white">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Wishlist ({items.length} Items)</h1>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-sm">Sort by</span>
          <select className="bg-transparent border border-zinc-700 text-white rounded-md px-3 py-1.5 outline-none focus:border-zinc-500">
            <option>Default</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading && <div className="py-16 text-center text-zinc-500">Loading wishlist...</div>}
      {error && <div className="py-6 text-red-400">{error}</div>}
      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-[#1e1e24]/30 p-12 text-center">
          <p className="mb-6 text-zinc-400">Your wishlist is empty.</p>
          <Link to="/shop" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-5 rounded-md transition-colors">
            Browse Products
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 border border-zinc-800 rounded-lg p-8 bg-[#1e1e24]/30 backdrop-blur-sm shadow-xl">
          {items.map((item) => (
            <div key={item.wishlist_item_id} className="flex items-center gap-6 pb-8 border-zinc-800">
              <Link to={getProductPath(item)} className="w-28 h-40 flex-shrink-0 bg-white/5 rounded-md overflow-hidden border border-zinc-800">
                <img src={getProductImage(item)} onError={useProductPlaceholderImage} alt={item.name} className="w-full h-full object-cover" />
              </Link>

              <div className="flex flex-col flex-1 h-full py-1">
                <Link to={getProductPath(item)} className="font-bold text-lg leading-tight line-clamp-2 hover:text-red-500">{item.name}</Link>
                <p className="text-zinc-400 text-sm mt-1">by {getProductAuthor(item)}</p>
                <div className="mt-2 font-bold text-lg mb-auto">
                  <div>{formatUsd(getProductFinalPrice(item))}</div>
                  {hasProductDiscount(item) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-zinc-500 line-through">{formatUsd(getProductOriginalPrice(item))}</span>
                      <span className="rounded bg-red-600 px-2 py-0.5 font-black uppercase text-white">-{getProductDiscountPercent(item)}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button onClick={() => void moveToCart(item.id)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-md transition-colors text-sm">
                    Move to Cart
                  </button>
                  <button onClick={() => void removeItem(item.id)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
