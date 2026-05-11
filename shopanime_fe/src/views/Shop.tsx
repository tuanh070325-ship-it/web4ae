import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { AlertTriangle, ChevronDown, Star } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import { getProductDiscountPercent, getProductImage, getProductPath, hasProductDiscount, toNumber } from "../lib/format";
import type { ApiResponse, PaginatedApiResponse, PaginationMeta, Category, Product } from "../lib/types";
import { useAuth } from "../components/auth/AuthProvider";
import { Pagination } from "../components/ui/Pagination";
import { ProductDealPrice } from "../components/ui/ProductDealPrice";

const fallbackGenres = [
  { label: "Shounen", value: "shounen" },
  { label: "Seinen", value: "seinen" },
  { label: "Action", value: "action" },
  { label: "Adventure", value: "adventure" },
  { label: "Dark Fantasy", value: "dark-fantasy" },
];

const seriesStatuses = [
  { label: "Ongoing", value: "ONGOING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Hiatus", value: "HIATUS" },
];

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const gridRef = useRef<HTMLDivElement | null>(null);

  const categoryId = searchParams.get("category");
  const selectedGenres = useMemo(() => searchParams.get("genres")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const minRating = searchParams.get("minRating") ?? "";
  const seriesStatus = searchParams.get("seriesStatus") ?? "";
  const sort = searchParams.get("sort") ?? "popularity";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const minPriceNumber = minPrice === "" ? null : Number(minPrice);
  const maxPriceNumber = maxPrice === "" ? null : Number(maxPrice);
  const priceError = minPriceNumber !== null && maxPriceNumber !== null && Number.isFinite(minPriceNumber) && Number.isFinite(maxPriceNumber) && maxPriceNumber <= minPriceNumber
    ? `Max price must be higher than min price. Try $${minPriceNumber + 1} or more.`
    : null;

  const genres = categories.length > 0
    ? categories.map((category) => ({ label: category.name, value: category.slug }))
    : fallbackGenres;

  const updateFilter = (key: string, value: string | null, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    if (resetPage) {
      nextParams.delete("page");
    }
    setSearchParams(nextParams);
  };

  const updatePriceFilter = (key: "minPrice" | "maxPrice", value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.delete("page");
    setSearchParams(nextParams);
  };

  const changePage = (nextPage: number) => {
    updateFilter("page", String(nextPage), false);
    window.setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const toggleGenre = (genre: string) => {
    const nextGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((item) => item !== genre)
      : [...selectedGenres, genre];
    updateFilter("genres", nextGenres.length > 0 ? nextGenres.join(",") : null);
  };

  useEffect(() => {
    apiGet<ApiResponse<Category[]>>("/categories")
      .then((data) => {
        if (Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    if (priceError) {
      return;
    }
    const productParams = new URLSearchParams();
    if (categoryId) productParams.set("category", categoryId);
    if (selectedGenres.length > 0) productParams.set("genres", selectedGenres.join(","));
    if (minPrice) productParams.set("minPrice", minPrice);
    if (maxPrice) productParams.set("maxPrice", maxPrice);
    if (minRating) productParams.set("minRating", minRating);
    if (seriesStatus) productParams.set("seriesStatus", seriesStatus);
    if (sort) productParams.set("sort", sort);
    productParams.set("page", String(page));
    productParams.set("limit", "12");

    const queryString = productParams.toString();
    apiGet<PaginatedApiResponse<Product[]>>(`/products${queryString ? `?${queryString}` : ""}`)
      .then((data) => {
        if (Array.isArray(data.data)) {
          setProducts(data.data);
          setPagination(data.meta);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, [categoryId, maxPrice, minPrice, minRating, page, priceError, selectedGenres, seriesStatus, sort]);

  const addToCart = async (productId: number) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent("/shop")}`);
      return;
    }
    await apiPost("/cart/items", { product_id: productId, quantity: 1 });
  };

  return (
    <div className="w-full bg-[#181a1f] min-h-screen text-[#a0a5b1] font-sans">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 pr-4 pt-6">
            <div>
              <h3 className="text-white text-base font-medium mb-4 tracking-wide">Genre</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                {genres.map((genre) => (
                  <label key={genre.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre.value)}
                      onChange={() => toggleGenre(genre.value)}
                      className="w-4 h-4 rounded-sm border border-[#4a5568] bg-[#181a1f] cursor-pointer appearance-none checked:bg-[#5ea5c8] checked:border-[#5ea5c8]"
                    />
                    <span className="text-sm group-hover:text-white transition-colors">{genre.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white text-base font-medium mb-4 tracking-wide">Price Range</h3>
              <div className="flex items-center justify-between text-sm text-white mb-2">
                <span>${minPrice || "0"}</span>
                <span>${maxPrice || "200"}</span>
              </div>
              <div className="relative h-1.5 bg-[#2e333d] rounded-full mb-4">
                <div className="absolute left-0 top-0 h-full w-full bg-[#5ea5c8] rounded-full opacity-100" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#5ea5c8]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#5ea5c8]" />
              </div>
              <div className="flex items-center gap-3 mt-5">
                <input
                  type="number"
                  min="0"
                  placeholder="min"
                  value={minPrice}
                  onChange={(event) => updatePriceFilter("minPrice", event.target.value)}
                  className={`w-full bg-[#181a1f] border rounded text-center py-1.5 text-sm focus:outline-none text-white ${priceError ? "border-[#ff4d6d] focus:border-[#ff4d6d]" : "border-[#4a5568] focus:border-[#5ea5c8]"}`}
                />
                <span className="text-[#4a5568]">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="max"
                  value={maxPrice}
                  onChange={(event) => updatePriceFilter("maxPrice", event.target.value)}
                  className={`w-full bg-[#181a1f] border rounded text-center py-1.5 text-sm focus:outline-none text-white ${priceError ? "border-[#ff4d6d] focus:border-[#ff4d6d]" : "border-[#4a5568] focus:border-[#5ea5c8]"}`}
                />
              </div>
              {priceError && (
                <div className="mt-3 flex gap-2 border-l-2 border-[#ff4d6d] bg-[#ff4d6d]/10 px-3 py-2 text-xs font-semibold leading-relaxed text-[#ffb3c1]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff4d6d]" />
                  <span>{priceError}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-white text-base font-medium mb-4 tracking-wide">Rating</h3>
              <div className="flex flex-col gap-3">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <label key={stars} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={minRating === String(stars)}
                      onChange={() => updateFilter("minRating", minRating === String(stars) ? null : String(stars))}
                      className="w-4 h-4 rounded-sm border border-[#4a5568] bg-[#181a1f] cursor-pointer appearance-none checked:bg-[#5ea5c8] checked:border-[#5ea5c8]"
                    />
                    <span className="text-sm text-white flex items-center gap-1">
                      <span className="group-hover:text-white transition-colors w-2">{stars}</span>
                      <span className="flex gap-0.5 ml-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-[14px] h-[14px] ${i < stars ? "fill-[#f5a623] text-[#f5a623]" : "text-[#4a5568] stroke-[1.5px]"}`}
                          />
                        ))}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white text-base font-medium mb-4 tracking-wide">Status</h3>
              <div className="flex flex-col gap-3">
                {seriesStatuses.map((status) => (
                  <label key={status.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="seriesStatus"
                      checked={seriesStatus === status.value}
                      onChange={() => updateFilter("seriesStatus", status.value)}
                      className="w-4 h-4 rounded-full border border-[#4a5568] bg-[#181a1f] cursor-pointer appearance-none checked:border-[#5ea5c8] checked:border-[5px] transition-all"
                    />
                    <span className="text-sm group-hover:text-white transition-colors">{status.label}</span>
                  </label>
                ))}
                {seriesStatus && (
                  <button onClick={() => updateFilter("seriesStatus", null)} className="w-fit text-xs font-semibold text-[#5ea5c8] hover:text-white">
                    Clear status
                  </button>
                )}
              </div>
            </div>
          </aside>

          <div ref={gridRef} className="flex-1 lg:border-l lg:border-[#2e333d] lg:pl-8 pt-6 scroll-mt-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {pagination ? (
                <div className="border-l-4 border-[#5ea5c8] pl-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5ea5c8]">Catalog Sync</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} volumes
                  </p>
                </div>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3 text-sm">
                <span>Sort by:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(event) => updateFilter("sort", event.target.value)}
                    className="appearance-none bg-[#242730] border border-[#2e333d] rounded-md py-2 pl-4 pr-10 text-white focus:outline-none focus:border-[#5ea5c8] cursor-pointer"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Rating</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[#a0a5b1]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div key={product.id} className="group relative overflow-hidden rounded-xl border border-[#2e333d] bg-[#242730] transition-all duration-300 hover:-translate-y-1 hover:border-[#5ea5c8] hover:shadow-[0_0_22px_rgba(94,165,200,0.35)]">
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#ff315a]/18 to-transparent" />
                    <motion.div
                      animate={{ x: ["-120%", "160%"] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-0 h-full w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    />
                  </div>
                  <div className="relative aspect-[3/4] p-3 pb-0">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-md block"
                    />
                    {hasProductDiscount(product) && (
                      <motion.div
                        animate={{ scale: [1, 1.07, 1], rotate: [-3, 2, -3] }}
                        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-5 top-5 z-20 rounded bg-[#ff315a] px-3 py-2 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_22px_rgba(255,49,90,0.62)]"
                      >
                        -{getProductDiscountPercent(product)}%
                        <span className="ml-1 text-[10px]">OFF</span>
                      </motion.div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-10 mx-3 mb-0 mt-3 rounded-md">
                      <button onClick={() => void addToCart(product.id)} className="w-3/4 py-2 bg-[#181a1f]/80 backdrop-blur-sm border border-[#5ea5c8] rounded text-white text-sm font-medium hover:bg-[#5ea5c8] hover:text-[#181a1f] transition-colors shadow-[0_0_10px_rgba(94,165,200,0.5)]">
                        Add to Cart
                      </button>
                      <Link to={getProductPath(product)} className="w-3/4 py-2 bg-[#181a1f]/80 backdrop-blur-sm border border-[#5ea5c8] rounded text-white text-sm font-medium hover:bg-[#5ea5c8] hover:text-[#181a1f] transition-colors shadow-[0_0_10px_rgba(94,165,200,0.5)] text-center">
                        Quick View
                      </Link>
                    </div>
                  </div>

                  <div className="relative p-4 pt-3 flex flex-col">
                    <Link to={getProductPath(product)} className="hover:text-[#5ea5c8] transition-colors">
                      <h3 className="line-clamp-1 text-[15px] font-bold text-white mb-3">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-end justify-between gap-3 mt-auto">
                      <ProductDealPrice product={product} compact />
                      <div className="flex items-center gap-1 text-[#f5a623] text-sm font-medium">
                        <Star className="w-4 h-4 fill-[#f5a623]" />
                        {toNumber(product.review_count) > 0 ? toNumber(product.average_rating).toFixed(1) : "New"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="py-24 text-center text-[#a0a5b1]">
                No volumes found matching the current filters.
              </div>
            )}
            {pagination && products.length > 0 && (
              <>
                <Pagination
                  meta={pagination}
                  onPageChange={changePage}
                  label="Catalog pages"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
