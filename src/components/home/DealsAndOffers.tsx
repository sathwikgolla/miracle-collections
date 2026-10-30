"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, Check, Copy, Sparkles, Tag, Truck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/product/ProductCard";
import { discountPercent } from "@/lib/utils";
import type { AdminDealsConfig } from "@/lib/homepageTypes";

const ACTIVE_COUPONS = [
  {
    code: "SAVE10",
    title: "10% OFF",
    subtext: "On your order (up to ₹200 savings)",
    category: "All Fashion & Footwear",
    expiry: "Active Today",
    badge: "Most Popular",
    icon: BadgePercent,
  },
  {
    code: "FLAT100",
    title: "₹100 FLAT OFF",
    subtext: "On orders above ₹1,999",
    category: "Storewide",
    expiry: "Active",
    badge: "Big Saver",
    icon: Tag,
  },
  {
    code: "WELCOME20",
    title: "₹20 INSTANT OFF",
    subtext: "For newly registered customer accounts",
    category: "New Customers",
    expiry: "No Expiry",
    badge: "First Order",
    icon: Sparkles,
  },
  {
    code: "FREE499",
    title: "FREE DELIVERY",
    subtext: "Standard delivery fee waived",
    category: "Orders over ₹499",
    expiry: "Always On",
    badge: "Automatic",
    icon: Truck,
  },
];

export function DealsAndOffers({ config }: { config?: AdminDealsConfig } = {}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { products } = useStore();

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // High discount real products
  const hotDeals = products
    .filter((p) => discountPercent(p.mrp, p.price) >= 50 && p.stock > 0)
    .slice(0, 4);

  const badgeText = config?.badge || "Exclusive Savings";
  const titleText = config?.title || "Offers & Deals";
  const subtitleText = config?.subtitle || "Active discount coupons & limited markdown prices applied at checkout";

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      {/* Optional Admin Featured Deals Banner */}
      {config?.bannerTitle && (
        <div className="mb-8 rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-900 via-neutral-800 to-black p-5 text-white shadow-md sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              {config.bannerTag && (
                <span className="inline-block rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  {config.bannerTag}
                </span>
              )}
              <h3 className="text-lg font-black tracking-tight sm:text-xl">{config.bannerTitle}</h3>
              {config.bannerSubtitle && (
                <p className="text-xs text-neutral-300">{config.bannerSubtitle}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {config.bannerCode && (
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-xs">
                  <span className="text-[10px] text-neutral-300 uppercase">Use Code:</span>
                  <span className="font-mono text-xs font-black tracking-wider text-amber-300">{config.bannerCode}</span>
                </div>
              )}
              {config.bannerLink && (
                <Link
                  href={config.bannerLink}
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-neutral-100"
                >
                  <span>Claim Offer</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
              <BadgePercent size={18} className="text-black" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              {badgeText}
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
            {titleText}
          </h2>
          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            {subtitleText}
          </p>
        </div>
        <Link
          href="/products?sort=discount"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-colors hover:underline"
        >
          View all deals <ArrowRight size={15} />
        </Link>
      </div>

      {/* Coupons Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIVE_COUPONS.map((coupon) => {
          const isCopied = copiedCode === coupon.code;
          return (
            <div
              key={coupon.code}
              className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 transition-all duration-200 hover:border-black/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
                    <coupon.icon size={18} />
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-700">
                    {coupon.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-black tracking-tight text-black">
                    {coupon.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {coupon.subtext}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-neutral-400">
                    Applicable: {coupon.category}
                  </p>
                </div>
              </div>

              {/* Coupon code box & copy button */}
              <div className="mt-4 border-t border-dashed border-neutral-200 pt-3">
                <div className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 p-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                    {coupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    suppressHydrationWarning
                    className="flex items-center gap-1 rounded bg-black px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    {isCopied ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {coupon.expiry}
                  </span>
                  <Link
                    href="/products?sort=discount"
                    className="font-semibold text-black hover:underline"
                  >
                    Apply on cart →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured 50%+ Clearance Deals */}
      {hotDeals.length > 0 && (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="rounded bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Limited Stock Flash Deals
              </span>
              <h3 className="mt-1 text-base font-extrabold text-black sm:text-lg">
                Top Value Steals (50%+ Off)
              </h3>
            </div>
            <Link
              href="/products?sort=discount"
              className="text-xs font-bold text-black hover:underline"
            >
              Shop All Steals →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {hotDeals.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
