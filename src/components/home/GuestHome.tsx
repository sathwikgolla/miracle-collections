"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/product/ProductCard";
import { HomeHero } from "@/components/home/HomeHero";
import { CategorySection } from "@/components/home/CategorySection";
import { QuickBenefits } from "@/components/home/QuickBenefits";
import { InTheSpotlight } from "@/components/home/InTheSpotlight";
import { DealsAndOffers } from "@/components/home/DealsAndOffers";
import { EditorialCampaign } from "@/components/home/EditorialCampaign";
import { ShopByOccasion } from "@/components/home/ShopByOccasion";
import { ShopByBudget } from "@/components/home/ShopByBudget";
import { PersonalizedDiscovery } from "@/components/home/PersonalizedDiscovery";
import { WhyShopWithUs } from "@/components/home/WhyShopWithUs";
import { VideoShowcase } from "@/components/home/VideoShowcase";
import { FinalCTA } from "@/components/home/FinalCTA";
import DEFAULT_HOMEPAGE_CONFIG from "@/data/adminHomepage.json";
import type { AdminHomepageConfig } from "@/lib/homepageTypes";

export function HomeSectionHeader({
  icon: Icon,
  badge,
  title,
  subtitle,
  viewAll,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  title: string;
  subtitle?: string;
  viewAll?: string;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
            <Icon size={17} className="text-black" />
          </span>
          {badge && (
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              {badge}
            </span>
          )}
        </div>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{subtitle}</p>
        )}
      </div>
      {viewAll && (
        <Link
          href={viewAll}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-colors hover:underline"
        >
          View all <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

export function GuestHome() {
  const { products } = useStore();
  const [config, setConfig] = useState<AdminHomepageConfig>(
    DEFAULT_HOMEPAGE_CONFIG as unknown as AdminHomepageConfig
  );

  // Sync homepage configuration across local storage, API, and live custom event
  useEffect(() => {
    try {
      const cached = localStorage.getItem("miracle_admin_homepage");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.sections) {
          setConfig(parsed);
        }
      }
    } catch {}

    const loadConfig = async () => {
      try {
        const res = await fetch("/api/homepage");
        if (res.ok) {
          const data = await res.json();
          if (data?.sections) {
            setConfig(data);
            try {
              localStorage.setItem("miracle_admin_homepage", JSON.stringify(data));
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to fetch homepage config:", err);
      }
    };
    loadConfig();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AdminHomepageConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        try {
          const raw = localStorage.getItem("miracle_admin_homepage");
          if (raw) setConfig(JSON.parse(raw));
        } catch {}
      }
    };

    window.addEventListener("miracle_homepage_updated", handleUpdate);
    return () => window.removeEventListener("miracle_homepage_updated", handleUpdate);
  }, []);

  // Real product collections from existing catalog
  const trendingProducts = products
    .filter((p) => p.badges?.includes("Trending"))
    .slice(0, 8);

  const activeSections = [...(config?.sections || DEFAULT_HOMEPAGE_CONFIG.sections)]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <main className="flex-1 pb-10">
      {activeSections.map((sec) => {
        switch (sec.id) {
          case "hero":
            return <HomeHero key="hero" />;
          case "categories":
            return (
              <CategorySection
                key="categories"
                categoryGroups={config.categoryGroups}
              />
            );
          case "quick-benefits":
            return (
              <QuickBenefits
                key="quick-benefits"
                items={config.quickBenefits}
              />
            );
          case "trending":
            return (
              <section key="trending" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
                <HomeSectionHeader
                  icon={TrendingUp}
                  badge={config.trending?.badge || "Popular Demand"}
                  title={config.trending?.title || "Trending Now"}
                  subtitle={
                    config.trending?.subtitle ||
                    "Top customer favorites and most-coveted fashion pieces this week"
                  }
                  viewAll={config.trending?.viewAll || "/products?sort=popular"}
                />

                {/* Mobile horizontal scroll, Tablet/Desktop 4-col grid */}
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                  {trendingProducts.map((p) => (
                    <div key={p.id} className="w-56 shrink-0 sm:w-auto sm:shrink">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </section>
            );
          case "spotlight":
            return (
              <InTheSpotlight
                key="spotlight"
                items={config.spotlightItems}
              />
            );
          case "deals":
            return (
              <DealsAndOffers
                key="deals"
                config={config.deals}
              />
            );
          case "editorial":
            return (
              <EditorialCampaign
                key="editorial"
                editorial={config.editorial}
              />
            );
          case "occasions":
            return (
              <ShopByOccasion
                key="occasions"
                occasions={config.occasions}
              />
            );
          case "discovery":
            return (
              <div key="discovery" id="recommendations" className="pt-10 scroll-mt-20">
                <PersonalizedDiscovery config={config.discovery} />
              </div>
            );
          case "budget":
            return (
              <ShopByBudget
                key="budget"
                tiers={config.budgetTiers}
              />
            );
          case "videos":
            return <VideoShowcase key="videos" />;
          case "why-us":
            return (
              <WhyShopWithUs
                key="why-us"
                items={config.whyUsItems}
              />
            );
          case "final-cta":
            return (
              <FinalCTA
                key="final-cta"
                config={config.finalCta}
              />
            );
          default:
            return null;
        }
      })}
    </main>
  );
}
