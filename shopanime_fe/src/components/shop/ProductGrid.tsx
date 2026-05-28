import { memo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { getProductDiscountPercent, getProductImage, getProductPath, hasProductDiscount, toNumber, useProductPlaceholderImage } from '../../lib/format';
import type { Product } from '../../lib/types';
import { trackEvent } from '../../lib/analytics';
import { ProductDealPrice } from '../ui/ProductDealPrice';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: number) => void;
  source?: string;
}

export const ProductGrid = memo(function ProductGrid({ products, onAddToCart, source = 'shop_grid' }: ProductGridProps) {
  const trackedImpressions = useRef(new Set<number>());

  useEffect(() => {
    products.forEach((product, index) => {
      if (trackedImpressions.current.has(product.id)) {return;}
      trackedImpressions.current.add(product.id);
      trackEvent('product_impression', { source, position: index + 1 }, { productId: product.id });
    });
  }, [products, source]);

  const trackProductClick = (product: Product, position: number) => {
    trackEvent('product_click', { source, position }, { productId: product.id });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((product, index) => (
        <div key={product.id} className="group relative overflow-hidden rounded-xl border border-[#2e333d] bg-[#242730] transition-all duration-300 hover:-translate-y-1 hover:border-[#5ea5c8] hover:shadow-[0_0_22px_rgba(94,165,200,0.35)]">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#ff315a]/18 to-transparent" />
            <motion.div
              animate={{ x: ['-120%', '160%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-0 h-full w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
          </div>
          <div className="relative aspect-[3/4] p-3 pb-0">
            <img
              src={getProductImage(product)}
              onError={useProductPlaceholderImage}
              alt={product.name}
              className="w-full h-full object-cover rounded-md block"
            />
            {hasProductDiscount(product) && (
              <motion.div
                animate={{ scale: [1, 1.07, 1], rotate: [-3, 2, -3] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-5 top-5 z-20 rounded bg-[#ff315a] px-3 py-2 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_22px_rgba(255,49,90,0.62)]"
              >
                -{getProductDiscountPercent(product)}%
                <span className="ml-1 text-[10px]">OFF</span>
              </motion.div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-10 mx-3 mb-0 mt-3 rounded-md">
              <button onClick={() => onAddToCart(product.id)} className="w-3/4 py-2 bg-[#181a1f]/80 backdrop-blur-sm border border-[#5ea5c8] rounded text-white text-sm font-medium hover:bg-[#5ea5c8] hover:text-[#181a1f] transition-colors shadow-[0_0_10px_rgba(94,165,200,0.5)]">
                Add to Cart
              </button>
              <Link onClick={() => trackProductClick(product, index + 1)} to={getProductPath(product)} className="w-3/4 py-2 bg-[#181a1f]/80 backdrop-blur-sm border border-[#5ea5c8] rounded text-white text-sm font-medium hover:bg-[#5ea5c8] hover:text-[#181a1f] transition-colors shadow-[0_0_10px_rgba(94,165,200,0.5)] text-center">
                Quick View
              </Link>
            </div>
          </div>

          <div className="relative p-4 pt-3 flex flex-col">
            <Link onClick={() => trackProductClick(product, index + 1)} to={getProductPath(product)} className="hover:text-[#5ea5c8] transition-colors">
              <h3 className="line-clamp-1 text-[15px] font-bold text-white mb-3">
                {product.name}
              </h3>
            </Link>
            <div className="flex items-end justify-between gap-3 mt-auto">
              <ProductDealPrice product={product} compact />
              <div className="flex items-center gap-1 text-[#f5a623] text-sm font-medium">
                <Star className="w-4 h-4 fill-[#f5a623]" />
                {toNumber(product.review_count) > 0 ? toNumber(product.average_rating).toFixed(1) : 'New'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
