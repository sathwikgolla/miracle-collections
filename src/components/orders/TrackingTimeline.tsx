"use client";

import { Check } from "lucide-react";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { normalizeOrderStatus } from "@/lib/orderStatus";

const STEPS = [
  { key: "Placed", label: "Order Placed" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Shipped", label: "Shipped" },
  { key: "Out for Delivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Delivered" },
] as const;

export function TrackingTimeline({ status }: { status: Order["status"] }) {
  // A freshly placed order has order_status = 'Placed' — without this it would
  // mark no step as reached. Legacy values normalize to the same lifecycle.
  const normalized = normalizeOrderStatus(status);
  const current =
    normalized === "Cancelled" ? -1 : STEPS.findIndex((s) => s.key === normalized);

  return (
    <div className="flex items-center min-w-0 overflow-x-auto no-scrollbar py-1">
      {STEPS.map((s, i) => {
        const reached = current >= i;
        const isCurrent = i === current;
        return (
          <div key={s.label} className="flex flex-1 items-center last:flex-none min-w-[56px] sm:min-w-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold shrink-0",
                  reached
                    ? "border-black bg-black text-white"
                    : isCurrent
                      ? "border-black text-black"
                      : "border-neutral-300 bg-white text-neutral-300"
                )}
              >
                {reached ? <Check size={13} /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-1.5 w-14 sm:w-16 text-center text-[9px] sm:text-[10px] font-medium leading-tight",
                  reached || isCurrent ? "text-black" : "text-neutral-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1",
                  current > i || status === "Delivered" ? "bg-black" : "bg-neutral-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}