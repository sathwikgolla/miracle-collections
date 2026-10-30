"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  Tag,
  Trash2,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import type { AdminProduct, AdminVariant } from "@/lib/adminTypes";
import { handleImageError } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { uploadProductImage } from "@/app/actions/admin/upload-image";

interface ProductEditModalProps {
  product: AdminProduct | null;
  onClose: () => void;
}

export function ProductEditModal({ product, onClose }: ProductEditModalProps) {
  const { categories, subcategories, saveProduct } = useAdmin();

  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [brand, setBrand] = useState(product?.brand || "Miracle Collections");
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || "clothing");
  const [gender, setGender] = useState<"men" | "women" | "kids" | "unisex" | "">(
    product?.gender || "men"
  );
  const [subCategory, setSubCategory] = useState(product?.subCategory || "");
  const [price, setPrice] = useState(product?.price || 1299);
  const [mrp, setMrp] = useState(product?.mrp || 2499);
  const [costPrice, setCostPrice] = useState(product?.costPrice || 600);
  const [status, setStatus] = useState<"live" | "draft">(product?.status || "live");
  const [description, setDescription] = useState(product?.description || "");
  const [badges, setBadges] = useState<string[]>(product?.badges || ["New"]);
  const [images, setImages] = useState<string[]>(
    product?.images || [
      "https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=800&q=80",
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [variants, setVariants] = useState<AdminVariant[]>(
    product?.variants || [
      { id: "v1", sku: "", size: "M", color: "Black", stock: 15, reservedStock: 0 },
      { id: "v2", sku: "", size: "L", color: "Black", stock: 10, reservedStock: 0 },
    ]
  );
  // Product-level stock. Used only when the product has NO variants; when
  // variants exist the server derives the product's total from their stock.
  const [stock, setStock] = useState<number>(product?.stock ?? 0);

  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(
    product?.specifications || [
      { label: "Fabric", value: "100% Pure Combed Cotton" },
      { label: "Care Instructions", value: "Machine Wash Cold" },
    ]
  );

  // Dependent sub-category options for the selected category + audience.
  // Derived from the category rows + shared taxonomy (no subcategories table).
  const subcategoryOptions = useMemo(() => {
    const forCategory = subcategories.filter((s) => s.categoryId === categoryId);
    const byAudience =
      gender === "men" || gender === "women" || gender === "kids"
        ? forCategory.filter((s) => s.gender === gender)
        : forCategory;
    const seen = new Set<string>();
    return byAudience.filter((s) =>
      seen.has(s.name) ? false : (seen.add(s.name), true)
    );
  }, [subcategories, categoryId, gender]);

  // Keep the chosen sub-category valid whenever the category/audience changes.
  useEffect(() => {
    if (subcategoryOptions.length === 0) return;
    if (!subcategoryOptions.some((s) => s.name === subCategory)) {
      setSubCategory(subcategoryOptions[0].name);
    }
  }, [subcategoryOptions, subCategory]);

  useEffect(() => {
    if (!product && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [name, product]);

  const discountPercent =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const grossMargin =
    price > costPrice ? Math.round(((price - costPrice) / price) * 100) : 0;

  const handleAddVariant = () => {
    const newId = `var_${Date.now()}`;
    setVariants([
      ...variants,
      {
        id: newId,
        sku: `MC-${Date.now().toString().slice(-4)}`,
        size: "M",
        color: "Navy",
        stock: 10,
        reservedStock: 0,
      },
    ]);
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof AdminVariant,
    val: string | number
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    // Removing every variant is allowed: the product then falls back to its
    // product-level stock (below) instead of variant stock.
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProductImage(formData);
      if (result.success && result.data) {
        setImages([...images, result.data.url]);
      } else if (!result.success) {
        setUploadError(result.error || "Upload failed. Please try again.");
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { label: "", value: "" }]);
  };

  const handleUpdateSpec = (index: number, field: "label" | "value", val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const toggleBadge = (badge: string) => {
    if (badges.includes(badge)) {
      setBadges(badges.filter((b) => b !== badge));
    } else {
      setBadges([...badges, badge]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError("Product name is required");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const payload: Partial<AdminProduct> = {
        ...(product ? { id: product.id } : {}),
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        brand: brand.trim(),
        categoryId,
        subCategory,
        gender,
        price: Number(price),
        mrp: Number(mrp),
        costPrice: Number(costPrice),
        status,
        description,
        badges,
        images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"],
        variants,
        stock: Number(stock) || 0,
        specifications: specs.filter((s) => s.label.trim() && s.value.trim()),
        colors: Array.from(new Set(variants.map((v) => v.color))),
        sizes: Array.from(new Set(variants.map((v) => v.size))),
      };

      await saveProduct(payload);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save product:", err);
      const msg = err instanceof Error ? err.message : "Failed to save product. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-black">
                {product ? "Edit Catalog Product" : "Create New Miracle Product"}
              </h2>
              <p className="text-xs text-neutral-500">Live Single Merchant Inventory & Variant Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-xs flex items-center justify-between">
              <span>{submitError}</span>
              <button
                type="button"
                onClick={() => setSubmitError("")}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-neutral-700">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Embroidered Anarkali Kurta Set"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Brand Name</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Miracle Collections"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Audience</label>
              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "men" | "women" | "kids" | "unisex" | "")
                }
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">Unspecified</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Sub-category</label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                {subcategoryOptions.length === 0 ? (
                  <option value="">No subcategories for this selection</option>
                ) : (
                  subcategoryOptions.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug-path"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs font-mono focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Publish Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "live" | "draft")}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs font-bold focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="live">🟢 Live on Storefront</option>
                <option value="draft">🟡 Draft (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Pricing & Margin Calculator */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <p className="font-bold uppercase tracking-wider text-neutral-600">
              Pricing, MRP & Profit Margins
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-600 font-medium">Selling Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-sm font-bold font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-600 font-medium">MRP Original (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={mrp}
                  onChange={(e) => setMrp(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-sm font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-600 font-medium">Wholesale / Cost Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-sm font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div className="rounded-md bg-white border border-neutral-200 p-2.5 flex flex-col justify-center shadow-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">Discount:</span>
                  <span className="font-bold text-amber-700">{discountPercent}% OFF</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-neutral-500 font-medium">Gross Margin:</span>
                  <span className="font-bold text-emerald-700">{grossMargin}% Margin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges / Tags */}
          <div className="space-y-2">
            <label className="font-semibold text-neutral-700">Merchandising Badges</label>
            <div className="flex flex-wrap gap-2">
              {["Trending", "Best Seller", "New", "Festive Special", "Limited Edition"].map((b) => {
                const active = badges.includes(b);
                return (
                  <button
                    type="button"
                    key={b}
                    onClick={() => toggleBadge(b)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
                      active
                        ? "bg-black text-white border-black shadow-xs"
                        : "bg-white border-neutral-300 text-neutral-700 hover:border-black hover:text-black"
                    }`}
                  >
                    {active ? `✓ ${b}` : `+ ${b}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Gallery Manager */}
          <div className="space-y-2">
            <label className="font-semibold text-neutral-700">Product Images</label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {images.map((imgUrl, i) => (
                <div
                  key={i}
                  className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square bg-neutral-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt="Product preview" onError={handleImageError} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste public image URL (Unsplash, Cloudinary, S3)..."
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-black text-xs placeholder:text-neutral-400 focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add URL</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors cursor-pointer ${
                    uploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload from Device</span>
                    </>
                  )}
                </label>
                <span className="text-[10px] text-neutral-500">JPG, PNG, WEBP (max 5MB)</span>
              </div>

              {uploadError && (
                <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Variants Matrix */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold uppercase tracking-wider text-neutral-600">
                  Variants & Stock Inventory Matrix
                </p>
                <p className="text-[11px] text-neutral-500">
                  Stock tracked individually per size and color combination.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1 rounded-md bg-black text-white px-3 py-1 text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            {/* Product-level stock fallback (used only when there are no variants) */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-neutral-600">
                Product-level stock {variants.length === 0 ? "(in use)" : "(used when there are no variants)"}
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 text-black font-mono text-xs font-bold focus:border-black focus:outline-none"
              />
            </div>

            {/* Mobile View: Stacked Variant Cards (< sm) */}
            <div className="block sm:hidden space-y-2.5">
              {variants.map((v, i) => (
                <div
                  key={v.id || i}
                  className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                      Variant #{i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      className="text-neutral-400 hover:text-red-600 p-1"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="text-[10px] text-neutral-500 font-medium">SKU</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleUpdateVariant(i, "sku", e.target.value)}
                        placeholder="SKU"
                        className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-black font-mono text-xs focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium">Size</label>
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => handleUpdateVariant(i, "size", e.target.value)}
                        placeholder="Size (e.g. M, 9)"
                        className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-black text-xs focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium">Color</label>
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => handleUpdateVariant(i, "color", e.target.value)}
                        placeholder="Color"
                        className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-black text-xs focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-neutral-500 font-medium">Available Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariant(i, "stock", Number(e.target.value))}
                        className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-black font-mono text-xs font-bold focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50">
                  <tr className="border-b border-neutral-200 text-neutral-600 text-[11px] font-semibold">
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3">Color</th>
                    <th className="py-2 px-3 text-right">Available Stock</th>
                    <th className="py-2 px-3 text-center w-10">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {variants.map((v, i) => (
                    <tr key={v.id || i} className="hover:bg-neutral-50/50">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => handleUpdateVariant(i, "sku", e.target.value)}
                          className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-black font-mono text-xs focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => handleUpdateVariant(i, "size", e.target.value)}
                          className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 text-black text-xs focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => handleUpdateVariant(i, "color", e.target.value)}
                          className="w-28 rounded border border-neutral-300 bg-white px-2 py-1 text-black text-xs focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => handleUpdateVariant(i, "stock", Number(e.target.value))}
                          className="w-20 rounded border border-neutral-300 bg-white px-2 py-1 text-black text-right font-mono text-xs font-bold focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(i)}
                          className="text-neutral-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description & Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Product Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Handcrafted festive fashion crafted from..."
                className="w-full rounded-md border border-neutral-300 bg-white p-2.5 text-black text-xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-neutral-700">Specifications (Key-Value)</label>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="text-xs text-black font-semibold hover:underline"
                >
                  + Add Spec
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {specs.map((sp, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Fabric"
                      value={sp.label}
                      onChange={(e) => handleUpdateSpec(idx, "label", e.target.value)}
                      className="w-1/3 rounded border border-neutral-300 bg-white px-2 py-1 text-black text-xs focus:border-black focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Pure Rayon"
                      value={sp.value}
                      onChange={(e) => handleUpdateSpec(idx, "value", e.target.value)}
                      className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-black text-xs focus:border-black focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="flex items-center gap-1.5 rounded-md bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? "Saving..." : product ? "Save Changes" : "Create Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
