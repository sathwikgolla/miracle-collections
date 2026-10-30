"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { handleImageError } from "@/lib/utils";
import type { AdminEditorialCampaign } from "@/lib/homepageTypes";

const DEFAULT_EDITORIAL: AdminEditorialCampaign = {
  badge: "Editorial Showcase · Season '26",
  headline: "The Symphony of Heritage & Modernity",
  tagline: "The Sovereign Edit — Harmonized silhouettes tailored for festive poise and daily splendour.",
  pullQuote: "True elegance lies in the quiet harmony of honest craftsmanship, breathable natural fibers, and timeless silhouettes.",
  description: "Our latest campaign celebrates the art of refined dressing. From flowing zari-embroidered anarkalis to tailored oxford shirts and hand-stitched leather footwear, every piece is curated to transition seamlessly from festive celebrations to everyday occasions.",
  bullets: [
    "100% Pure Combed Cotton, Rayon & Silk Blends",
    "Hand-finished Zari Embroidery & Artisanal Stitching",
    "Tailored Contemporary Fits Designed for Modern Living",
    "Direct Artisan Sourcing with Zero Intermediary Markups"
  ],
  primaryImage: "/images/products/saree-1584-purple-model.jpg",
  primaryBadge: "Editorial · Autumn-Winter '26",
  primaryTitle: "The Sovereign Edit",
  primarySubtitle: "Harmonized silhouettes tailored for festive poise and daily splendour.",
  secondaryImage: "/images/products/saree-mysore-purple-green.jpg",
  secondaryTag: "Mysore Silk & Zari",
  secondaryTitle: "Chit Pallu Artistry",
  tertiaryImage: "/images/products/saree-floral-yellow.jpg",
  tertiaryTag: "Woven Gold Border",
  tertiaryTitle: "Festive Hibiscus Drape",
  ctaPrimaryText: "Shop The Campaign",
  ctaPrimaryLink: "/products?sort=newest",
  ctaSecondaryText: "Explore Festive Styles",
  ctaSecondaryLink: "/products?category=clothing&gender=women"
};

export function EditorialCampaign({ editorial }: { editorial?: AdminEditorialCampaign } = {}) {
  const ed = editorial || DEFAULT_EDITORIAL;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      {/* Editorial Campaign Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#FAF7F2] via-[#FFFDF9] to-[#F5EFEB] shadow-xl">
        {/* Subtle decorative background flourishes */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#58111A]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative z-10 grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
          {/* Left Column: Visual Magazine Story Images (7 Cols Desktop) */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
              {/* Primary Campaign Feature Image (7 Cols on sm) */}
              <div className="group relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/50 bg-[#2A050D] shadow-xl sm:col-span-7">
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ed.primaryImage}
                    alt={ed.primaryTitle || "Miracle Collections Editorial Saree Showcase"}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2A050D] via-transparent to-transparent opacity-85" />

                  {/* Top Stamp */}
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full border border-[#D4AF37] bg-[#2A050D]/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#F3E5AB] backdrop-blur-md">
                      {ed.primaryBadge}
                    </span>
                  </div>

                  {/* Bottom Text Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#DFB15B]">
                      Haute Couture Capsule
                    </p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
                      {ed.primaryTitle}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-300">
                      {ed.primarySubtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supporting Secondary Craft Detail Shots (5 Cols on sm) */}
              <div className="flex flex-col gap-4 sm:col-span-5">
                {/* Textile Detail Vignette */}
                <div className="group relative overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-white shadow-md">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ed.secondaryImage}
                      alt={ed.secondaryTitle}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#DFB15B]">
                        {ed.secondaryTag}
                      </span>
                      <p className="text-xs font-bold text-white">{ed.secondaryTitle}</p>
                    </div>
                  </div>
                </div>

                {/* Handcrafted Saree Detail Vignette */}
                <div className="group relative overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-white shadow-md">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ed.tertiaryImage}
                      alt={ed.tertiaryTitle}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#DFB15B]">
                        {ed.tertiaryTag}
                      </span>
                      <p className="text-xs font-bold text-white">{ed.tertiaryTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Narrative & Clear Shopping Actions (5 Cols Desktop) */}
          <div className="flex flex-col justify-center lg:col-span-5">
            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-[#58111A] text-[#F3E5AB]">
                <Sparkles size={16} />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#58111A]">
                {ed.badge}
              </span>
            </div>

            {/* Campaign Headline */}
            <h2 className="mt-3 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
              {ed.headline}
            </h2>

            {/* Pull Quote */}
            {ed.pullQuote && (
              <blockquote className="mt-4 border-l-2 border-[#D4AF37] pl-4 text-xs italic text-neutral-700 sm:text-sm">
                &ldquo;{ed.pullQuote}&rdquo;
              </blockquote>
            )}

            {/* Story Paragraph */}
            <p className="mt-4 text-xs leading-relaxed text-neutral-600 sm:text-sm sm:leading-relaxed">
              {ed.description}
            </p>

            {/* Quality Checkpoints */}
            {ed.bullets && ed.bullets.length > 0 && (
              <div className="mt-5 space-y-2 text-xs font-semibold text-neutral-800">
                {ed.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#58111A] shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clear Shopping Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={ed.ctaPrimaryLink || "/products"}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#4A0E17] via-[#5B1422] to-[#6E1A2C] px-7 text-sm font-extrabold text-[#F3E5AB] shadow-md shadow-[#4A0E17]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4A0E17]/30"
              >
                <span>{ed.ctaPrimaryText}</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              {ed.ctaSecondaryText && (
                <Link
                  href={ed.ctaSecondaryLink || "/products"}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-bold text-neutral-800 transition-colors hover:border-[#58111A] hover:bg-[#FAF6F0] hover:text-[#58111A]"
                >
                  {ed.ctaSecondaryText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
