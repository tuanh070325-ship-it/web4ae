import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { apiGet } from '../lib/api';
import { getProductAuthor, getProductDiscountPercent, getProductImage, getProductPath, hasProductDiscount, useProductPlaceholderImage } from '../lib/format';
import type { PaginatedApiResponse, PaginationMeta, Product } from '../lib/types';
import { trackEvent } from '../lib/analytics';
import { Pagination } from '../components/ui/Pagination';
import { ProductDealPrice } from '../components/ui/ProductDealPrice';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const featuredRef = useRef<HTMLElement | null>(null);
  const productPage = Math.max(1, Number(searchParams.get('featuredPage') || 1));

  const BANNERS = [
    {
      id: 1,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8cqiMEt_klQIpvvzI-WxZXfQdlHg0RrlueO7_MdOru7UD2VQ_FyVY65tGk0Cq0kFLXTwQjvfhKy9MCIMBlK1DdFKb-t-CIXbr5wDAQ4A&s=10',
      title: 'JUJUTSU KAISEN',
      subtitle: 'CURSED CLASH IS HERE',
      button: 'SHOP COLLECTION',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2690&auto=format&fit=crop',
      title: 'CHAINSAW MAN',
      subtitle: 'NEW VOLUMES DROP',
      button: 'READ NOW',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574&auto=format&fit=crop',
      title: 'DEMON SLAYER',
      subtitle: 'EXCLUSIVE BOX SET',
      button: 'PRE-ORDER',
    },
  ];

  useEffect(() => {
    apiGet<PaginatedApiResponse<Product[]>>(`/products?page=${productPage}&limit=8&sort=popularity`)
      .then(data => {
        if (Array.isArray(data.data)) {
          setProducts(data.data);
          setPagination(data.meta);
        }
      })
      .catch(err => console.error('Error fetching products:', err));
  }, [productPage]);

  useEffect(() => {
    products.forEach((product, index) => {
      trackEvent('product_impression', { source: 'home_featured', position: index + 1 }, { productId: product.id });
    });
  }, [products]);

  const changeFeaturedPage = (page: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (page > 1) {
      nextParams.set('featuredPage', String(page));
    } else {
      nextParams.delete('featuredPage');
    }
    setSearchParams(nextParams);
    window.setTimeout(() => {
      featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#000000] min-h-screen text-white font-sans overflow-hidden">
      {/* Dynamic 3D/2D Slider Hero */}
      <section className="relative w-full h-[600px] md:h-[700px] bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            transition={{ duration: 0.7, type: 'spring', bounce: 0.3 }}
            className="absolute inset-0 w-full h-full"
            style={{ perspective: '1000px' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
            <img 
              src={BANNERS[currentSlide].image} 
              alt="Slide"
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70"
            />
            <div className="relative z-20 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
              <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="max-w-2xl"
              >
                <div className="inline-block bg-red-600 text-white font-black tracking-widest px-3 py-1 mb-4 text-sm transform -skew-x-12 border-0">
                  TRENDING NOW
                </div>
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4 !italic" style={{ textShadow: '5px 5px 0px #e63946' }}>
                  {BANNERS[currentSlide].title}
                </h1>
                <p className="text-xl md:text-2xl font-black text-zinc-300 mb-10 uppercase tracking-widest bg-black/40 inline-block px-4 py-2 border-l-4 border-red-600">
                  {BANNERS[currentSlide].subtitle}
                </p>
                <div>
                  <Link 
                    to="/shop" 
                    onClick={() => trackEvent('product_click', { source: 'home_hero', position: currentSlide + 1 })}
                    className="inline-flex items-center gap-2 bg-white text-black font-black uppercase tracking-widest px-8 py-4 border-0 outline-none transform transition-transform hover:scale-105 active:scale-95 shadow-[4px_4px_0_0_rgba(230,57,70,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                  >
                    {BANNERS[currentSlide].button} <ChevronRight className="w-6 h-6" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-30">
          <button 
            onClick={() => setCurrentSlide(prev => (prev - 1 + BANNERS.length) % BANNERS.length)}
            className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/50 hover:bg-red-600 text-white transition-colors border-0 outline-none backdrop-blur-sm shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-95"
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-30">
          <button 
            onClick={() => setCurrentSlide(prev => (prev + 1) % BANNERS.length)}
            className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/50 hover:bg-red-600 text-white transition-colors border-0 outline-none backdrop-blur-sm shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-95"
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {BANNERS.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 transition-all outline-none border-0 ${idx === currentSlide ? 'w-12 bg-red-600' : 'w-4 bg-zinc-600 hover:bg-zinc-400'}`}
            />
          ))}
        </div>
      </section>

      {/* Separator / Title Bar */}
      <div className="w-full bg-black border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white flex items-center gap-4">
            <span className="w-2 h-8 bg-red-600 block"></span>
            Featured Titles
          </h2>
          <Link to="/shop" onClick={() => trackEvent('product_click', { source: 'home_more_link' })} className="group text-zinc-400 hover:text-red-500 transition-colors font-black uppercase tracking-widest text-sm flex items-center gap-1 border-0 outline-none">
            More <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Product List without borders, just images popping out */}
      <section ref={featuredRef} className="max-w-7xl mx-auto px-6 py-20 scroll-mt-6">
        {pagination && (
          <div className="mb-8 flex flex-col gap-2 border-l-4 border-red-600 pl-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-500">Manga Drop</p>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} featured titles
              </p>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-600">
              Page {pagination.page} / {pagination.totalPages}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, type: 'spring', bounce: 0.4 }}
              key={product.id}
            >
              <Link to={getProductPath(product)} onClick={() => trackEvent('product_click', { source: 'home_featured', position: idx + 1 }, { productId: product.id })} className="group block border-0 outline-none">
                <div className="w-full aspect-[2/3] relative mb-6">
                  {/* The book floating without border */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 10, rotateX: 5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_20px_50px_rgba(230,57,70,0.3)] transform-gpu"
                  >
                    <img 
                      src={getProductImage(product)}
                      onError={useProductPlaceholderImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  {hasProductDiscount(product) && (
                    <motion.div
                      animate={{ y: [0, -5, 0], rotate: [7, 3, 7] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -right-3 -top-4 z-10 border-0 bg-[#ff315a] px-4 py-2 text-base font-black uppercase tracking-wider text-white shadow-[0_0_28px_rgba(255,49,90,0.68),4px_4px_0_0_rgba(0,0,0,0.75)]"
                    >
                      -{getProductDiscountPercent(product)}% OFF
                    </motion.div>
                  )}
                </div>
                <div className="pt-2 text-center md:text-left">
                  <h3 className="font-black text-sm md:text-[15px] leading-tight uppercase tracking-wide group-hover:text-red-500 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="w-8 h-1 bg-red-600 my-3 mx-auto md:mx-0" />
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">{getProductAuthor(product)}</p>
                  <div className="md:[&>div]:items-start md:[&>div]:text-left md:[&>div>div]:justify-start">
                    <ProductDealPrice product={product} align="center" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {pagination && (
          <div className="mt-12">
            <div className="mb-4 text-center text-xs font-black uppercase tracking-widest text-zinc-500">
              Page {pagination.page} of {pagination.totalPages} / {pagination.total} titles
            </div>
            <Pagination
              meta={pagination}
              onPageChange={changeFeaturedPage}
              variant="home"
              label="Featured pages"
            />
          </div>
        )}
      </section>

      <hr className="border-t border-zinc-900 border-0 bg-zinc-900 h-px w-full" />
    </div>
  );
}
