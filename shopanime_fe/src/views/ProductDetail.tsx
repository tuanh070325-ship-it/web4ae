import type { FormEvent} from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, CalendarDays, Check, ChevronRight, Heart, PackageCheck, RotateCcw, Share2, ShieldCheck, ShoppingCart, Sparkles, Star, Truck, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { apiGet, apiPost } from '../lib/api';
import { formatShippingFee, formatUsd, getProductAuthor, getProductDiscountAmount, getProductDiscountPercent, getProductFinalPrice, getProductFinalShippingFee, getProductImage, getProductOriginalPrice, getProductShippingDiscountPercent, getProductShippingFee, hasProductDiscount, toNumber, useProductPlaceholderImage } from '../lib/format';
import type { ApiMutationResponse, ApiResponse, Product, Review } from '../lib/types';
import { useAuth } from '../components/auth/AuthProvider';

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(value) ? 'fill-[#f5a623] text-[#f5a623]' : 'text-zinc-700'}`}
        />
      ))}
    </span>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const productId = product?.id;

  useEffect(() => {
    setLoading(true);
    if (!slug) {
      setProduct(null);
      setLoading(false);
      return;
    }

    apiGet<ApiResponse<Product>>(`/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (data.data) {
          setProduct(data.data);
        }
      })
      .catch((err) => console.error('Error fetching product:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!productId) {return;}
    apiGet<ApiResponse<Review[]>>(`/reviews/${productId}`)
      .then((response) => setReviews(response.data))
      .catch(() => setReviews([]));
  }, [productId]);

  const reviewAverage = useMemo(() => {
    if (reviews.length === 0) {return toNumber(product?.average_rating);}
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [product?.average_rating, reviews]);
  const reviewCount = reviews.length || Number(product?.review_count || 0);
  const catalogCode = product ? product.isbn || product.sku || `AKIBA-${String(product.id).padStart(5, '0')}` : '';

  const requireLogin = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!product || !requireLogin()) {return;}
    setMessage(null);
    await apiPost<ApiMutationResponse>('/cart/items', { product_id: product.id, quantity });
    window.dispatchEvent(new Event('akibacore:cart-updated'));
    setAdded(true);
    setMessage('Added to cart');
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = async () => {
    if (!product || !requireLogin()) {return;}
    if (product.stock_quantity === 0) {return;}
    setBuying(true);
    setMessage(null);
    try {
      sessionStorage.setItem(
        'akibacore.buyNowCheckout',
        JSON.stringify({
          product,
          quantity,
        }),
      );
      navigate('/checkout?buyNow=1');
    } finally {
      setBuying(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product || !requireLogin()) {return;}
    setMessage(null);
    await apiPost<ApiMutationResponse>('/wishlist', { product_id: product.id });
    window.dispatchEvent(new Event('akibacore:wishlist-updated'));
    setMessage('Added to wishlist');
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || !requireLogin()) {return;}
    await apiPost<ApiMutationResponse>('/reviews', {
      product_id: product.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
    setReviewForm({ rating: 5, comment: '' });
    const response = await apiGet<ApiResponse<Review[]>>(`/reviews/${product.id}`);
    setReviews(response.data);
    const productResponse = await apiGet<ApiResponse<Product>>(`/products/${encodeURIComponent(product.slug || String(product.id))}`);
    setProduct(productResponse.data);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full justify-center bg-black py-32 text-zinc-400">
        <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-red-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black px-4 py-32 text-center text-white">
        <h2 className="mb-4 text-4xl font-black uppercase">Product not found</h2>
        <Link to="/shop" className="font-bold uppercase text-red-500 underline hover:text-red-400">Return to Shop</Link>
      </div>
    );
  }

  const finalPrice = getProductFinalPrice(product);
  const originalPrice = getProductOriginalPrice(product);
  const discountPercent = getProductDiscountPercent(product);
  const discountAmount = getProductDiscountAmount(product);
  const isDiscounted = hasProductDiscount(product);
  const shippingFee = getProductShippingFee(product);
  const finalShippingFee = getProductFinalShippingFee(product);
  const shippingDiscountPercent = getProductShippingDiscountPercent(product);
  const shippingSavings = Math.max(0, shippingFee - finalShippingFee);
  const hasFreeShipping = finalShippingFee <= 0;
  const externalRatingCount = Number(product.external_rating_count || 0);
  const description = product.description || 'No description available for this volume.';
  const canExpandDescription = description.length > 260;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <img src={getProductImage(product)} onError={useProductPlaceholderImage} alt="" className="h-full w-full scale-110 object-cover opacity-10 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(230,57,70,0.35),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(94,165,200,0.2),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.55),#000_72%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex items-center border-b border-zinc-800 pb-4 text-xs font-black uppercase tracking-widest text-zinc-500">
          <Link to="/" className="hover:text-red-500">Home</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <Link to="/shop" className="hover:text-red-500">Shop</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="truncate text-white">{product.name}</span>
        </div>

        <section className="grid gap-10 lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.28fr)] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 35, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            className="relative mx-auto w-full max-w-[520px]"
          >
            <div className="absolute -inset-8 bg-red-600/20 blur-3xl" />
            <motion.div
              whileHover={{ scale: 1.025, rotateY: 6, rotateX: 2 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              className="relative aspect-[4/5] overflow-hidden rounded border border-[#2e333d] bg-zinc-950 shadow-[16px_16px_0_0_rgba(230,57,70,0.95),0_40px_90px_rgba(0,0,0,0.65)] transform-gpu"
            >
              <img src={getProductImage(product)} onError={useProductPlaceholderImage} alt={product.name} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent" />
              {isDiscounted && (
                <div className="absolute right-4 top-4 bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.7)]">
                  -{discountPercent}% Drop
                </div>
              )}
            </motion.div>

            <div className="mt-6 grid grid-cols-5 gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className={`aspect-square overflow-hidden rounded border bg-white/5 ${index === 0 ? 'border-[#e63946] shadow-[0_0_18px_rgba(230,57,70,0.35)]' : 'border-[#2e333d] opacity-55'}`}>
                  <img src={getProductImage(product)} onError={useProductPlaceholderImage} alt="" className={`h-full w-full object-cover ${index === 0 ? '' : 'grayscale'}`} />
                </div>
              ))}
              <div className="flex aspect-square items-center justify-center rounded border border-[#2e333d] bg-white/[0.04] text-sm font-black text-white">+12</div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-400 sm:grid-cols-4">
              {[
                ['Format', product.book_format || 'Paperback'],
                ['Publisher', product.publisher_name || 'Catalog'],
                ['Stock', product.stock_quantity > 0 ? `${product.stock_quantity} ready` : 'Out'],
                ['Code', catalogCode],
              ].map(([label, value]) => (
                <div key={label} className="rounded border border-[#2e333d] bg-black/30 p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{label}</div>
                  <div className="mt-1 line-clamp-2 text-xs font-bold uppercase text-white">{value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 45 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 95, delay: 0.1 }}
            className="relative"
          >
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-widest">
              <span className="inline-flex items-center gap-2 rounded border border-[#e63946]/50 bg-[#e63946] px-3 py-1.5 text-white">
                <Zap className="h-3.5 w-3.5" /> Trending Volume
              </span>
              <span className="text-zinc-500">{product.category_name || 'Manga'}</span>
              <span className="text-red-500">{getProductAuthor(product)}</span>
            </div>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-400">
              <span>By <span className="text-[#e63946]">{getProductAuthor(product)}</span></span>
              <span className="h-4 w-px bg-zinc-800" />
              <span>Vol. <span className="text-white">{product.volume_number || 'Launch'}</span></span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5 border-y border-zinc-800 py-4">
              <div className="flex items-center gap-2">
                <RatingStars value={reviewAverage} />
                <span className="text-lg font-black text-[#f5a623]">{reviewCount > 0 ? reviewAverage.toFixed(1) : 'New'}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {reviewCount > 0 ? `${reviewCount} reviews` : 'No reviews yet'}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-800" />
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">
                <span className="text-white">{externalRatingCount.toLocaleString()}</span> readers
              </div>
            </div>

            <div className="mt-6 max-w-3xl">
              <p className={`text-base font-semibold leading-7 text-zinc-300 ${descriptionExpanded ? '' : 'line-clamp-4'}`}>
                {description}
              </p>
              {canExpandDescription && (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                  className="mt-3 text-sm font-black uppercase tracking-widest text-[#e63946] transition-colors hover:text-[#ff8aa0]"
                >
                  {descriptionExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            <div className="mt-6 overflow-hidden rounded border border-[#2e333d] bg-[#15171d]/95 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="grid gap-px bg-[#2e333d] lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.82fr)]">
                <div className="flex flex-col justify-between gap-5 bg-[linear-gradient(135deg,rgba(230,57,70,0.12),rgba(0,0,0,0.88))] p-6">
                  <div>
                    <div className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">Product Price</div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-5xl font-black leading-none text-white">{formatUsd(finalPrice)}</span>
                      {isDiscounted && (
                        <span className="rounded bg-[#e63946] px-3 py-2 text-lg font-black text-white">-{discountPercent}%</span>
                      )}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-zinc-400">
                      Cover price: {isDiscounted ? <span className="line-through">{formatUsd(originalPrice)}</span> : <span>{formatUsd(originalPrice)}</span>}
                      {isDiscounted && <span className="ml-3 text-[#ff8aa0]">Save {formatUsd(discountAmount)}</span>}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded border border-[#2e333d] bg-black/30 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rewards</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-300">
                        Earn <span className="font-black text-white">{Math.max(1, Math.round(finalPrice))} Core Points</span>
                      </div>
                    </div>
                    <div className="rounded border border-[#2e333d] bg-black/30 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Availability</div>
                      <div className="mt-1 text-sm font-black text-white">{product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111216] p-6">
                  <div className="mb-4 text-[11px] font-black uppercase tracking-widest text-zinc-500">Shipping</div>
                  <div className={`rounded border p-4 ${hasFreeShipping ? 'border-green-500/55 bg-green-500/8' : 'border-[#e63946]/45 bg-[#e63946]/8'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Truck className={hasFreeShipping ? 'h-6 w-6 text-green-400' : 'h-6 w-6 text-[#ff8aa0]'} />
                        <div>
                          <div className={`text-sm font-black uppercase ${hasFreeShipping ? 'text-green-400' : 'text-[#ff8aa0]'}`}>
                            {hasFreeShipping ? 'Free Shipping' : 'Shipping Sale'}
                          </div>
                          <div className="text-sm text-zinc-400">{hasFreeShipping ? 'Unlocked for this item' : `Save ${formatUsd(shippingSavings)} today`}</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-black uppercase text-white">
                        {hasFreeShipping ? 'Free' : `-${shippingDiscountPercent}%`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 rounded border border-[#2e333d] bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-white">Standard Delivery</div>
                        <div className="text-sm text-zinc-500">3-7 business days</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-white">{formatShippingFee(finalShippingFee)}</div>
                        {shippingFee > 0 && <div className="text-xs font-bold text-zinc-500 line-through">{formatUsd(shippingFee)}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-bold text-zinc-500">Shipping calculated for: <span className="text-[#e63946]">United States</span></div>
                </div>
              </div>

              <div className="grid gap-px bg-[#2e333d] md:grid-cols-3">
                {[
                  [CalendarDays, 'Estimated Delivery', '2-5 days'],
                  [Box, 'Secure Packaging', 'Shock & moisture safe'],
                  [RotateCcw, 'Easy Returns', 'Within 7 days'],
                ].map(([Icon, title, subtitle]) => (
                  <div key={String(title)} className="flex items-center gap-3 bg-[#111216] p-4">
                    <Icon className="h-5 w-5 text-zinc-400" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-500">{String(title)}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{String(subtitle)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 bg-[#15171d] p-5 lg:grid-cols-[156px_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex h-14 items-center justify-center border border-[#2e333d] bg-black/40">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-full w-14 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">-</button>
                  <input value={quantity} onChange={(event) => setQuantity(Math.max(1, parseInt(event.target.value) || 1))} type="number" min="1" className="h-full w-14 bg-transparent p-0 text-center font-black text-white outline-none" />
                  <button onClick={() => setQuantity(quantity + 1)} className="h-full w-14 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">+</button>
                </div>
                <button
                  onClick={() => void handleAddToCart()}
                  disabled={product.stock_quantity === 0 || added || buying}
                  className={`h-14 font-black uppercase tracking-widest transition-transform ${
                    added
                      ? 'bg-green-600 text-white shadow-[5px_5px_0_0_rgba(22,163,74,0.7)]'
                      : product.stock_quantity === 0
                        ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                        : 'bg-[#e63946] text-white shadow-[5px_5px_0_0_rgba(255,255,255,0.16)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-3">
                    {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                    {added ? 'Added' : 'Add to cart'}
                  </span>
                </button>
                <button
                  onClick={() => void handleAddToWishlist()}
                  className="h-14 border border-[#2e333d] bg-black/20 font-black uppercase tracking-widest text-white transition-colors hover:border-[#e63946] hover:text-[#e63946]"
                >
                  <span className="inline-flex items-center justify-center gap-3"><Heart className="h-5 w-5" /> Add to wishlist</span>
                </button>
                <button
                  onClick={() => void handleBuyNow()}
                  disabled={product.stock_quantity === 0 || buying}
                  className={`h-14 font-black uppercase tracking-widest transition-transform lg:col-span-3 ${
                    product.stock_quantity === 0
                      ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                      : 'bg-white text-black shadow-[5px_5px_0_0_rgba(230,57,70,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                  }`}
                >
                  {buying ? 'Processing...' : 'Buy now'}
                </button>
              </div>

              <div className="grid gap-px bg-[#2e333d] md:grid-cols-3">
                {[
                  [ShieldCheck, 'Secure Payment', 'SSL 256-bit'],
                  [PackageCheck, 'Authentic Stock', 'Official catalog'],
                  [Share2, 'Share', 'Send this volume'],
                ].map(([Icon, title, subtitle]) => (
                  <div key={String(title)} className="flex items-center gap-3 bg-[#111216] p-4">
                    <Icon className="h-5 w-5 text-zinc-400" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-500">{String(title)}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{String(subtitle)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {message && <p className="mt-4 text-sm font-black uppercase tracking-widest text-green-500">{message}</p>}
          </motion.div>
        </section>

        <section className="mt-16 border-t border-zinc-800 pt-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500">
                <Sparkles className="h-4 w-4" /> Reader Signal
              </p>
              <h2 className="text-3xl font-black uppercase tracking-normal sm:text-4xl">Reviews</h2>
            </div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-500">
              <RatingStars value={reviewAverage} />
              {reviewCount > 0 ? `${reviewAverage.toFixed(1)} from ${reviewCount}` : 'Be the first reviewer'}
            </div>
          </div>

          <form onSubmit={submitReview} className="mb-8 w-full">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)_140px]">
              <select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))} className="h-12 border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-red-500">
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
              </select>
              <input value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Drop your manga take..." className="h-12 min-w-0 border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-red-500" />
              <button className="h-12 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[4px_4px_0_0_rgba(230,57,70,1)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                Submit
              </button>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {reviews.length === 0 && <p className="text-zinc-500">No reviews yet.</p>}
            {reviews.map((review) => (
              <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} key={review.id} className="border border-zinc-800 bg-zinc-950 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-black text-white">{review.username}</span>
                  <span className="inline-flex items-center gap-2 text-red-500"><RatingStars value={review.rating} /> {review.rating}/5</span>
                </div>
                <p className="text-zinc-300">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
