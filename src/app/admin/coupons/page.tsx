"use client";

import { useState } from "react";
import { Download, Edit2, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";
import type { AdminCoupon } from "@/lib/adminTypes";
import { CouponEditModal } from "@/components/admin/CouponEditModal";

export default function AdminCouponsPage() {
  const { coupons, saveCoupon, deleteCoupon, exportToCsv } = useAdmin();
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExportCsv = () => {
    const data = coupons.map((c) => ({
      Code: c.code,
      Type: c.discountType,
      Value: c.discountValue,
      Min_Order: c.minOrder,
      Max_Discount_Cap: c.maxDiscountCap || "None",
      Start_Date: c.startDate,
      Expiry_Date: c.expiryDate,
      Usage_Limit: c.usageLimit,
      Redeemed_Count: c.usedCount,
      Status: c.active ? "Active" : "Inactive",
    }));
    exportToCsv(data, "Miracle_Coupons");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-sm">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                Promotional Coupons & Offers
              </h1>
              <p className="text-xs text-neutral-500">
                Discount codes, minimum cart rules, redemption caps, and validity schedules
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-100 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupon Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => {
          const isExpired = new Date(c.expiryDate) < new Date();

          return (
            <div
              key={c.id}
              className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between transition ${
                c.active && !isExpired
                  ? "border-neutral-200 bg-white hover:border-neutral-300"
                  : "border-neutral-200 bg-neutral-50 opacity-70"
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-base font-bold tracking-wider text-black bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-lg inline-block">
                      {c.code}
                    </span>
                    <p className="text-xs text-neutral-600 font-medium mt-2">{c.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isExpired
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : c.active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {isExpired ? "EXPIRED" : c.active ? "ACTIVE" : "PAUSED"}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Discount Value:</span>
                    <span className="font-bold text-black font-mono">
                      {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Min Order Amount:</span>
                    <span className="font-mono text-black font-medium">{formatPrice(c.minOrder)}</span>
                  </div>
                  {c.maxDiscountCap && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Max Discount Cap:</span>
                      <span className="font-mono text-black font-medium">{formatPrice(c.maxDiscountCap)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-500">
                    <span>Redeemed:</span>
                    <span className="font-mono text-neutral-700">
                      {c.usedCount} / {c.usageLimit} uses
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Valid Till:</span>
                    <span className="font-mono text-neutral-700">{c.expiryDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                <button
                  onClick={() =>
                    saveCoupon({ id: c.id, active: !c.active })
                  }
                  className={`font-semibold transition ${c.active ? "text-neutral-500 hover:text-black" : "text-emerald-700 hover:underline"}`}
                >
                  {c.active ? "Pause Offer" : "Activate"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingCoupon(c);
                      setIsModalOpen(true);
                    }}
                    className="text-black hover:underline font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete coupon '${c.code}'?`)) deleteCoupon(c.id);
                    }}
                    className="text-neutral-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Modal */}
      {isModalOpen && (
        <CouponEditModal
          coupon={editingCoupon}
          onClose={() => {
            setEditingCoupon(null);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
