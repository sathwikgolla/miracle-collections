import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/lib/types";
import { handleImageError } from "@/lib/utils";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products?category=${category.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between p-3">
        <div>
          <p className="text-sm font-bold text-black">{category.name}</p>
          <p className="text-xs text-neutral-500">{category.description}</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-neutral-400 transition-colors group-hover:text-black" />
      </div>
    </Link>
  );
}