import type { ApiNumber, Product } from "./types";

export function toNumber(value: ApiNumber | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function formatUsd(value: ApiNumber | null | undefined): string {
  return `$${toNumber(value).toFixed(2)}`;
}

export function getProductFinalPrice(product: Product): number {
  const price = toNumber(product.price);
  const originalPrice = toNumber(product.original_price, NaN);
  const legacyDiscountPrice = toNumber(product.discount_price, NaN);

  if (!Number.isFinite(originalPrice) && Number.isFinite(legacyDiscountPrice) && legacyDiscountPrice > 0 && legacyDiscountPrice < price) {
    return legacyDiscountPrice;
  }

  return price;
}

export function getProductOriginalPrice(product: Product): number {
  const originalPrice = toNumber(product.original_price, NaN);
  if (Number.isFinite(originalPrice) && originalPrice > 0) {
    return originalPrice;
  }

  const legacyDiscountPrice = toNumber(product.discount_price, NaN);
  const legacyPrice = toNumber(product.price);
  return Number.isFinite(legacyDiscountPrice) && legacyDiscountPrice > 0 && legacyDiscountPrice < legacyPrice
    ? legacyPrice
    : legacyPrice;
}

export function getProductDiscountPercent(product: Product): number {
  const discountPercent = toNumber(product.discount_percent, NaN);
  if (Number.isFinite(discountPercent) && discountPercent > 0) {
    return Math.round(discountPercent);
  }

  const originalPrice = getProductOriginalPrice(product);
  const finalPrice = getProductFinalPrice(product);
  if (originalPrice <= finalPrice || originalPrice <= 0) {
    return 0;
  }

  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

export function getProductDiscountAmount(product: Product): number {
  const discountAmount = toNumber(product.discount_amount, NaN);
  if (Number.isFinite(discountAmount) && discountAmount > 0) {
    return discountAmount;
  }

  return Math.max(0, getProductOriginalPrice(product) - getProductFinalPrice(product));
}

export function hasProductDiscount(product: Product): boolean {
  return Boolean(product.has_discount) || getProductDiscountPercent(product) > 0 || getProductDiscountAmount(product) > 0;
}

export function getProductImage(product: Product): string {
  return product.image || product.image_url || "";
}

export function getProductAuthor(product: Product): string {
  return product.author || product.author_name || "Unknown author";
}

export function getProductPath(product: Product): string {
  return `/product/${encodeURIComponent(product.slug || String(product.id))}`;
}
