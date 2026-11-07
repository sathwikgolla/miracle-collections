"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 10,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const btnSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-neutral-300",
        className
      )}
    >
      <button suppressHydrationWarning onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(
          btnSize,
          "flex items-center justify-center text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
        )}
      >
        <Minus size={16} />
      </button>
      <span
        className={cn(
          "min-w-10 text-center text-sm font-bold text-black",
          size === "sm" ? "min-w-8" : "min-w-10"
        )}
      >
        {value}
      </span>
      <button suppressHydrationWarning onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          btnSize,
          "flex items-center justify-center text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
        )}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}