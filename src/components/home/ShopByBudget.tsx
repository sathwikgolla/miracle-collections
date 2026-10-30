"use client";

import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { handleImageError } from "@/lib/utils";
import type { AdminBudgetTier } from "@/lib/homepageTypes";

const BUDGET_TIERS: AdminBudgetTier[] = [
  {
    id: "budget-499",
    label: "Under ₹499",
    description: "Cotton t-shirts, basic tops, socks & everyday essentials",
    href: "/products?maxPrice=499",
    badge: "Budget Friendly",
    popular: "Pure Cotton Tees, Relaxed Tops",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    order: 1,
    active: true,
  },
  {
    id: "budget-999",
    label: "Under ₹999",
    description: "Printed kurtis, casual footwear & kids festive sets",
    href: "/products?maxPrice=999",
    badge: "Sweet Spot",
    popular: "Anarkali Sets, Wedge Sandals",
    image: "https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=400&q=80",
    order: 2,
    active: true,
  },
  {
    id: "budget-1499",
    label: "Under ₹1,499",
    description: "Denim jackets, casual sneakers & formal trousers",
    href: "/products?maxPrice=1499",
    badge: "Most Popular",
    popular: "Denim Outerwear, Walk Sneakers",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80",
    order: 3,
    active: true,
  },
  {
    id: "budget-2499",
    label: "Under ₹2,499",
    description: "High-top boots, formal leather brogues & festive suits",
    href: "/products?maxPrice=2499",
    badge: "Premium Finds",
    popular: "Street Boots, Leather Brogues",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
    order: 4,
    active: true,
  },
];

export function ShopByBudget({ tiers }: { tiers?: AdminBudgetTier[] } = {}) {
  const displayTiers = (tiers && tiers.length > 0 ? tiers : BUDGET_TIERS)
    .filter((t) => t.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
              <Wallet size={17} className="text-black" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Price-Smart Curation
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
            Shop By Budget
          </h2>
          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            Trendy styles and quality footwear tailored to suit your pocket
          </p>
        </div>
        <Link
          href="/products?sort=price-low"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-colors hover:underline"
        >
          Sort low to high <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {displayTiers.map((tier) => (
          <Link
            key={tier.id || tier.label}
            href={tier.href}
            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-black/30 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-700">
                  {tier.badge}
                </span>
                <span className="text-xs font-bold text-neutral-400 group-hover:text-black">
                  Explore →
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tier.image}
                    alt={tier.label}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-black">
                    {tier.label}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">
                    {tier.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-neutral-100 pt-3">
              <p className="text-[11px] font-medium text-neutral-400">
                Popular: <span className="font-semibold text-neutral-700">{tier.popular}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
