"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  Heart,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Zap,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { Rating } from "@/components/ui/Rating";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImageZoom } from "@/components/product/ProductImageZoom";
import { DeliveryChecker } from "@/components/product/DeliveryChecker";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { ProductQA } from "@/components/product/ProductQA";
import {
  cn,
  discountPercent,
  formatCount,
  formatDeliveryDate,
  getAvailableStock,
  handleImageError,
  isProductInStock,
} from "@/lib/utils";
import { getRelatedProductsForCards } from "@/lib/supabase/products-light";

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const {
    addToCart,
    toast,
    isWishlisted,
    toggleWishlist,
    isPriceAlerted,
    togglePriceAlert,
    addRecentlyViewed,
  } = useStore();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState<string | undefined>(
    product.colors[0] ?? undefined
  );
  const [size, setSize] = useState<string | undefined>(product.sizes[0] ?? undefined);
  const [descOpen, setDescOpen] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const wished = isWishlisted(product.id);
  const priceAlerted = isPriceAlerted(product.id);
  const pct = discountPercent(product.mrp, product.price);

  // Cap the quantity selector to the purchasable stock for the selected
  // size/colour (the cart and checkout clamp again server-side).
  const maxQty = Math.max(1, Math.min(10, getAvailableStock(product, color, size)));
  // Whole-product availability (shared rule): disables purchase when every
  // variant (or the product-level stock) is zero.
  const inStock = isProductInStock(product);

  useEffect(() => {
    setQty((q) => Math.min(q, maxQty));
  }, [maxQty]);

  // Fetch related products separately to avoid loading full catalog
  useEffect(() => {
    getRelatedProductsForCards(product.categoryId, product.id, 6).then(setRelatedProducts);
  }, [product.categoryId, product.id]);

  useEffect(() => {
    addRecentlyViewed(product.id);
  }, [product.id, addRecentlyViewed]);

  const requireOptions = () => {
    if (product.colors.length && !color) {
      toast("Please select a color", "error");
      return false;
    }
    if (product.sizes.length && !size) {
      toast("Please select a size", "error");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!requireOptions()) return;
    addToCart(product.id, qty, color, size);
    toast("Added to cart");
  };

  const handleBuyNow = () => {
    if (!requireOptions()) return;
    addToCart(product.id, qty, color, size);
    toast("Proceeding to checkout");
    router.push("/checkout");
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-4 sm:px-6 sm:py-6 min-w-0 overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="mb-4 sm:mb-5 flex max-w-full items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <ChevronRight size={12} className="shrink-0" />
        <Link href="/products" className="hover:text-black">
          Products
        </Link>
        <ChevronRight size={12} className="shrink-0" />
        <Link
          href={`/products?category=${product.categoryId}`}
          className="capitalize hover:text-black"
        >
          {product.categoryId}
        </Link>
        <ChevronRight size={12} className="shrink-0" />
        <span className="truncate text-neutral-700">{product.name}</span>
      </nav>

      <div className="grid w-full min-w-0 gap-6 sm:gap-8 lg:grid-cols-2">
        {/* Gallery with zoom */}
        <div className="w-full min-w-0 lg:sticky lg:top-36 lg:self-start">
          <ProductImageZoom
            images={product.images}
            price={product.price}
            mrp={product.mrp}
            alt={product.name}
          />
        </div>

        {/* Info */}
        <div className="w-full min-w-0">
          <p className="text-xs sm:text-sm font-medium text-neutral-500">{product.brand}</p>
          <h1 className="mt-1 text-xl xs:text-2xl sm:text-3xl font-extrabold leading-tight text-black break-words">
            {product.name}
          </h1>

          <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <Rating value={product.rating} size={15} />
              <span className="text-xs sm:text-sm font-semibold text-black">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-neutral-400">
              {formatCount(product.reviews)} ratings & reviews
            </span>
            {product.stock < 20 && (
              <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                Only {product.stock} left
              </span>
            )}
          </div>

          <div className="mt-3.5 sm:mt-4 w-full min-w-0 rounded-lg bg-neutral-50 p-3 sm:p-4">
            <PriceDisplay price={product.price} mrp={product.mrp} size="lg" />
            {pct > 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                You save <span className="font-semibold text-green-700">₹{(product.mrp - product.price).toLocaleString("en-IN")}</span> on MRP
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500">
              Inclusive of all taxes · Free delivery on orders over ₹499
            </p>
          </div>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mt-4 sm:mt-5 w-full min-w-0">
              <p className="text-xs sm:text-sm font-bold text-black">
                Color: <span className="font-medium text-neutral-500">{color}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    suppressHydrationWarning
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "min-h-[38px] rounded-md border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors touch-manipulation",
                      color === c
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 text-neutral-700 hover:border-black"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-4 sm:mt-5 w-full min-w-0">
              <p className="text-xs sm:text-sm font-bold text-black">
                Size: <span className="font-medium text-neutral-500">{size}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    suppressHydrationWarning
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-h-[38px] min-w-10 sm:min-w-11 rounded-md border px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors touch-manipulation",
                      size === s
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 text-neutral-700 hover:border-black"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + actions */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
            <div>
              <p className="mb-1.5 text-xs sm:text-sm font-bold text-black">Quantity</p>
              <QuantitySelector value={qty} onChange={setQty} max={maxQty} />
            </div>
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 w-full min-w-0">
            <Button
              size="lg"
              variant="outline"
              onClick={handleAddToCart}
              className="h-11 sm:h-12 w-full text-sm sm:text-base font-semibold touch-manipulation"
              disabled={!inStock}
            >
              <ShoppingCart size={18} /> {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
            <Button
              size="lg"
              onClick={handleBuyNow}
              className="h-11 sm:h-12 w-full text-sm sm:text-base font-semibold touch-manipulation"
              disabled={!inStock}
            >
              <Zap size={18} /> Buy Now
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 sm:gap-3 w-full min-w-0">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={cn(
                "inline-flex flex-1 sm:flex-initial min-w-[120px] items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors touch-manipulation",
                wished
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-black"
              )}
            >
              <Heart size={14} className={cn(wished && "fill-white")} />
              <span>{wished ? "In Wishlist" : "Wishlist"}</span>
            </button>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => togglePriceAlert(product.id)}
              className={cn(
                "inline-flex flex-1 sm:flex-initial min-w-[140px] items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors touch-manipulation",
                priceAlerted
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-black"
              )}
            >
              <Bell size={14} />
              <span className="truncate">{priceAlerted ? "Price alert set ✓" : "Price Drop Alert"}</span>
            </button>
          </div>

          {/* Delivery */}
          <div className="mt-5 sm:mt-6 w-full min-w-0 rounded-lg border border-neutral-200 p-3.5 sm:p-4">
            <h3 className="mb-2.5 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm font-bold text-black">
              <Truck size={16} /> Delivery Options
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-600 shrink-0" />
                <span>
                  Free delivery by{" "}
                  <span className="font-semibold text-black">
                    {formatDeliveryDate()}
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-600 shrink-0" />
                <span>Cash on Delivery available</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-600 shrink-0" />
                <span>7-day easy returns & replacement</span>
              </li>
            </ul>
          </div>

          <DeliveryChecker />

          {/* Trust */}
          <div className="mt-3 grid grid-cols-3 gap-2 w-full min-w-0 rounded-lg border border-neutral-200 p-2.5 text-center sm:flex sm:flex-wrap sm:items-center sm:gap-4 sm:px-4 sm:py-3 sm:text-left text-xs font-medium text-neutral-600">
            <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs">
              <ShieldCheck size={16} className="text-black shrink-0" /> Secure payment
            </span>
            <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs">
              <RefreshCcw size={16} className="text-black shrink-0" /> Easy returns
            </span>
            <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs">
              <BadgeCheck size={16} className="text-black shrink-0" /> 100% genuine
            </span>
          </div>
        </div>
      </div>

      {/* Description / specs / reviews */}
      <div className="mt-8 sm:mt-10 grid w-full min-w-0 gap-6 lg:grid-cols-3">
        <div className="w-full min-w-0 lg:col-span-2">
          <div className="w-full min-w-0 rounded-lg border border-neutral-200 overflow-hidden">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setDescOpen((o) => !o)}
              className="flex w-full items-center justify-between p-4 sm:px-5 sm:py-4 text-left text-sm sm:text-base font-bold text-black touch-manipulation"
            >
              <span>Product Description</span>
              <ChevronRight
                size={18}
                className={cn("transition-transform shrink-0", descOpen && "rotate-90")}
              />
            </button>
            {descOpen && (
              <div className="w-full min-w-0 border-t border-neutral-200 p-4 sm:px-5 sm:py-4">
                <p className="w-full min-w-0 break-words text-xs sm:text-sm leading-relaxed text-neutral-600">
                  {product.description}
                </p>

                <h4 className="mb-2.5 sm:mb-3 mt-5 sm:mt-6 text-sm font-bold text-black">Specifications</h4>
                <dl className="w-full min-w-0 divide-y divide-neutral-100 rounded-md border border-neutral-200 overflow-hidden">
                  {product.specifications.map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm"
                    >
                      <dt className="w-full sm:w-44 sm:shrink-0 font-medium text-neutral-500">
                        {s.label}
                      </dt>
                      <dd className="w-full min-w-0 flex-1 font-semibold text-black break-words">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Reviews */}
          <ReviewsSection product={product} />

          {/* Q&A */}
          <ProductQA product={product} />
        </div>

        {/* Related products (desktop sidebar fallback) */}
        <div className="hidden lg:block w-full min-w-0">
          <div className="sticky top-40 rounded-lg border border-neutral-200 p-5">
            <h3 className="mb-3 text-sm font-bold text-black">Related products</h3>
            <div className="space-y-3">
              {relatedProducts.slice(0, 3).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="flex gap-3 rounded-md border border-neutral-100 p-2 transition-colors hover:border-neutral-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className="h-14 w-14 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-semibold text-black">{p.name}</p>
                    <PriceDisplay price={p.price} mrp={p.mrp} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related products grid */}
      <div className="mt-10 sm:mt-12 w-full min-w-0">
        <h2 className="mb-3 sm:mb-4 text-base sm:text-xl font-bold text-black">
          You may also like
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 w-full min-w-0">
          {relatedProducts.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </main>
  );
}
