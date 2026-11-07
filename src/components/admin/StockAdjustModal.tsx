"use client";

import { useState } from "react";
import { Warehouse, X } from "lucide-react";
import type { StockChangeType } from "@/lib/adminTypes";
import { useAdmin } from "@/context/AdminContext";

interface StockAdjustModalProps {
  initialProductId?: string;
  initialSku?: string;
  onClose: () => void;
}

export function StockAdjustModal({
  initialProductId,
  initialSku,
  onClose,
}: StockAdjustModalProps) {
  const { products, adjustStock } = useAdmin();

  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || products[0]?.id || ""
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const [selectedSku, setSelectedSku] = useState(
    initialSku || selectedProduct?.variants[0]?.sku || ""
  );

  const hasVariants = (selectedProduct?.variants.length ?? 0) > 0;

  const selectedVariant =
    selectedProduct?.variants.find((v) => v.sku === selectedSku) ||
    selectedProduct?.variants[0];

  const [mode, setMode] = useState<"add" | "deduct" | "set">("add");
  const [quantity, setQuantity] = useState<number>(10);
  const [reasonCategory, setReasonCategory] = useState<
    "restock" | "manual_adjust" | "damage_writeoff" | "return_restored"
  >("restock");
  const [reasonNote, setReasonNote] = useState("");

  // Variant-less products keep their stock on the product row.
  const currentStock = hasVariants ? selectedVariant?.stock || 0 : selectedProduct?.stock || 0;

  const calculateNewStock = () => {
    if (mode === "add") return currentStock + Number(quantity);
    if (mode === "deduct") return Math.max(0, currentStock - Number(quantity));
    return Math.max(0, Number(quantity));
  };

  const newStock = calculateNewStock();
  const changeDelta = newStock - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    // A variant product needs a selected variant; a variant-less product adjusts
    // its product-level stock (empty SKU).
    if (hasVariants && !selectedVariant) return;
    if (changeDelta === 0) {
      alert("No change in stock quantity.");
      return;
    }

    const typeMapping: Record<string, StockChangeType> = {
      restock: "restock",
      manual_adjust: "manual_adjust",
      damage_writeoff: "damage_writeoff",
      return_restored: "return_restored",
    };

    const finalReason = `${reasonCategory.toUpperCase()}: ${
      reasonNote.trim() ||
      (reasonCategory === "restock"
        ? "Supplier shipment received"
        : reasonCategory === "damage_writeoff"
        ? "Damaged item written off"
        : "Manual physical inventory adjustment")
    }`;

    adjustStock(
      selectedProduct.id,
      hasVariants ? selectedVariant?.sku ?? "" : "",
      changeDelta,
      typeMapping[reasonCategory] || "manual_adjust",
      finalReason
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-xs">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-black">Stock Adjustment & Ledger</h2>
              <p className="text-xs text-neutral-500">Live Inventory Matrix & Audit Trail Logging</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Product Selector */}
          <div className="space-y-1">
            <label className="font-semibold text-neutral-700">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find((p) => p.id === e.target.value);
                setSelectedSku(prod?.variants[0]?.sku ?? "");
              }}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.brand})
                </option>
              ))}
            </select>
          </div>

          {/* Variant Selector (variant-less products adjust product-level stock) */}
          {hasVariants ? (
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Select Variant SKU</label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black font-mono focus:border-black focus:outline-none"
              >
                {selectedProduct?.variants.map((v) => (
                  <option key={v.id} value={v.sku}>
                    {v.sku} — {v.color} / {v.size} (Current: {v.stock} units)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600">
              This product is sold without variants — you are adjusting its
              product-level stock (currently {selectedProduct?.stock || 0} units).
            </div>
          )}

          {/* Adjustment Mode & Calculation */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("add")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  mode === "add"
                    ? "bg-black text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                + Add Stock (Restock)
              </button>
              <button
                type="button"
                onClick={() => setMode("deduct")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  mode === "deduct"
                    ? "bg-black text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                - Deduct Stock (Damage)
              </button>
              <button
                type="button"
                onClick={() => setMode("set")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  mode === "set"
                    ? "bg-black text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                Set Absolute Count
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-neutral-600 font-medium">
                  {mode === "set" ? "New Total Count" : "Quantity to Change"}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black font-bold font-mono text-sm focus:border-black focus:outline-none"
                />
              </div>

              <div className="rounded-md bg-white border border-neutral-200 p-2.5 flex flex-col justify-center shadow-xs">
                <span className="text-neutral-500 text-[11px] font-medium">Resulting Stock:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-extrabold text-black font-mono">{newStock}</span>
                  <span
                    className={`text-xs font-bold ${
                      changeDelta > 0
                        ? "text-emerald-700"
                        : changeDelta < 0
                        ? "text-rose-700"
                        : "text-neutral-500"
                    }`}
                  >
                    ({changeDelta > 0 ? `+${changeDelta}` : changeDelta})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Category */}
          <div className="space-y-1">
            <label className="font-semibold text-neutral-700">Adjustment Reason</label>
            <select
              value={reasonCategory}
              onChange={(e) =>
                setReasonCategory(
                  e.target.value as "restock" | "manual_adjust" | "damage_writeoff" | "return_restored"
                )
              }
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
            >
              <option value="restock">Purchase Restock Shipment (New PO)</option>
              <option value="manual_adjust">Physical Count Audit Discrepancy</option>
              <option value="damage_writeoff">Damaged / Defect Shelf Write-off</option>
              <option value="return_restored">Customer Return Restocked to Shelf</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700">Reference / Notes</label>
            <input
              type="text"
              placeholder="e.g. PO-SURAT-2026-92 or Shelf Audit Batch 4"
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              Commit Stock Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
