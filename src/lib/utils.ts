export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format an amount in Indian Rupees, e.g. ₹1,299 */
export function formatPrice(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

/** Discount percentage between MRP and selling price */
export function discountPercent(mrp: number, price: number): number {
  if (mrp <= 0) return 0;
  return Math.max(0, Math.round(((mrp - price) / mrp) * 100));
}

export function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Deterministic date label a few days from now, e.g. "Thursday, 10 Sep".
 * Built manually to avoid hydration mismatches between server/client Intl data.
 */
export function formatDeliveryDate(offsetDays = 4): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Simple non-reversible hash for mock authentication (demo only — NOT real security).
 * Structurally mirrors how a real auth provider would store a password hash, so it can
 * be swapped for a genuine hashing/backend flow later without changing the call sites.
 */
export function mockHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return "h" + (h >>> 0).toString(36);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_RE = /^[6-9]\d{9}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidMobile(value: string): boolean {
  return MOBILE_RE.test(value.trim());
}

/** Accepts a valid email OR a 10-digit Indian mobile number. */
export function isValidIdentifier(value: string): boolean {
  const v = value.trim();
  return isValidEmail(v) || isValidMobile(v);
}

/** Password must be at least 8 chars with a letter and a number. */
export function passwordErrors(value: string): string[] {
  const errors: string[] = [];
  if (!value) {
    errors.push("Password is required");
  } else {
    if (value.length < 8) errors.push("Must be at least 8 characters");
    if (!/[A-Za-z]/.test(value)) errors.push("Must contain a letter");
    if (!/[0-9]/.test(value)) errors.push("Must contain a number");
  }
  return errors;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Lightweight SVG data URI placeholder used whenever remote image fails to load.
 */
export const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" fill="none"><rect width="100%" height="100%" fill="#f5f5f5"/><rect x="20" y="20" width="560" height="710" rx="16" fill="#ebebeb" stroke="#dedede" stroke-width="2"/><circle cx="300" cy="340" r="48" fill="#d4d4d4"/><path d="M220 500l60-70 50 50 60-80 90 100H220z" fill="#d4d4d4"/><text x="300" y="580" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22" fill="#737373" letter-spacing="2">MIRACLE COLLECTIONS</text><text x="300" y="612" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="14" fill="#a3a3a3">Image Preview Unavailable</text></svg>`
)}`;

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== FALLBACK_IMAGE) {
    target.src = FALLBACK_IMAGE;
  }
}

/**
 * Clean SVG data URI placeholder for user and staff profile avatars.
 */
export const FALLBACK_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="#262626"/><circle cx="50" cy="38" r="18" fill="#e5e5e5"/><path d="M22 84c0-15.5 12.5-28 28-28s28 12.5 28 28" fill="#e5e5e5"/></svg>'
)}`;

export function handleAvatarError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== FALLBACK_AVATAR) {
    target.src = FALLBACK_AVATAR;
  }
}

/**
 * Purchasable stock for a product (optionally for a specific size/colour).
 *
 * Mirrors the availability rule used by the product mapper and the admin
 * inventory view: a product sold in variants is available if its variants hold
 * stock (the selected combination when provided, otherwise the whole variant
 * pool), while a simple product falls back to its product-level stock.
 *
 * Structural typing keeps this dependency-free (no import of the Product type).
 */
export function toStock(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Total purchasable units for a product, using ONE rule everywhere:
 * a product sold in variants sums its variant stock; a variant-less product
 * uses its product-level stock. This is the same rule the product mapper and
 * the admin inventory view apply, so the admin panel and the storefront can
 * never disagree about whether a product has stock.
 */
export function getProductTotalStock(product: {
  stock: number;
  variants?: { stock: number }[];
}): number {
  const variants = product.variants ?? [];
  if (variants.length > 0) return variants.reduce((sum, v) => sum + toStock(v.stock), 0);
  return toStock(product.stock);
}

/** True when at least one purchasable unit exists for the product. */
export function isProductInStock(product: {
  stock: number;
  variants?: { stock: number }[];
}): boolean {
  return getProductTotalStock(product) > 0;
}

export function getAvailableStock(
  product: { stock: number; variants?: { color?: string; size?: string; stock: number }[] },
  color?: string,
  size?: string
): number {
  const variants = product.variants ?? [];
  if (variants.length === 0) return toStock(product.stock);

  // No size/colour selected: the whole variant pool is purchasable.
  if (!color && !size) {
    return variants.reduce((sum, v) => sum + toStock(v.stock), 0);
  }

  // A specific size/colour was selected: prefer the matching variants. Fall
  // back to the whole pool when the selected metadata does not map to a
  // variant row (legacy/seeded products, or size/colour only partly
  // enumerated) so a genuinely stocked product is never blocked from the cart.
  // The exact variant is still validated server-side by `create_order` at
  // checkout, so this lenient client hint is safe.
  const matching = variants.filter(
    (v) => (!color || v.color === color) && (!size || v.size === size)
  );
  const pool = matching.length > 0 ? matching : variants;
  return pool.reduce((sum, v) => sum + toStock(v.stock), 0);
}