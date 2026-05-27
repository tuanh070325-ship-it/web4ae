import type { ApiNumber, Product } from './types';

const PRODUCT_PLACEHOLDER_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="720" viewBox="0 0 480 720">
  <rect width="480" height="720" fill="#101417"/>
  <rect x="42" y="42" width="396" height="636" rx="18" fill="#171d21" stroke="#343d43" stroke-width="4"/>
  <path d="M120 222h240M120 278h176M120 334h214" stroke="#e63946" stroke-width="18" stroke-linecap="round"/>
  <text x="240" y="480" text-anchor="middle" fill="#a0a5b1" font-family="Arial" font-size="34" font-weight="700">AkibaCore</text>
  <text x="240" y="524" text-anchor="middle" fill="#5e6677" font-family="Arial" font-size="22">No image</text>
</svg>
`.trim());

export const PRODUCT_PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=utf-8,${PRODUCT_PLACEHOLDER_SVG}`;

export function toNumber(value: ApiNumber | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
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

export function getProductShippingFee(product: Product): number {
  return Math.max(0, toNumber(product.shipping_fee));
}

export function getProductShippingDiscountPercent(product: Product): number {
  const discountPercent = toNumber(product.shipping_discount_percent, 0);
  return Math.round(Math.min(100, Math.max(0, discountPercent)));
}

export function getProductFinalShippingFee(product: Product): number {
  const finalFee = toNumber(product.shipping_final_fee, NaN);
  if (Number.isFinite(finalFee) && finalFee >= 0) {
    return finalFee;
  }

  return Math.max(0, getProductShippingFee(product) * (1 - getProductShippingDiscountPercent(product) / 100));
}

export function getProductShippingDiscountAmount(product: Product): number {
  return Math.max(0, getProductShippingFee(product) - getProductFinalShippingFee(product));
}

export function hasProductShippingDiscount(product: Product): boolean {
  return getProductShippingDiscountPercent(product) > 0 || getProductShippingDiscountAmount(product) > 0;
}

export function formatShippingFee(value: ApiNumber | null | undefined): string {
  return toNumber(value) <= 0 ? 'Freeship' : formatUsd(value);
}

export function getProductImage(product: Product): string {
  return product.image || product.image_url || PRODUCT_PLACEHOLDER_IMAGE;
}

export function useProductPlaceholderImage(event: { currentTarget: HTMLImageElement }) {
  if (event.currentTarget.src !== PRODUCT_PLACEHOLDER_IMAGE) {
    event.currentTarget.src = PRODUCT_PLACEHOLDER_IMAGE;
  }
}

export function getProductAuthor(product: Product): string {
  return product.author || product.author_name || 'Unknown author';
}

export function getProductPath(product: Product): string {
  return `/product/${encodeURIComponent(product.slug || String(product.id))}`;
}
