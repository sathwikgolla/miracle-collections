import { ShieldCheck, CreditCard, Truck, RefreshCw, Headphones, Award } from "lucide-react";
import type { AdminQuickBenefitItem } from "@/lib/homepageTypes";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  ShieldCheck,
  CreditCard,
  Truck,
  RefreshCw,
  Headphones,
  Award,
};

const DEFAULT_BENEFITS: AdminQuickBenefitItem[] = [
  {
    id: "qb-1",
    title: "100% Genuine Quality",
    subtitle: "Direct verified",
    iconName: "ShieldCheck",
    active: true,
  },
  {
    id: "qb-2",
    title: "Fast Delivery",
    subtitle: "Free over ₹499",
    iconName: "Truck",
    active: true,
  },
  {
    id: "qb-3",
    title: "7-Day Easy Returns",
    subtitle: "Doorstep pickup",
    iconName: "RefreshCw",
    active: true,
  },
  {
    id: "qb-4",
    title: "Secure Payments",
    subtitle: "UPI, Cards & COD",
    iconName: "CreditCard",
    active: true,
  },
  {
    id: "qb-5",
    title: "Dedicated Support",
    subtitle: "Instant help",
    iconName: "Headphones",
    active: true,
  },
];

export function QuickBenefits({ items }: { items?: AdminQuickBenefitItem[] } = {}) {
  const displayBenefits = (items && items.length > 0 ? items : DEFAULT_BENEFITS).filter(
    (b) => b.active !== false
  );

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
      {/* Reduced-size, sleek KPI Trust Strip matching compact presentation */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-2 shadow-2xs sm:p-2.5">
        {/* Mobile: Horizontal scrollable strip; Tablet/Desktop: Even row */}
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-5 sm:gap-2">
          {displayBenefits.map((b) => {
            const Icon = (b.iconName && ICON_MAP[b.iconName]) || ShieldCheck;
            return (
              <div
                key={b.id || b.title}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-neutral-50/70 px-2.5 py-1.5 transition-colors hover:bg-neutral-100 sm:shrink sm:px-2 sm:py-1"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FAF6F0] text-[#58111A]">
                  <Icon size={13} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="whitespace-nowrap text-[11px] font-bold text-neutral-900 leading-tight">
                    {b.title}
                  </p>
                  <p className="whitespace-nowrap text-[9px] text-neutral-500 leading-tight">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
