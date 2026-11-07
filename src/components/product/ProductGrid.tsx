import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PackageSearch } from "lucide-react";
import Link from "next/link";

interface ProductGridProps {
  products: Product[];
  columns?: 3 | 4;
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try adjusting your search or filters to find what you're looking for."
        action={
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 text-sm font-semibold text-black transition-colors hover:border-black hover:bg-neutral-50"
          >
            Clear filters
          </Link>
        }
      />
    );
  }

  return (
    <div
      className={
        columns === 4
          ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 2xl:grid-cols-5"
          : "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}