"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, GitCompareArrows, Heart, ShoppingCart, Bell } from "lucide-react";
import type { Product } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { Rating } from "@/components/ui/Rating";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { StockBadge } from "@/components/product/StockBadge";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { cn, discountPercent, formatCount, handleImageError } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  className?: string;
}

export function ProductCard({ product, showAddToCart = true, className }: ProductCardProps) {
  const { isWishlisted, toggleWishlist, addToCart, toast, toggleCompare, isCompared, isNotified, toggleNotify } = useStore();
  const [quickView, setQuickView] = useState(false);

  const wished = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const notified = isNotified(product.id);
  const pct = discountPercent(product.mrp, product.price);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    stop(e);
    toggleWishlist(product.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    stop(e);
    toggleCompare(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    stop(e);
    addToCart(product.id);
    toast("Added to cart");
  };

  const badges = product.badges.map((b) =>
    b === "Trending" ? { text: "POPULAR", cls: "border-black bg-white text-black" } : b === "Best Seller" ? { text: "BEST SELLER", cls: "bg-black text-white" } : { text: "NEW", cls: "bg-black text-white" }
  );

  return (
    <>
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md",
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Top-left badges */}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {badges.map((b, index) => (
              <span
                key={`${b.text}-${index}`}
                className={cn("rounded px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide", b.cls)}
              >
                {b.text}
              </span>
            ))}
            {pct > 0 && (
              <span className="rounded bg-green-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {pct}% OFF
              </span>
            )}
          </div>

          {/* Top-right actions */}
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button
              suppressHydrationWarning
              onClick={handleWishlist}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-neutral-50",
                wished && "text-black"
              )}
            >
              <Heart size={15} className={cn(wished && "fill-black")} />
            </button>
            <button
              suppressHydrationWarning
              onClick={handleCompare}
              aria-label={compared ? "Remove from compare" : "Add to compare"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors",
                compared ? "bg-black text-white" : "text-neutral-500 hover:text-black"
              )}
            >
              <GitCompareArrows size={15} />
            </button>
          </div>

          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="rounded bg-black px-3 py-1 text-xs font-bold text-white">Out of stock</span>
            </div>
          )}

          {/* Quick view on hover */}
          <button
            suppressHydrationWarning
            onClick={(e) => {
              stop(e);
              setQuickView(true);
            }}
            className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center gap-1.5 bg-black/80 text-xs font-semibold text-white backdrop-blur transition-opacity sm:hidden sm:group-hover:flex"
          >
            <Eye size={14} /> Quick View
          </button>
        </div>

        <div className="flex flex-1 flex-col p-2.5 sm:p-3">
          <p className="truncate text-xs text-neutral-500">{product.brand}</p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-black">
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-center gap-1">
            <Rating value={product.rating} size={12} />
            <span className="text-[11px] text-neutral-400">({formatCount(product.reviews)})</span>
          </div>

          <div className="mt-2">
            <PriceDisplay price={product.price} mrp={product.mrp} size="sm" />
          </div>

          <div className="mt-1.5">
            <StockBadge stock={product.stock} />
          </div>

          {showAddToCart && (
            product.stock === 0 ? (
              <button
                suppressHydrationWarning
                onClick={(e) => { stop(e); toggleNotify(product.id); }}
                className={cn(
                  "mt-3 inline-flex h-9 w-full items-center justify-center gap-1 sm:gap-1.5 rounded-md border border-black px-2 text-[11px] sm:text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white",
                  notified && "bg-black text-white"
                )}
              >
                <Bell size={13} className="shrink-0" />
                <span className="truncate">{notified ? "Notified ✓" : "Notify Me"}</span>
              </button>
            ) : (
              <button
                suppressHydrationWarning
                onClick={handleAddToCart}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1 sm:gap-1.5 rounded-md border border-black px-2 text-[11px] sm:text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white"
              >
                <ShoppingCart size={13} className="shrink-0" />
                <span className="truncate">Add to Cart</span>
              </button>
            )
          )}
        </div>
      </Link>

      <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}