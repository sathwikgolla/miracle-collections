"use client";

import { Children, cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 disabled:bg-neutral-300 disabled:text-neutral-500",
  outline:
    "border border-neutral-300 bg-white text-black hover:border-black hover:bg-neutral-50 disabled:text-neutral-400",
  ghost: "text-black hover:bg-neutral-100",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  light: "bg-white text-black hover:bg-neutral-100 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

function baseClasses(variant: Variant, size: Size, fullWidth?: boolean) {
  return cn(
    "inline-flex items-center justify-center rounded-md font-semibold transition-colors duration-150 select-none disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    fullWidth && "w-full"
  );
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  asChild,
  className,
  children,
  ...props
}: ButtonProps) {
  if (asChild && isValidElement(children)) {
    const child = Children.only(children) as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(baseClasses(variant, size, fullWidth), className, child.props.className),
      ...props,
    });
  }

  return (
    <button
      suppressHydrationWarning
      className={cn(baseClasses(variant, size, fullWidth), className)}
      {...props}
    >
      {children}
    </button>
  );
}