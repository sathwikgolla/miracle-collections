"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { handleImageError } from "@/lib/utils";
import type { AdminCategoryGroupCard } from "@/lib/homepageTypes";

interface CategorySubItem {
  name: string;
  href: string;
  image: string;
}

interface CategoryGroupCard {
  id: string;
  title: string;
  href: string;
  items: [CategorySubItem, CategorySubItem];
  order?: number;
  active?: boolean;
}

// Exactly 10 categories and subcategories grouped in 5 curated dual-item cards (matching the provided design)
const TEN_CATEGORIES_GROUPS: CategoryGroupCard[] = [
  {
    id: "grp-royal-ethnic",
    title: "Royal Ethnic & Festive",
    href: "/products?category=clothing",
    items: [
      {
        name: "Kurta Sets",
        href: "/products?category=clothing&subcategory=kurta-sets",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Silk Sarees",
        href: "/products?category=clothing&subcategory=sarees",
        image: "/images/products/saree-1584-purple-model.jpg",
      },
    ],
  },
  {
    id: "grp-contemporary-women",
    title: "Contemporary Styles",
    href: "/products?category=clothing&gender=women",
    items: [
      {
        name: "Dresses",
        href: "/products?category=clothing&subcategory=dresses",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Chic Tops",
        href: "/products?category=clothing&subcategory=tops",
        image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    id: "grp-mens-sartorial",
    title: "Men's Sartorial Edit",
    href: "/products?category=clothing&gender=men",
    items: [
      {
        name: "Oxford Shirts",
        href: "/products?category=clothing&subcategory=shirts",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Cotton Tees",
        href: "/products?category=clothing&subcategory=t-shirts",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    id: "grp-artisanal-footwear",
    title: "Artisanal Footwear",
    href: "/products?category=footwear",
    items: [
      {
        name: "Sneakers",
        href: "/products?category=footwear&subcategory=sneakers",
        image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Leather Loafers",
        href: "/products?category=footwear&subcategory=loafers",
        image: "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    id: "grp-heritage-kids",
    title: "Heritage & Little Ones",
    href: "/products?category=clothing&gender=kids",
    items: [
      {
        name: "Ethnic Juttis",
        href: "/products?category=footwear&subcategory=mojris",
        image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Kids' Collection",
        href: "/products?category=clothing&gender=kids",
        image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
];

export function CategorySection({ categoryGroups }: { categoryGroups?: AdminCategoryGroupCard[] } = {}) {
  const displayGroups = (categoryGroups && categoryGroups.length > 0 ? categoryGroups : TEN_CATEGORIES_GROUPS)
    .filter((g) => g.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      {/* Section Header */}
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#D4AF37]/35 bg-[#FAF6F0] text-[#58111A]">
              <Sparkles size={13} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#821B2B]">
              Curated Collections
            </span>
          </div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-900 sm:text-2xl lg:text-3xl">
            Shop by Category
          </h2>
        </div>

        <Link
          href="/products"
          className="group inline-flex items-center gap-1 text-xs font-bold text-[#58111A] transition-colors hover:text-[#821B2B] sm:text-sm"
        >
          <span>Browse All</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 
        Category Cards Container:
        - Mobile: Horizontal scroll with snap points and peek effect (per provided image).
        - Desktop/Tablet: Even multi-column grid.
      */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5 lg:gap-3.5">
        {displayGroups.map((group) => (
          <div
            key={group.id}
            className="w-[78vw] xs:w-[72vw] shrink-0 snap-start rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xs transition-all hover:border-[#D4AF37]/60 hover:shadow-md sm:w-auto sm:shrink"
          >
            {/* Group Card Header with Chevron Right (Exact format as provided image) */}
            <Link
              href={group.href}
              className="group flex items-center justify-between pb-3 transition-colors"
            >
              <h3 className="line-clamp-1 text-sm font-extrabold text-black group-hover:text-[#58111A]">
                {group.title}
              </h3>
              <ChevronRight
                size={17}
                className="shrink-0 text-neutral-700 transition-transform group-hover:translate-x-0.5 group-hover:text-black"
              />
            </Link>

            {/* Dual Item Mini Cards inside (Exactly 2 items per card = 10 items total) */}
            <div className="grid grid-cols-2 gap-2.5">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group/item flex flex-col items-center"
                >
                  {/* Soft-tinted rounded square image container */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-neutral-100 bg-[#FAF7F2] p-2 transition-transform duration-300 group-hover/item:scale-105 group-hover/item:border-[#D4AF37]/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  </div>
                  {/* Item Label below */}
                  <span className="mt-1.5 line-clamp-1 text-center text-xs font-semibold text-neutral-800 group-hover/item:text-[#58111A]">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
