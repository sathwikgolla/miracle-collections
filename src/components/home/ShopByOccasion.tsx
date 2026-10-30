"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { handleImageError } from "@/lib/utils";
import type { AdminOccasionItem } from "@/lib/homepageTypes";

const OCCASIONS: AdminOccasionItem[] = [
  {
    id: "occ-casual",
    title: "College & Casual",
    tagline: "Breathable tees, everyday denims & cool kicks",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80",
    href: "/products?category=men",
    badge: "Everyday Fit",
    order: 1,
    active: true,
  },
  {
    id: "occ-office",
    title: "Office & Workwear",
    tagline: "Elegant kurtis, crisp shirts & smart footwear",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
    href: "/products?category=women",
    badge: "Formal & Smart",
    order: 2,
    active: true,
  },
  {
    id: "occ-party",
    title: "Party & Celebrations",
    tagline: "Vibrant ethnic sets, heels & statement accents",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    href: "/products?category=women",
    badge: "Festive Vibes",
    order: 3,
    active: true,
  },
  {
    id: "occ-vacation",
    title: "Vacation & Weekend",
    tagline: "Relaxed jackets, canvas espadrilles & travel gear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    href: "/products?category=footwear",
    badge: "Holiday Ready",
    order: 4,
    active: true,
  },
  {
    id: "occ-kids",
    title: "Kids' Festivities",
    tagline: "Cotton-silk kurta sets & adorable party frocks",
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=600&q=80",
    href: "/products?category=kids",
    badge: "Little Smiles",
    order: 5,
    active: true,
  },
  {
    id: "occ-active",
    title: "Active & Athleisure",
    tagline: "Comfort training sneakers, knit joggers & active fits",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    href: "/products?category=footwear",
    badge: "Active Fit",
    order: 6,
    active: true,
  },
];

export function ShopByOccasion({ occasions }: { occasions?: AdminOccasionItem[] } = {}) {
  const displayOccasions = (occasions && occasions.length > 0 ? occasions : OCCASIONS)
    .filter((o) => o.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
              <Compass size={17} className="text-black" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Find Your Moment
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
            What Are You Shopping For?
          </h2>
          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            Discover curated outfits tailored for your specific lifestyle and special occasions
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-colors hover:underline"
        >
          Explore all looks <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {displayOccasions.map((occ) => (
          <Link
            key={occ.id || occ.title}
            href={occ.href}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-black/30 hover:shadow-md"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={occ.image}
                alt={occ.title}
                loading="lazy"
                decoding="async"
                onError={handleImageError}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {occ.badge && (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-black backdrop-blur-xs">
                  {occ.badge}
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <h3 className="text-sm font-extrabold leading-snug group-hover:underline">
                  {occ.title}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral-300">
                  {occ.tagline}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
