"use client";

import { useState } from "react";
import { Percent, X } from "lucide-react";
import type { AdminCoupon } from "@/lib/adminTypes";
import { useAdmin } from "@/context/AdminContext";

interface CouponEditModalProps {
  coupon: AdminCoupon | null;
  onClose: () => void;
}

export function CouponEditModal({ coupon, onClose }: CouponEditModalProps) {
  const { saveCoupon } = useAdmin();

  const [code, setCode] = useState(coupon?.code || "");
  const [description, setDescription] = useState(coupon?.description || "");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">(
    coupon?.discountType || "percentage"
  );
  const [discountValue, setDiscountValue] = useState<number>(coupon?.discountValue || 10);
  const [minOrder, setMinOrder] = useState<number>(coupon?.minOrder || 999);
  const [maxDiscountCap, setMaxDiscountCap] = useState<number | undefined>(
    coupon?.maxDiscountCap || 500
  );
  const [startDate, setStartDate] = useState(
    coupon?.startDate || new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState(coupon?.expiryDate || "2026-12-31");
  const [usageLimit, setUsageLimit] = useState<number>(coupon?.usageLimit || 500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert("Coupon code is required");
      return;
    }

    saveCoupon({
      ...(coupon ? { id: coupon.id } : {}),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrder: Number(minOrder),
      maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : undefined,
      startDate,
      expiryDate,
      usageLimit: Number(usageLimit),
      active: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-xs">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-black">
                {coupon ? "Edit Discount Coupon" : "Create Promotional Coupon"}
              </h2>
              <p className="text-xs text-neutral-500">Promotional Discounts & Cart Offers</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. FESTIVE20"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black font-mono font-bold tracking-wider focus:border-black focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percentage" | "flat")}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black font-semibold focus:border-black focus:outline-none"
              >
                <option value="percentage">Percentage (%) Off</option>
                <option value="flat">Flat Fixed Amount (₹) Off</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">
                {discountType === "percentage" ? "Percentage (%):" : "Flat Amount (₹):"}
              </label>
              <input
                type="number"
                min="1"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black font-bold focus:border-black focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Min Order (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Max Cap (₹)</label>
              <input
                type="number"
                min="0"
                value={maxDiscountCap || ""}
                onChange={(e) =>
                  setMaxDiscountCap(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="No limit"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700">Offer Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 10% off on all festive anarkalis & kurtas"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700">Usage Limit (Max redemptions)</label>
            <input
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
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
              Save Coupon Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
