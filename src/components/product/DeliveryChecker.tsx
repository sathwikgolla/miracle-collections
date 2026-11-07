"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Truck, XCircle } from "lucide-react";

type Status = "idle" | "checking" | "available" | "unavailable" | "invalid";

export function DeliveryChecker() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const check = () => {
    const value = pin.trim();
    if (!/^[1-9]\d{5}$/.test(value)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    window.setTimeout(() => {
      // Mock: pincodes starting with 9 are treated as unserviceable.
      setStatus(value.startsWith("9") ? "unavailable" : "available");
    }, 500);
  };

  return (
    <div className="mt-4 sm:mt-6 rounded-lg border border-neutral-200 p-3.5 sm:p-4">
      <h3 className="mb-2.5 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm font-bold text-black">
        <Truck size={16} /> Check Delivery Availability
      </h3>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter PIN Code"
            inputMode="numeric"
            className="h-10 sm:h-11 w-full rounded-md border border-neutral-300 pl-9 pr-3 text-xs sm:text-sm text-black outline-none transition-colors focus:border-black"
          />
        </div>
        <button
          onClick={check}
          disabled={status === "checking" || pin.length === 0}
          className="h-10 sm:h-11 shrink-0 rounded-md border border-black px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent disabled:hover:text-neutral-400 touch-manipulation"
        >
          {status === "checking" ? "Checking..." : "Check"}
        </button>
      </div>

      {status === "invalid" && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <XCircle size={14} className="shrink-0" /> Please enter a valid 6-digit PIN code.
        </p>
      )}
      {status === "available" && (
        <div className="mt-2.5 space-y-1.5 text-xs sm:text-sm text-neutral-700">
          <p className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircle2 size={15} className="shrink-0" /> Delivery available to {pin}
          </p>
          <p className="flex items-center gap-1.5 text-neutral-500">
            <Truck size={14} className="shrink-0" /> Estimated delivery: 3–5 days
          </p>
          <p className="flex items-center gap-1.5 text-neutral-500">
            <CheckCircle2 size={14} className="shrink-0 text-green-700" /> Free delivery on this PIN
          </p>
        </div>
      )}
      {status === "unavailable" && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <XCircle size={14} className="shrink-0" /> Delivery is currently unavailable for this PIN code.
        </p>
      )}
    </div>
  );
}
