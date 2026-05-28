import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ChevronDown, Filter, PanelLeftClose, PanelLeftOpen, Star, X } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import type { ApiResponse, PaginatedApiResponse, PaginationMeta, Category, Product } from '../lib/types';
import { trackEvent } from '../lib/analytics';
import { useAuth } from '../components/auth/AuthProvider';
import { Pagination } from '../components/ui/Pagination';
import { ProductGrid } from '../components/shop/ProductGrid';

const fallbackGenres = [
  { label: 'Shounen', value: 'shounen' },
  { label: 'Seinen', value: 'seinen' },
  { label: 'Action', value: 'action' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Dark Fantasy', value: 'dark-fantasy' },
];

const seriesStatuses = [
  { label: 'Ongoing', value: 'ONGOING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Hiatus', value: 'HIATUS' },
];

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categoryId = searchParams.get('category');
  const search = searchParams.get('search') ?? '';
  const selectedGenres = useMemo(() => searchParams.get('genres')?.split(',').filter(Boolean) ?? [], [searchParams]);
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const minRating = searchParams.get('minRating') ?? '';
  const seriesStatus = searchParams.get('seriesStatus') ?? '';
  const sort = searchParams.get('sort') ?? 'popularity';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const minPriceNumber = minPrice === '' ? null : Number(minPrice);
  const maxPriceNumber = maxPrice === '' ? null : Number(maxPrice);
  const priceError = minPriceNumber !== null && maxPriceNumber !== null && Number.isFinite(minPriceNumber) && Number.isFinite(maxPriceNumber) && maxPriceNumber <= minPriceNumber
    ? `Max price must be higher than min price. Try $${minPriceNumber + 1} or more.`
    : null;

  const genres = categories.length > 0
    ? categories.map((category) => ({ label: category.name, value: category.slug }))
    : fallbackGenres;
  const activeFilterCount =
    (search ? 1 : 0) +
    (categoryId ? 1 : 0) +
    selectedGenres.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating ? 1 : 0) +
    (seriesStatus ? 1 : 0);

  const updateFilter = useCallback((key: string, value: string | null, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    if (key === 'search' && value) {
      trackEvent('search_submitted', { query: value, source: 'shop' });
    } else if (key !== 'page') {
      trackEvent('filter_changed', { source: 'shop', [key === 'category' ? 'category' : 'sort']: value || null });
    }
    if (resetPage) {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const updatePriceFilter = (key: 'minPrice' | 'maxPrice', value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    trackEvent('filter_changed', { source: 'shop', category: key, query: value || undefined });
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const changePage = useCallback((nextPage: number) => {
    updateFilter('page', String(nextPage), false);
    window.setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }, [updateFilter]);

  const toggleGenre = (genre: string) => {
    const nextGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((item) => item !== genre)
      : [...selectedGenres, genre];
    updateFilter('genres', nextGenres.length > 0 ? nextGenres.join(',') : null);
  };

  useEffect(() => {
    apiGet<ApiResponse<Category[]>>('/categories')
      .then((data) => {
        if (Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    if (priceError) {
      return;
    }
    const productParams = new URLSearchParams();
    if (search) {productParams.set('search', search);}
    if (categoryId) {productParams.set('category', categoryId);}
    if (selectedGenres.length > 0) {productParams.set('genres', selectedGenres.join(','));}
    if (minPrice) {productParams.set('minPrice', minPrice);}
    if (maxPrice) {productParams.set('maxPrice', maxPrice);}
    if (minRating) {productParams.set('minRating', minRating);}
    if (seriesStatus) {productParams.set('seriesStatus', seriesStatus);}
    if (sort) {productParams.set('sort', sort);}
    productParams.set('page', String(page));
    productParams.set('limit', '12');

    const queryString = productParams.toString();
    apiGet<PaginatedApiResponse<Product[]>>(`/products${queryString ? `?${queryString}` : ''}`)
      .then((data) => {
        if (Array.isArray(data.data)) {
          setProducts(data.data);
          setPagination(data.meta);
        }
      })
      .catch((err) => console.error('Error fetching products:', err));
  }, [categoryId, maxPrice, minPrice, minRating, page, priceError, search, selectedGenres, seriesStatus, sort]);

  useEffect(() => {
    if (!mobileFiltersOpen) {return;}
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFiltersOpen]);

  const addToCart = useCallback(async (productId: number) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/shop')}`);
      return;
    }
    await apiPost('/cart/items', { product_id: productId, quantity: 1 });
    trackEvent('add_to_cart', { source: 'shop_grid', quantity: 1 }, { productId });
    window.dispatchEvent(new Event('akibacore:cart-updated'));
  }, [isAuthenticated, navigate]);

  const handleAddToCart = useCallback((productId: number) => {
    void addToCart(productId);
  }, [addToCart]);

  const filterControls = (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-white text-base font-medium mb-4 tracking-wide">Genre</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
          {genres.map((genre) => (
            <label key={genre.value} className="flex min-h-6 items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre.value)}
                onChange={() => toggleGenre(genre.value)}
                className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-sm border border-[#4a5568] bg-[#181a1f] cursor-pointer appearance-none checked:bg-[#5ea5c8] checked:border-[#5ea5c8]"
              />
              <span className="text-sm leading-5 group-hover:text-white transition-colors break-words">{genre.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white text-base font-medium mb-4 tracking-wide">Price Range</h3>
        <div className="flex items-center justify-between text-sm text-white mb-2">
          <span>${minPrice || '0'}</span>
          <span>${maxPrice || '200'}</span>
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
            onChange={(event) => updatePriceFilter('minPrice', event.target.value)}
            className={`w-full bg-[#181a1f] border rounded text-center py-1.5 text-sm focus:outline-none text-white ${priceError ? 'border-[#ff4d6d] focus:border-[#ff4d6d]' : 'border-[#4a5568] focus:border-[#5ea5c8]'}`}
          />
          <span className="text-[#4a5568]">-</span>
          <input
            type="number"
            min="0"
            placeholder="max"
            value={maxPrice}
            onChange={(event) => updatePriceFilter('maxPrice', event.target.value)}
            className={`w-full bg-[#181a1f] border rounded text-center py-1.5 text-sm focus:outline-none text-white ${priceError ? 'border-[#ff4d6d] focus:border-[#ff4d6d]' : 'border-[#4a5568] focus:border-[#5ea5c8]'}`}
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
                onChange={() => updateFilter('minRating', minRating === String(stars) ? null : String(stars))}
                className="w-4 h-4 rounded-sm border border-[#4a5568] bg-[#181a1f] cursor-pointer appearance-none checked:bg-[#5ea5c8] checked:border-[#5ea5c8]"
              />
              <span className="text-sm text-white flex items-center gap-1">
                <span className="group-hover:text-white transition-colors w-2">{stars}</span>
                <span className="flex gap-0.5 ml-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-[14px] h-[14px] ${i < stars ? 'fill-[#f5a623] text-[#f5a623]' : 'text-[#4a5568] stroke-[1.5px]'}`}
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
                onChange={() => updateFilter('seriesStatus', status.value)}
                className="w-4 h-4 rounded-full border border-[#4a5568] bg-[#181a1f] cursor-pointer appearance-none checked:border-[#5ea5c8] checked:border-[5px] transition-all"
              />
              <span className="text-sm group-hover:text-white transition-colors">{status.label}</span>
            </label>
          ))}
          {seriesStatus && (
            <button onClick={() => updateFilter('seriesStatus', null)} className="w-fit text-xs font-semibold text-[#5ea5c8] hover:text-white">
              Clear status
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#181a1f] min-h-screen text-[#a0a5b1] font-sans">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="pt-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-[#2e333d] bg-[#242730] text-sm font-bold text-white transition-colors hover:border-[#5ea5c8]"
          >
            <Filter className="h-4 w-4 text-[#5ea5c8]" />
            Filters
            {activeFilterCount > 0 && <span className="rounded-full bg-[#5ea5c8] px-2 py-0.5 text-xs text-[#181a1f]">{activeFilterCount}</span>}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {filtersOpen && (
            <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col gap-8 pr-4 pt-6">
              {filterControls}
            </aside>
          )}

          <div ref={gridRef} className={`flex-1 pt-6 scroll-mt-6 ${filtersOpen ? 'lg:border-l lg:border-[#2e333d] lg:pl-8' : ''}`}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className="hidden h-10 items-center gap-2 rounded border border-[#2e333d] bg-[#242730] px-3 text-sm font-bold text-white transition-colors hover:border-[#5ea5c8] lg:inline-flex"
                  aria-expanded={filtersOpen}
                  aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
                >
                  {filtersOpen ? <PanelLeftClose className="h-4 w-4 text-[#5ea5c8]" /> : <PanelLeftOpen className="h-4 w-4 text-[#5ea5c8]" />}
                  <span>{filtersOpen ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
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
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span>Sort by:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(event) => updateFilter('sort', event.target.value)}
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

            <ProductGrid products={products} onAddToCart={handleAddToCart} source="shop_grid" />

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

      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div className="fixed inset-0 z-[80] lg:hidden">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              aria-label="Close filter overlay"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute left-0 top-0 flex h-full w-full max-w-[360px] flex-col border-r border-[#2e333d] bg-[#181a1f] shadow-2xl"
              aria-label="Product filters"
            >
              <div className="flex h-16 items-center justify-between border-b border-[#2e333d] px-6">
                <div className="flex items-center gap-2 text-base font-bold text-white">
                  <Filter className="h-4 w-4 text-[#5ea5c8]" />
                  Filters
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2e333d] bg-[#1a1b22] text-white transition-colors hover:border-[#5ea5c8]"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {filterControls}
              </div>
              <div className="border-t border-[#2e333d] bg-[#181a1f] p-4">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="h-11 w-full rounded bg-[#5ea5c8] text-sm font-bold text-[#181a1f] transition-colors hover:bg-[#7fc3e1]"
                >
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
