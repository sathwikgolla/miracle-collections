import { CheckCircle2, Award, ShieldCheck, Truck, RefreshCw, HeadphonesIcon, HelpCircle } from "lucide-react";
import type { AdminWhyUsItem } from "@/lib/homepageTypes";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Award,
  ShieldCheck,
  Truck,
  RefreshCw,
  HeadphonesIcon,
};

const DEFAULT_REASONS: AdminWhyUsItem[] = [
  {
    id: "why-quality",
    title: "100% Quality Guaranteed",
    description: "Every clothing garment and footwear pair undergoes strict fabric, stitching, and finishing checks before dispatch.",
    iconName: "Award",
    order: 1,
    active: true,
  },
  {
    id: "why-secure",
    title: "Secure & Encrypted Shopping",
    description: "Pay with complete confidence using verified UPI, credit/debit cards, net banking, or choose Cash on Delivery.",
    iconName: "ShieldCheck",
    order: 2,
    active: true,
  },
  {
    id: "why-shipping",
    title: "Fast & Reliable Shipping",
    description: "Orders are dispatched within 24 hours with real-time SMS & WhatsApp tracking updates right to your doorstep.",
    iconName: "Truck",
    order: 3,
    active: true,
  },
  {
    id: "why-returns",
    title: "Hassle-Free 7-Day Returns",
    description: "Didn't fit quite right? Schedule an effortless doorstep exchange or full refund with zero cancellation penalties.",
    iconName: "RefreshCw",
    order: 4,
    active: true,
  },
  {
    id: "why-support",
    title: "Dedicated Single-Store Support",
    description: "Reach our in-house Miracle Collections customer support team directly for styling advice, order queries, or sizing help.",
    iconName: "HeadphonesIcon",
    order: 5,
    active: true,
  },
];

export function WhyShopWithUs({ items }: { items?: AdminWhyUsItem[] } = {}) {
  const displayItems = (items && items.length > 0 ? items : DEFAULT_REASONS)
    .filter((i) => i.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 sm:p-10 lg:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-800 shadow-2xs">
            <CheckCircle2 size={13} className="text-black" />
            The Miracle Collections Commitment
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-black sm:text-3xl lg:text-4xl">
            Why Shop With Us
          </h2>
          <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
            We are dedicated to making contemporary fashion accessible, reliable, and delightful for every shopper
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.slice(0, 3).map((r) => {
            const Icon = (r.iconName && ICON_MAP[r.iconName]) || Award;
            return (
              <div
                key={r.id || r.title}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-extrabold text-black">
                  {r.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500 sm:text-sm">
                  {r.description}
                </p>
              </div>
            );
          })}
        </div>

        {displayItems.length > 3 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {displayItems.slice(3).map((r) => {
              const Icon = (r.iconName && ICON_MAP[r.iconName]) || HeadphonesIcon;
              return (
                <div
                  key={r.id || r.title}
                  className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-black">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500 sm:text-sm">
                      {r.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
