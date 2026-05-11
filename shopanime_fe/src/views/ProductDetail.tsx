import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronRight, Heart, Share2, ShoppingCart, Sparkles, Star, Zap } from "lucide-react";
import { motion } from "motion/react";
import { apiGet, apiPost } from "../lib/api";
import { formatUsd, getProductAuthor, getProductDiscountAmount, getProductDiscountPercent, getProductFinalPrice, getProductImage, getProductOriginalPrice, hasProductDiscount, toNumber } from "../lib/format";
import type { ApiMutationResponse, ApiResponse, Product, Review } from "../lib/types";
import { useAuth } from "../components/auth/AuthProvider";

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(value) ? "fill-[#f5a623] text-[#f5a623]" : "text-zinc-700"}`}
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
  const [message, setMessage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
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
      .catch((err) => console.error("Error fetching product:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!productId) return;
    apiGet<ApiResponse<Review[]>>(`/reviews/${productId}`)
      .then((response) => setReviews(response.data))
      .catch(() => setReviews([]));
  }, [productId]);

  const reviewAverage = useMemo(() => {
    if (reviews.length === 0) return toNumber(product?.average_rating);
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [product?.average_rating, reviews]);
  const reviewCount = reviews.length || Number(product?.review_count || 0);
  const catalogCode = product ? product.isbn || product.sku || `AKIBA-${String(product.id).padStart(5, "0")}` : "";

  const requireLogin = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!product || !requireLogin()) return;
    setMessage(null);
    await apiPost<ApiMutationResponse>("/cart/items", { product_id: product.id, quantity });
    setAdded(true);
    setMessage("Added to cart");
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToWishlist = async () => {
    if (!product || !requireLogin()) return;
    setMessage(null);
    await apiPost<ApiMutationResponse>("/wishlist", { product_id: product.id });
    setMessage("Added to wishlist");
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || !requireLogin()) return;
    await apiPost<ApiMutationResponse>("/reviews", {
      product_id: product.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
    setReviewForm({ rating: 5, comment: "" });
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
  const externalRatingCount = Number(product.external_rating_count || 0);
  const externalRating = toNumber(product.external_rating);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <img src={getProductImage(product)} alt="" className="h-full w-full scale-110 object-cover opacity-10 blur-2xl" />
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

        <section className="grid min-h-[680px] gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 35, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="relative mx-auto w-full max-w-[420px]"
          >
            <div className="absolute -inset-8 bg-red-600/20 blur-3xl" />
            <motion.div
              whileHover={{ scale: 1.04, rotateY: 12, rotateX: 4 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="relative aspect-[3/4] overflow-hidden border border-zinc-700 bg-zinc-950 shadow-[18px_18px_0_0_rgba(230,57,70,0.95),0_40px_90px_rgba(0,0,0,0.65)] transform-gpu"
            >
              <img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent" />
              {isDiscounted && (
                <div className="absolute right-4 top-4 bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.7)]">
                  -{discountPercent}% Drop
                </div>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 45 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 95, delay: 0.1 }}
            className="relative"
          >
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-widest">
              <span className="inline-flex items-center gap-2 bg-red-600 px-3 py-1.5 text-white">
                <Zap className="h-3.5 w-3.5" /> Trending Volume
              </span>
              <span className="text-zinc-500">{product.series_name || product.category_name || "Manga Catalog"}</span>
              <span className="text-red-500">{getProductAuthor(product)}</span>
            </div>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
              {product.name}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-5 border-y border-zinc-800 py-5">
              <div className="flex items-center gap-2">
                <RatingStars value={reviewAverage} />
                <span className="text-lg font-black text-[#f5a623]">{reviewCount > 0 ? reviewAverage.toFixed(1) : "New"}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {reviewCount > 0 ? `${reviewCount} reviews` : "No reviews yet"}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-800" />
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">
                Vol <span className="text-white">{product.volume_number || "Launch"}</span>
              </div>
              {externalRatingCount > 0 && (
                <>
                  <div className="h-6 w-px bg-zinc-800" />
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    {product.external_rating_source || "Catalog"} <span className="text-white">{externalRating.toFixed(1)}</span> / {externalRatingCount.toLocaleString()} readers
                  </div>
                </>
              )}
            </div>

            <div className="mt-7 rounded border border-red-500/40 bg-[linear-gradient(135deg,rgba(230,57,70,0.16),rgba(0,0,0,0.88)_55%,rgba(94,165,200,0.12))] p-5 shadow-[0_0_40px_rgba(230,57,70,0.12)]">
              <div className="flex flex-wrap items-end gap-4">
                <span className="text-5xl font-black text-white sm:text-6xl">{formatUsd(finalPrice)}</span>
                {isDiscounted && (
                  <>
                    <span className="pb-2 text-2xl font-black text-zinc-600 line-through">{formatUsd(originalPrice)}</span>
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      className="mb-2 rounded bg-red-600 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_18px_rgba(230,57,70,0.55)]"
                    >
                      Save {formatUsd(discountAmount)}
                    </motion.span>
                  </>
                )}
              </div>
              {isDiscounted && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest text-[#ff8aa0]">
                  <Sparkles className="h-4 w-4" />
                  <span>{discountPercent}% limited manga drop pricing</span>
                </div>
              )}
            </div>

            <p className="mt-7 max-w-3xl text-lg font-semibold leading-8 text-zinc-300">
              {product.description || "No description available for this volume."}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-4">
              {[
                ["Catalog ID", catalogCode],
                ["Format", product.book_format || "PAPERBACK"],
                ["Publisher", product.publisher_name || "Unknown"],
                ["Stock", product.stock_quantity > 0 ? `${product.stock_quantity} ready` : "Out"],
              ].map(([label, value]) => (
                <div key={label} className="bg-black p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{label}</div>
                  <div className="mt-1 break-words text-sm font-black uppercase text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <div className="flex h-14 items-center bg-zinc-950">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-full w-14 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">-</button>
                <input value={quantity} onChange={(event) => setQuantity(Math.max(1, parseInt(event.target.value) || 1))} type="number" min="1" className="h-full w-14 bg-transparent p-0 text-center font-black text-white outline-none" />
                <button onClick={() => setQuantity(quantity + 1)} className="h-full w-14 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">+</button>
              </div>

              <button
                onClick={() => void handleAddToCart()}
                disabled={product.stock_quantity === 0 || added}
                className={`h-14 flex-1 font-black uppercase tracking-widest transition-transform ${
                  added
                    ? "bg-green-600 text-white shadow-[5px_5px_0_0_rgba(22,163,74,0.7)]"
                    : product.stock_quantity === 0
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : "bg-white text-black shadow-[5px_5px_0_0_rgba(230,57,70,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-3">
                  {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                  {added ? "Added to cart" : "Add to cart"}
                </span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => void handleAddToWishlist()} className="h-12 bg-black text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-zinc-900">
                <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /> Wishlist</span>
              </button>
              <button className="h-12 bg-black text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-zinc-900">
                <span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" /> Share</span>
              </button>
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
              {reviewCount > 0 ? `${reviewAverage.toFixed(1)} from ${reviewCount}` : "Be the first reviewer"}
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
