import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../lib/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  variant?: 'shop' | 'admin' | 'home';
  label?: string;
}

function pageWindow(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({ meta, onPageChange, variant = 'shop', label }: PaginationProps) {
  if (meta.totalPages <= 1) {return null;}

  const pages = pageWindow(meta.page, meta.totalPages);
  const isAdmin = variant === 'admin';
  const isHome = variant === 'home';
  const baseButton = isAdmin
    ? 'h-9 min-w-9 border border-[#343d43] bg-[#171d21] px-3 text-sm font-bold text-zinc-300 transition-colors hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
    : isHome
      ? 'h-10 min-w-10 border border-zinc-800 bg-black px-3 text-sm font-black text-zinc-300 shadow-[4px_4px_0_0_rgba(230,57,70,0.45)] transition-all hover:border-red-600 hover:text-white hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40'
      : 'h-10 min-w-10 border border-[#2e333d] bg-[#242730] px-3 text-sm font-bold text-zinc-300 shadow-[3px_3px_0_0_rgba(0,0,0,0.35)] transition-all hover:border-[#5ea5c8] hover:text-white hover:shadow-[0_0_14px_rgba(94,165,200,0.35)] disabled:cursor-not-allowed disabled:opacity-40';
  const activeButton = isAdmin
    ? 'border-red-500 bg-red-500 text-white'
    : isHome
      ? 'border-red-600 bg-red-600 text-white shadow-none'
      : 'border-[#5ea5c8] bg-[#5ea5c8] text-[#181a1f]';

  const edgeButton = `${baseButton} inline-flex items-center gap-1.5`;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Product pagination">
      {label && (
        <div className="basis-full pb-1 text-center text-xs font-black uppercase tracking-widest text-zinc-500">
          {label}
        </div>
      )}
      <button
        type="button"
        disabled={!meta.hasPrevPage}
        onClick={() => onPageChange(meta.page - 1)}
        className={edgeButton}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>
      {pages[0] > 1 && (
        <>
          <button type="button" onClick={() => onPageChange(1)} className={baseButton}>1</button>
          <span className="px-1 text-zinc-600">...</span>
        </>
      )}
      {pages.map((page) => (
        <button
          type="button"
          key={page}
          onClick={() => onPageChange(page)}
          className={`${baseButton} ${page === meta.page ? activeButton : ''}`}
          aria-current={page === meta.page ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
      {pages[pages.length - 1] < meta.totalPages && (
        <>
          <span className="px-1 text-zinc-600">...</span>
          <button type="button" onClick={() => onPageChange(meta.totalPages)} className={baseButton}>{meta.totalPages}</button>
        </>
      )}
      <button
        type="button"
        disabled={!meta.hasNextPage}
        onClick={() => onPageChange(meta.page + 1)}
        className={edgeButton}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
