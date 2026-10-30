"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice, handleImageError } from "@/lib/utils";
import type { AdminSpotlightItem } from "@/lib/homepageTypes";

interface SpotlightItem {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  price: number;
  image: string;
  href: string;
  order?: number;
  active?: boolean;
}

const SPOTLIGHT_ITEMS: SpotlightItem[] = [
  {
    id: "spotlight-saree-1584",
    brand: "MIRACLE",
    title: "Banarasi Zari Checkered Saree",
    subtitle: "D.No 1584 · With Matching Blouse Piece",
    price: 1899,
    image: "/images/products/saree-1584-purple-model.jpg",
    href: "/product/royal-banarasi-zari-checkered-saree-d-no-1584",
  },
  {
    id: "spotlight-saree-mysore",
    brand: "MIRACLE",
    title: "Mysore Butta Chit Pallu Saree",
    subtitle: "Mysore Silk · Peacock Gold Zari Border",
    price: 2199,
    image: "/images/products/saree-mysore-purple-green.jpg",
    href: "/product/mysore-butta-chit-pallu-purple-green-saree",
  },
  {
    id: "spotlight-saree-floral",
    brand: "MIRACLE",
    title: "Floral Hibiscus Festive Saree",
    subtitle: "Lightweight Silk Blend · Woven Zari Border",
    price: 1499,
    image: "/images/products/saree-floral-yellow.jpg",
    href: "/product/mustard-yellow-floral-hibiscus-zari-saree",
  },
  {
    id: "spotlight-saree-contrast",
    brand: "MIRACLE",
    title: "Traditional Zari Contrast Saree",
    subtitle: "Teal Blue & Mint Green · Geometric Butta",
    price: 1999,
    image: "/images/products/saree-contrast-teal-green.jpg",
    href: "/product/teal-blue-traditional-silk-saree-mint-green-border",
  },
];

export function InTheSpotlight({ items }: { items?: AdminSpotlightItem[] } = {}) {
  const displayItems = (items && items.length > 0 ? items : SPOTLIGHT_ITEMS)
    .filter((i) => i.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  // Manual scroll controls
  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild
      ? (scrollRef.current.firstElementChild as HTMLElement).offsetWidth + 16
      : 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  // Auto-scrolling interval for spotlight cards
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteractingRef.current || !scrollRef.current) return;
      const container = scrollRef.current;
      const cardWidth = container.firstElementChild
        ? (container.firstElementChild as HTMLElement).offsetWidth + 16
        : 320;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScrollLeft - 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      {/* Header (Matching exact screenshot title style) */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl lg:text-3xl">
          In The Spotlight
        </h2>

        {/* Desktop Navigation Chevrons */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-2xs transition-colors hover:border-black hover:text-black"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-2xs transition-colors hover:border-black hover:text-black"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 
        Horizontal Scrolling Spotlight Track:
        - Mobile: Snap-scroll with card peeking on the right (per screenshot).
        - Desktop: Spacious horizontal track with manual & automatic scroll.
      */}
      <div
        ref={scrollRef}
        onMouseEnter={() => {
          isInteractingRef.current = true;
        }}
        onMouseLeave={() => {
          isInteractingRef.current = false;
        }}
        onTouchStart={() => {
          isInteractingRef.current = true;
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            isInteractingRef.current = false;
          }, 3000);
        }}
        className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
      >
        {displayItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative flex w-[84vw] xs:w-[80vw] sm:w-[440px] md:w-[480px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-900 shadow-md transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            {/* Visual Area with Overlay */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                decoding="async"
                onError={handleImageError}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Dark subtle vignette to make top text highly readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/60" />

              {/* Top Banner Content (Exact match to MIVI card in screenshot) */}
              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5 sm:p-4 text-white">
                <div>
                  <span className="text-base sm:text-lg font-black tracking-wider text-white drop-shadow-md">
                    {item.brand}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-white drop-shadow-sm">
                      {item.title}
                    </p>
                    <p className="text-[10px] sm:text-xs font-semibold text-neutral-200">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-300 backdrop-blur-xs">
                    AD
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Golden Ribbon (Exact match to "Just ₹15,999*" strip in screenshot) */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#FDE047] via-[#FACC15] to-[#EAB308] px-4 py-2.5 text-neutral-950 font-black shadow-inner">
              <span className="text-sm sm:text-base font-extrabold tracking-tight">
                Just {formatPrice(item.price)}*
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold transition-transform group-hover:translate-x-1">
                <span>Shop Now</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
