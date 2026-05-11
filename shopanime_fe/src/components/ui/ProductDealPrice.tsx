import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import {
  formatUsd,
  getProductDiscountAmount,
  getProductDiscountPercent,
  getProductFinalPrice,
  getProductOriginalPrice,
  hasProductDiscount,
} from "../../lib/format";
import type { Product } from "../../lib/types";

interface ProductDealPriceProps {
  product: Product;
  align?: "left" | "center";
  compact?: boolean;
}

export function ProductDealPrice({ product, align = "left", compact = false }: ProductDealPriceProps) {
  const discounted = hasProductDiscount(product);
  const finalPrice = getProductFinalPrice(product);
  const originalPrice = getProductOriginalPrice(product);
  const discountPercent = getProductDiscountPercent(product);
  const discountAmount = getProductDiscountAmount(product);
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  const priceSize = compact ? "text-[22px]" : "text-2xl";

  if (!discounted) {
    return (
      <div className={`flex flex-col ${alignment}`}>
        <span className={`${priceSize} font-black leading-none text-white`}>{formatUsd(finalPrice)}</span>
      </div>
    );
  }

  return (
    <div className={`flex min-h-[72px] flex-col ${alignment}`}>
      <div className={`flex flex-wrap items-center gap-2 ${align === "center" ? "justify-center" : "justify-start"}`}>
        <span className={`${priceSize} font-black leading-none text-white drop-shadow-[0_0_14px_rgba(255,49,90,0.32)]`}>
          {formatUsd(finalPrice)}
        </span>
        <motion.span
          animate={{ scale: [1, 1.08, 1], rotate: [-2, 2, -2] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex min-w-16 items-center justify-center rounded bg-[#ff315a] px-2.5 py-1 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,49,90,0.55)]"
        >
          -{discountPercent}%
        </motion.span>
      </div>

      <div className={`mt-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide ${align === "center" ? "justify-center" : "justify-start"}`}>
        <span className="text-zinc-500 line-through">{formatUsd(originalPrice)}</span>
        <span className="inline-flex items-center gap-1 text-[#ff8aa0]">
          <Sparkles className="h-3.5 w-3.5" />
          Save {formatUsd(discountAmount)}
        </span>
      </div>

      <div className="relative mt-2 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          animate={{ x: ["-100%", "140%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#ff315a] to-transparent"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff315a] via-[#f5a623] to-[#5ea5c8] opacity-45" />
      </div>
    </div>
  );
}
