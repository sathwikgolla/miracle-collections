"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Compass,
  Heart,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  X,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/product/ProductCard";
import { HomeHero } from "@/components/home/HomeHero";
import { CategorySection } from "@/components/home/CategorySection";
import { VideoShowcase } from "@/components/home/VideoShowcase";
import { handleImageError } from "@/lib/utils";
import type { User } from "@/lib/types";

export function AuthenticatedHome({ user }: { user: User }) {
  const {
    products,
    recentlyViewed,
    removeRecentlyViewed,
    getProductById,
    wishlist,
    cart,
    orders,
  } = useStore();

  const firstName = user.name ? user.name.trim().split(" ")[0] : "Customer";
  const cartCount = cart.reduce((n, i) => n + i.qty, 0);

  // 1. Continue Shopping (Recently viewed with safe fallback)
  const { continueShoppingProducts, isFallbackHistory } = useMemo(() => {
    const viewed = recentlyViewed
      .map((id) => getProductById(id) || products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    if (viewed.length > 0) {
      return {
        continueShoppingProducts: viewed.slice(0, 4),
        isFallbackHistory: false,
      };
    }

    // Safe fallback if user has not browsed yet: Popular items
    const fallback = [...products]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    return {
      continueShoppingProducts: fallback,
      isFallbackHistory: true,
    };
  }, [recentlyViewed, getProductById, products]);

  // 2. Recommended For You (Based on affinity signals or top rated)
  const recommendedProducts = useMemo(() => {
    const viewed = recentlyViewed;
    const wished = wishlist;
    const cartIds = cart.map((i) => i.productId);

    // Identify user's category affinity
    const interactedProducts = [...viewed, ...wished, ...cartIds]
      .map((id) => getProductById(id) || products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    const categoryCounts: Record<string, number> = {};
    for (const p of interactedProducts) {
      categoryCounts[p.categoryId] = (categoryCounts[p.categoryId] || 0) + 1;
    }

    const preferredCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    const excludeIds = new Set([...viewed, ...cartIds]);

    if (preferredCategory) {
      const categoryMatches = products
        .filter((p) => p.categoryId === preferredCategory && !excludeIds.has(p.id))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);

      if (categoryMatches.length >= 4) {
        return categoryMatches;
      }
    }

    // Fallback: top-rated picks excluding cart
    return products
      .filter((p) => !cartIds.includes(p.id))
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 4);
  }, [recentlyViewed, wishlist, cart, getProductById, products]);

  // 3. New Arrivals (Filter products with "New" badge or latest)
  const taggedArrivals = products.filter((p) => p.badges.includes("New"));
  const newArrivals = taggedArrivals.length >= 4 ? taggedArrivals.slice(0, 4) : products.slice(0, 4);

  return (
    <main className="flex-1 pb-16">
      {/* 1. Hero Section (Identical to Homepage Hero Section) */}
      <HomeHero />

      {/* Member Welcome & Quick Status Strip */}
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-bold text-white shrink-0">
              {firstName.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-black">
                  Welcome back, {firstName}!
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Sparkles size={10} /> Member Active
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Miracle Member Experience · Your personalized shopping picks are ready below
              </p>
            </div>
          </div>

          {/* Quick status summary chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-700">
            <Link
              href="/orders"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 shadow-xs transition-colors hover:border-black hover:text-black"
            >
              <Package size={13} />
              <span>{orders.length} {orders.length === 1 ? "Order" : "Orders"}</span>
            </Link>
            <Link
              href="/wishlist"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 shadow-xs transition-colors hover:border-black hover:text-black"
            >
              <Heart size={13} />
              <span>{wishlist.length} Wishlist</span>
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 shadow-xs transition-colors hover:border-black hover:text-black"
            >
              <ShoppingCart size={13} />
              <span>{cartCount} in Bag</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Continue Shopping / Recently Viewed */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
                <Clock size={17} className="text-black" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {isFallbackHistory ? "Explore To Get Started" : "Recent Browsing History"}
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
              Continue Shopping
            </h2>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              {isFallbackHistory
                ? "Items you open will appear here. In the meantime, here are popular customer favorites."
                : "Pick up right where you left off with items you recently viewed."}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-colors hover:underline"
          >
            Browse all products <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {continueShoppingProducts.map((p) => (
            <div key={p.id} className="relative">
              {!isFallbackHistory && (
                <button
                  onClick={() => removeRecentlyViewed(p.id)}
                  aria-label="Remove from recently viewed"
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow hover:text-black"
                >
                  <X size={14} />
                </button>
              )}
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* 3. Recommended For You */}
      <section id="recommendations" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
                <Sparkles size={17} className="text-black" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Personalized Picks
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
              Recommended For You
            </h2>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              Styles and footwear curated to match your aesthetic and recent interests.
            </p>
          </div>
          <Link
            href="/products?sort=rating"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-colors hover:underline"
          >
            View more recommendations <ArrowRight size={15} />
          </Link>
        </div>

        {/* Responsive horizontal scroll on mobile, 4-col grid on tablet/desktop */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {recommendedProducts.map((p) => (
            <div key={p.id} className="w-56 shrink-0 sm:w-auto sm:shrink">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Shop by Category (Identical to Homepage CategorySection) */}
      <CategorySection />

      {/* 5. New Arrivals */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
                <TrendingUp size={17} className="text-black" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Fresh Drops
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
              New Arrivals
            </h2>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              The newest additions to our seasonal clothing and footwear lines.
            </p>
          </div>
          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-colors hover:underline"
          >
            View all new arrivals <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 6. Special Offer / Promotional Banner */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 px-4 py-8 text-white shadow-lg sm:px-12 lg:px-16 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-black opacity-90" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-300 backdrop-blur-sm">
                <Sparkles size={13} className="text-amber-400" />
                Member Exclusive Highlight
              </span>

              <h2 className="mt-4 text-2xl xs:text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Refresh Your Style
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-neutral-300 sm:text-base">
                Explore the latest clothing and footwear picks.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-400 lg:justify-start">
                <span>✓ 100% Genuine Apparel</span>
                <span>✓ Doorstep Delivery & Easy Returns</span>
                <span>✓ Verified Customer Satisfaction</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-6 sm:px-8 text-sm font-extrabold text-black transition-all hover:bg-neutral-100 hover:shadow-md"
              >
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link
                href="/products?sort=discount"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
              >
                View Offers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Watch & Discover Video Showcase (Member stream unlocked) */}
      <VideoShowcase />

      {/* 7. Personalized Account Quick Actions */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
              <Compass size={17} className="text-black" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Your Dashboard
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
            Account Quick Actions
          </h2>
          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            Quickly jump into your orders, saved favorites, cart, or profile settings.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* My Orders */}
          <Link
            href="/orders"
            className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-black hover:shadow-md"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-black transition-colors group-hover:bg-black group-hover:text-white">
                <Package size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-black">My Orders</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Track pending shipments, review order history, and request returns.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs font-bold text-black">
              <span>{orders.length} {orders.length === 1 ? "Order" : "Orders"} Placed</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-black hover:shadow-md"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-black transition-colors group-hover:bg-black group-hover:text-white">
                <Heart size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-black">Wishlist</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Check prices and availability for the styles you&apos;ve saved for later.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs font-bold text-black">
              <span>{wishlist.length} {wishlist.length === 1 ? "Item" : "Items"} Saved</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-black hover:shadow-md"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-black transition-colors group-hover:bg-black group-hover:text-white">
                <ShoppingCart size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-black">Cart</h3>
              <p className="mt-1 text-xs text-neutral-500">
                View items ready in your shopping bag and proceed to checkout.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs font-bold text-black">
              <span>{cartCount} {cartCount === 1 ? "Item" : "Items"} in Bag</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-black hover:shadow-md"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-black transition-colors group-hover:bg-black group-hover:text-white">
                <UserIcon size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-black">Profile</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Manage your name, mobile number, saved delivery addresses, and password.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs font-bold text-black">
              <span className="truncate max-w-[140px]">{user.email}</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
