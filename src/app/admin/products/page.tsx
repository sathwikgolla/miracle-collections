"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Download,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice, getProductTotalStock, handleImageError } from "@/lib/utils";
import type { AdminProduct } from "@/lib/adminTypes";
import { ProductEditModal } from "@/components/admin/ProductEditModal";

function AdminProductsContent() {
  const { products, categories, toggleProductStatus, deleteProduct, exportToCsv } = useAdmin();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "live" | "draft">("all");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Synchronize with URL query parameter ?q=...
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Dynamic category product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of categories) {
      counts[c.id] = products.filter((p) => p.categoryId === c.id).length;
    }
    return counts;
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchStatus = selectedStatus === "all" || p.status === selectedStatus;
      if (!matchCat || !matchStatus) return false;
      if (!q) return true;

      const catName = p.categoryId === "clothing" ? "clothing" : p.categoryId === "footwear" ? "footwear" : p.categoryId;
      const matchSearch =
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryId.toLowerCase().includes(q) ||
        catName.includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        (p.badges && p.badges.some((b) => b.toLowerCase().includes(q))) ||
        (p.variants &&
          p.variants.some(
            (v) =>
              v.sku.toLowerCase().includes(q) ||
              v.size.toLowerCase().includes(q) ||
              v.color.toLowerCase().includes(q)
          ));
      return matchSearch;
    });
  }, [products, selectedCategory, selectedStatus, search]);

  const handleExportCsv = () => {
    const data = filteredProducts.map((p) => ({
      ID: p.id,
      Name: p.name,
      Brand: p.brand,
      Category: p.categoryId,
      SubCategory: p.subCategory || "General",
      Price: p.price,
      MRP: p.mrp,
      Cost_Price: p.costPrice || 0,
      Total_Stock: getProductTotalStock(p),
      Variants_Count: p.variants.length,
      Status: p.status,
    }));
    exportToCsv(data, "Miracle_Products_Catalog");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-black" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
              Product Catalog & Merchandising
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Total {products.length} products across Clothing and Footwear • Live single source of truth
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4 text-black" />
            <span className="hidden xs:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 rounded-md bg-black hover:bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({categoryCounts[c.id] || 0})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 text-xs">
            {(["all", "live", "draft"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`rounded px-2.5 py-1 font-semibold capitalize text-[11px] transition ${
                  selectedStatus === st
                    ? "bg-black text-white shadow-xs"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ID, brand, category, SKU..."
            className="w-full rounded-md border border-neutral-300 bg-white py-1.5 pl-9 pr-8 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Search & Filter Banner */}
      {search.trim() && (
        <div className="flex items-center justify-between rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-800">
          <span>
            Search results for <strong>&quot;{search}&quot;</strong> ({filteredProducts.length} items found)
          </span>
          <button
            onClick={() => setSearch("")}
            className="font-semibold text-black hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* MOBILE VIEW: Stacked Responsive Cards (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => {
            const totalStock = getProductTotalStock(p);
            const isLow = p.variants.some((v) => v.stock <= 5);

            return (
              <div
                key={p.id}
                className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs space-y-3"
              >
                {/* Header row: thumbnail + title + category */}
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    onError={handleImageError}
                    className="h-16 w-16 rounded-lg object-cover border border-neutral-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="capitalize text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {p.categoryId}
                      </span>
                      <button
                        onClick={() => toggleProductStatus(p.id)}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide border transition ${
                          p.status === "live"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {p.status === "live" ? "● LIVE" : "○ DRAFT"}
                      </button>
                    </div>

                    <p className="font-bold text-black text-xs mt-1 line-clamp-2">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                      {p.brand} {p.subCategory ? `• ${p.subCategory}` : ""}
                    </p>
                  </div>
                </div>

                {/* Pricing & Stock row */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-xs">
                  <div className="font-mono">
                    <span className="font-extrabold text-black text-sm">{formatPrice(p.price)}</span>
                    <span className="text-neutral-400 line-through text-[11px] ml-1.5">
                      {formatPrice(p.mrp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={`font-bold text-xs ${
                        totalStock <= 5 ? "text-rose-700" : "text-emerald-700"
                      }`}
                    >
                      {totalStock} in stock
                    </span>
                    {isLow && (
                      <span className="rounded bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 text-[9px] font-bold">
                        LOW
                      </span>
                    )}
                  </div>
                </div>

                {/* Variants preview and Actions row */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-xs">
                  <div className="text-[11px] text-neutral-500 truncate max-w-[170px]">
                    <span className="font-medium text-black">{p.variants.length} Var:</span>{" "}
                    {p.variants.map((v) => v.size).join(", ")}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-black hover:bg-neutral-50"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete '${p.name}'?`)) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="rounded-md border border-neutral-300 bg-white p-1 text-neutral-500 hover:text-red-600 hover:bg-neutral-50"
                      aria-label="Delete product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-xs text-neutral-500">
            No products match the selected filters or search query.
          </div>
        )}
      </div>

      {/* DESKTOP & TABLET VIEW: Full Table (>= md) */}
      <div className="hidden md:block rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-4">Product Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4">Variants & SKUs</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const totalStock = getProductTotalStock(p);
                  const isLow = p.variants.some((v) => v.stock <= 5);

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            onError={handleImageError}
                            className="h-12 w-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-black text-sm max-w-[220px] truncate">
                              {p.name}
                            </p>
                            <p className="text-neutral-500 text-[11px] mt-0.5">
                              ID: <span className="font-mono text-neutral-700">{p.id}</span> • Brand: <strong className="text-neutral-700">{p.brand}</strong>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="capitalize font-semibold text-black">
                          {p.categoryId}
                        </span>
                        {p.subCategory && (
                          <p className="text-[11px] text-neutral-500">{p.subCategory}</p>
                        )}
                      </td>

                      <td className="p-4 font-mono">
                        <p className="font-extrabold text-black text-sm">{formatPrice(p.price)}</p>
                        <p className="text-neutral-400 line-through text-[11px]">
                          {formatPrice(p.mrp)}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-black">{p.variants.length} Variants</p>
                        <p className="text-[11px] text-neutral-500 font-mono truncate max-w-[140px]">
                          {p.variants.map((v) => v.size).join(", ")}
                        </p>
                      </td>

                      <td className="p-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm ${
                              totalStock <= 5 ? "text-rose-700" : "text-emerald-700"
                            }`}
                          >
                            {totalStock} units
                          </span>
                          {isLow && (
                            <span className="rounded bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold">
                              LOW
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => toggleProductStatus(p.id)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide border transition ${
                            p.status === "live"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200"
                          }`}
                        >
                          {p.status === "live" ? "● LIVE" : "○ DRAFT"}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 px-2.5 py-1.5 font-semibold text-black transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete '${p.name}'?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="rounded-md border border-neutral-300 bg-white p-1.5 text-neutral-500 hover:text-red-600 hover:bg-neutral-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No products match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      {(editingProduct || isCreating) && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center rounded-xl border border-neutral-200 bg-white text-xs text-neutral-500">
          Loading catalog & search parameters...
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
