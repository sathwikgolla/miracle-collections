"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Star } from "lucide-react";
import { formatPrice, handleImageError } from "@/lib/utils";
import type { AdminBanner } from "@/lib/adminTypes";
import { SEED_BANNERS } from "@/data/adminSeed";

interface HeroProduct {
  id: string;
  title: string;
  tagline: string;
  category: string;
  badge: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  image: string;
  href: string;
}

function bannerToHeroItem(b: AdminBanner): HeroProduct {
  return {
    id: b.id,
    title: b.title,
    tagline: b.subtitle || "",
    category: b.category || "Heritage Weaves",
    badge: b.badge || "Featured Edit",
    price: b.price ?? 1999,
    mrp: b.mrp ?? 4999,
    rating: b.rating ?? 4.8,
    reviews: b.reviews ?? 150,
    image: b.image,
    href: b.link || "/products",
  };
}

const INITIAL_HERO_ITEMS: HeroProduct[] = SEED_BANNERS.filter((b) => b.active !== false).map(bannerToHeroItem);

function getUncroppedImageUrl(url: string): string {
  if (!url) return url;
  return url.replace("&fit=crop", "&fit=max").replace("?fit=crop&", "?fit=max&");
}

export function HomeHero() {
  const [heroItems, setHeroItems] = useState<HeroProduct[]>(INITIAL_HERO_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load live banners from server API and client storage, listening for admin changes
  useEffect(() => {
    const syncBanners = (list: AdminBanner[]) => {
      if (Array.isArray(list) && list.length > 0) {
        const active = list.filter((b) => b.active !== false);
        const mapped = (active.length > 0 ? active : list).map(bannerToHeroItem);
        setHeroItems(mapped);
      }
    };

    const loadBanners = async () => {
      // 1. Try server API
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            syncBanners(data);
            try {
              localStorage.setItem("miracle_admin_banners", JSON.stringify(data));
            } catch {}
            return;
          }
        }
      } catch {}

      // 2. Fallback to client localStorage
      try {
        const raw = localStorage.getItem("miracle_admin_banners");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            syncBanners(parsed);
          }
        }
      } catch {}
    };

    loadBanners();

    const handleUpdate = () => {
      try {
        const raw = localStorage.getItem("miracle_admin_banners");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            syncBanners(parsed);
            return;
          }
        }
      } catch {}
      loadBanners();
    };

    window.addEventListener("miracle_banners_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("miracle_banners_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  // Desktop slider controls
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? Math.max(heroItems.length - 1, 0) : prev - 1));
  };

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= heroItems.length - 1 ? 0 : prev + 1));
  }, [heroItems.length]);

  // Scroll mobile container to specific card index smoothly
  const scrollToMobileCard = useCallback((index: number) => {
    if (!mobileContainerRef.current) return;
    const container = mobileContainerRef.current;
    const card = container.children[index] as HTMLElement;
    if (card) {
      const firstChild = container.firstElementChild as HTMLElement | null;
      const targetLeft = firstChild ? card.offsetLeft - firstChild.offsetLeft : card.offsetLeft;
      container.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      });
    }
  }, []);

  // Automatic scrolling interval for both mobile horizontal cards and desktop spotlight
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteractingRef.current) return;

      setCurrentIndex((prev) => {
        if (heroItems.length <= 1) return prev;
        const next = (prev + 1) % heroItems.length;
        scrollToMobileCard(next);
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [scrollToMobileCard, heroItems.length]);

  // Track mobile manual scroll position to sync active index and dot indicators
  const handleMobileScroll = () => {
    if (!mobileContainerRef.current) return;
    const container = mobileContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const firstChild = container.firstElementChild as HTMLElement | null;
    if (!firstChild) return;

    const secondChild = firstChild.nextElementSibling as HTMLElement | null;
    const step = secondChild
      ? secondChild.offsetLeft - firstChild.offsetLeft
      : firstChild.offsetWidth;

    if (step > 0) {
      const index = Math.round(scrollLeft / step);
      if (index >= 0 && index < heroItems.length) {
        setCurrentIndex(index);
      }
    }
  };

  const safeIndex = currentIndex >= heroItems.length ? 0 : currentIndex;
  const activeProduct = heroItems[safeIndex] || heroItems[0] || INITIAL_HERO_ITEMS[0];

  return (
    <section className="relative mx-auto max-w-7xl px-3 xs:px-4 pt-1.5 sm:pt-3 sm:px-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. MOBILE VIEW: Wide Horizontal Promotional Banner Carousel (Flipkart Style) */}
      {/* ----------------------------------------------------------------- */}
      <div className="block lg:hidden">
        <div
          ref={mobileContainerRef}
          onScroll={handleMobileScroll}
          onTouchStart={() => {
            isInteractingRef.current = true;
          }}
          onTouchEnd={() => {
            setTimeout(() => {
              isInteractingRef.current = false;
            }, 3000);
          }}
          className="flex w-full gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {heroItems.map((prod, index) => (
            <Link
              key={prod.id}
              href={prod.href}
              className={`group relative flex w-full shrink-0 snap-center snap-always overflow-hidden rounded-2xl border transition-all duration-300 shadow-md ${
                index === currentIndex
                  ? "border-amber-500/40 shadow-lg"
                  : "border-neutral-800"
              } bg-gradient-to-r from-[#121118] via-[#1B1824] to-[#121118] text-white h-[165px] xs:h-[178px] sm:h-[195px]`}
            >
              {/* Festive Top Lighting Trim (Flipkart style garland lights) */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-4 z-20 flex justify-between items-center px-4 overflow-hidden opacity-85">
                <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-amber-400/25 via-amber-300/10 to-transparent" />
                <div className="relative z-10 w-full flex justify-around">
                  {[...Array(12)].map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b] ${
                        i % 3 === 0
                          ? "h-1.5 w-1.5 opacity-90"
                          : i % 2 === 0
                          ? "h-1 w-1 opacity-75"
                          : "h-0.5 w-0.5 opacity-60"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Festive Bottom Lighting Trim */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 z-20 flex justify-between items-center px-4 overflow-hidden opacity-75">
                <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-amber-400/20 via-amber-300/5 to-transparent" />
                <div className="relative z-10 w-full flex justify-around">
                  {[...Array(10)].map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block rounded-full bg-amber-400 shadow-[0_0_5px_#f59e0b] ${
                        i % 2 === 0 ? "h-1 w-1 opacity-80" : "h-0.5 w-0.5 opacity-50"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Background Ambient Glow */}
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />

              {/* Left Column: Promotional Text & Offer Details */}
              <div className="relative z-10 flex flex-col justify-between p-2.5 xs:p-3 w-[48%] xs:w-[47%] shrink-0">
                <div>
                  {/* Brand & Category Header */}
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[11px] xs:text-xs font-black uppercase tracking-wider text-white drop-shadow-xs">
                      MIRACLE
                    </span>
                    <span className="text-amber-400/60 text-[10px]">·</span>
                    <span className="text-[9px] xs:text-[10px] font-extrabold uppercase tracking-wide text-amber-300 truncate">
                      {prod.category}
                    </span>
                  </div>

                  {/* Product Title / Headline */}
                  <h3 className="mt-1 text-xs xs:text-sm font-black text-white leading-tight line-clamp-1 drop-shadow-xs group-hover:text-amber-200 transition-colors">
                    {prod.title}
                  </h3>

                  {/* Price Highlight */}
                  <div className="mt-1 flex items-baseline gap-1.5 leading-none">
                    <span className="text-[9.5px] xs:text-[10.5px] font-bold text-neutral-300">From</span>
                    <span className="text-sm xs:text-base font-black text-amber-300 drop-shadow-xs">
                      {formatPrice(prod.price)}
                    </span>
                    <span className="text-[9.5px] xs:text-[10.5px] text-neutral-400 line-through">
                      {formatPrice(prod.mrp)}
                    </span>
                  </div>

                  {/* Subtitle / Tagline */}
                  <p className="mt-0.5 text-[8.5px] xs:text-[9.5px] text-neutral-300 leading-tight line-clamp-1">
                    {prod.tagline}
                  </p>
                </div>

                {/* Bottom Row: Offer Badges & CTA */}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[8px] xs:text-[9px] font-black text-neutral-900 shadow-xs">
                    <span className="text-amber-600 font-black">⚡</span> 10% OFF UPI
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-400 px-2 py-0.5 text-[8px] xs:text-[9px] font-black text-neutral-950 shadow-xs group-hover:bg-amber-300 transition-colors">
                    Shop Now <ArrowRight size={9} />
                  </span>
                </div>
              </div>

              {/* Right Column: Product Image Showcase (Maximized to fill frame) */}
              <div className="relative z-10 w-[52%] xs:w-[53%] h-full flex items-center justify-center py-1 pr-1.5 pl-0.5 xs:py-1.5 xs:pr-2 xs:pl-0.5">
                {/* Festive Starburst / Top-Right Badge */}
                <div className="absolute top-1.5 right-1.5 z-20">
                  <span className="inline-flex items-center gap-0.5 rounded-sm bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-1.5 py-0.5 text-[8px] xs:text-[9px] font-black uppercase text-neutral-950 shadow-md tracking-wider">
                    <Sparkles size={8.5} className="fill-neutral-950 text-neutral-950" />
                    {prod.badge.includes("%") ? prod.badge : "FESTIVE"}
                  </span>
                </div>

                {/* Showcase Window Frame - Fills entire frame with product image */}
                <div className="relative h-full w-full rounded-xl bg-white p-0 flex items-center justify-center shadow-md overflow-hidden border border-amber-300/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getUncroppedImageUrl(prod.image)}
                    alt={prod.title}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    onError={handleImageError}
                    className="relative z-10 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Carousel Pagination Indicators (Flipkart-style dash pills) */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {heroItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                scrollToMobileCard(idx);
              }}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-6 bg-neutral-900"
                  : "w-3.5 bg-neutral-300 hover:bg-neutral-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. DESKTOP VIEW: Sleek, Light & Modern Spotlight (No Maroon)    */}
      {/* ------------------------------------------------------------- */}
      <div
        className="hidden lg:block"
        onMouseEnter={() => {
          isInteractingRef.current = true;
        }}
        onMouseLeave={() => {
          isInteractingRef.current = false;
        }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-[#FFFDF9] via-[#FAF7F2] to-[#F5EFEB] text-neutral-900 shadow-md">
          <div className="relative z-10 grid grid-cols-12 items-center gap-6 p-4 lg:py-4.5 lg:px-6">
            {/* Left Content (6 Cols) */}
            <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-neutral-800 shadow-2xs">
                  <Sparkles size={11} className="text-amber-500" />
                  Curated Premium Spotlight
                </span>
                <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  {activeProduct.badge}
                </span>
              </div>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-neutral-950 lg:text-2xl">
                {activeProduct.title}
              </h2>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-neutral-600 line-clamp-2">
                {activeProduct.tagline}. Handcrafted with master artisanal precision, pure breathable fabrics, and everyday comfort.
              </p>

              {/* Price & Rating */}
              <div className="mt-2.5 flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-neutral-950">
                    {formatPrice(activeProduct.price)}
                  </span>
                  <span className="text-xs text-neutral-400 line-through">
                    {formatPrice(activeProduct.mrp)}
                  </span>
                </div>
                <div className="h-3.5 w-px bg-neutral-200" />
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <Star size={12} className="fill-amber-500" />
                  <span className="font-bold text-neutral-900">{activeProduct.rating}</span>
                  <span className="text-neutral-500 text-[11px]">({activeProduct.reviews} reviews)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={activeProduct.href}
                  className="group inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-xs font-extrabold text-white shadow-md transition-all hover:bg-black hover:-translate-y-0.5"
                >
                  <span>Start Shopping</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#recommendations"
                  onClick={(e) => {
                    const el = document.getElementById("recommendations") || document.getElementById("categories");
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-neutral-300 bg-white px-3.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-black hover:text-black"
                >
                  View Recommendations
                </a>
              </div>

              {/* Desktop Slider Controls */}
              <div className="mt-3 flex items-center gap-3 border-t border-neutral-200/80 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Featured 0{currentIndex + 1} / 0{heroItems.length}
                </span>
                <div className="flex gap-1.5">
                  {heroItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? "w-6 bg-neutral-900" : "w-2 bg-neutral-300 hover:bg-neutral-400"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous product"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-2xs transition-colors hover:border-black hover:text-black"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next product"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-2xs transition-colors hover:border-black hover:text-black"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Product Spotlight Image (6 Cols) - Increased width & height */}
            <div className="col-span-12 lg:col-span-6">
              <div className="relative h-60 lg:h-64 xl:h-72 w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-900 shadow-sm flex items-center justify-center p-0 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getUncroppedImageUrl(activeProduct.image)}
                  alt={activeProduct.title}
                  loading="eager"
                  decoding="async"
                  onError={handleImageError}
                  className="relative z-10 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-2xl z-20" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white pointer-events-none z-30">
                  <span className="text-xs font-bold truncate max-w-[240px] drop-shadow-sm">
                    {activeProduct.title}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 drop-shadow-sm">
                    Miracle Signature
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
