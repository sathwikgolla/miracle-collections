"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, MapPin, Package, ShieldCheck, XCircle } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { OrderCard } from "@/components/product/OrderCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { getMyPaymentVerifications } from "@/app/actions/orders";
import type { PaymentVerificationSummary } from "@/lib/orderTypes";
import { cn, formatPrice } from "@/lib/utils";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Status card for a payment verification submitted at checkout. Until the
 * admin approves it there is NO order — this is what the customer sees instead
 * of an order, so it must never read like a placed/confirmed order.
 */
function VerificationCard({ v }: { v: PaymentVerificationSummary }) {
  const pending = v.status === "pending";
  const approved = v.status === "approved";

  return (
    <div
      className={cn(
        "rounded-lg border p-4 sm:p-5",
        approved
          ? "border-green-200 bg-green-50"
          : pending
            ? "border-amber-200 bg-amber-50"
            : "border-red-200 bg-red-50"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              approved
                ? "bg-green-100 text-green-700"
                : pending
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            )}
          >
            {approved ? (
              <CheckCircle2 size={18} />
            ) : pending ? (
              <Clock size={18} />
            ) : (
              <XCircle size={18} />
            )}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-bold",
                approved
                  ? "text-green-900"
                  : pending
                    ? "text-amber-900"
                    : "text-red-900"
              )}
            >
              {approved
                ? "Payment verified — order placed"
                : pending
                  ? "Awaiting admin verification"
                  : "Payment reference rejected"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              UTR <span className="font-mono font-bold text-black">{v.utrNumber}</span> ·{" "}
              {formatPrice(v.total)} · {v.paymentMethod} · Submitted {formatWhen(v.submittedAt)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              {approved ? (
                <>
                  Your payment was verified and your order has been placed. You can track its
                  delivery status from the order page.
                </>
              ) : pending ? (
                <>
                  We received your payment reference. <b>Your order has not been placed yet</b> —
                  it will be created once our admin verifies the payment. No action is needed from
                  you.
                </>
              ) : (
                <>
                  We could not verify this payment
                  {v.rejectionReason ? ` — ${v.rejectionReason}` : ""}. Your order was{" "}
                  <b>not placed</b>. Your cart items have been restored: please place the order
                  again with a corrected UTR, or contact support if you believe this is a mistake.
                </>
              )}
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">
              Reference: <span className="font-mono">{v.id}</span>
            </p>

            {/* The exact delivery address submitted with this checkout — kept
                on the verification record, so it survives a pending state, a
                rejection/retry, and later profile-address changes. */}
            {v.shipping && (
              <div className="mt-2 rounded-md border border-neutral-200 bg-white/70 p-2.5">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                  <MapPin size={12} /> Delivery Address
                </p>
                <p className="mt-1 text-xs font-semibold text-black">{v.shipping.name}</p>
                <p className="font-mono text-[11px] text-neutral-600">{v.shipping.phone}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-700">
                  {[v.shipping.line1, v.shipping.line2, v.shipping.landmark]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="text-xs leading-relaxed text-neutral-700">
                  {[v.shipping.city, `${v.shipping.state} - ${v.shipping.pincode}`]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {approved && v.orderId ? (
            <Button asChild size="sm">
              <Link href={`/orders/${v.orderId}`}>Track Order</Link>
            </Button>
          ) : !approved ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/cart">Retry Checkout</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { orders, hydrated, refreshOrders } = useStore();
  const [verifications, setVerifications] = useState<PaymentVerificationSummary[]>([]);

  // Payment verifications are fetched separately: they are NOT orders yet.
  const hasPending = verifications.some((v) => v.status === "pending");

  // Keep the customer's view on the latest server-confirmed status without a
  // hard reload: refresh on mount, whenever the tab becomes visible again, and
  // (only while a submission is still awaiting a decision — approved/rejected
  // rows never change) on a gentle poll. Everything is torn down on unmount.
  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await getMyPaymentVerifications();
      if (active && res.success) setVerifications(res.data);
    };

    void refreshOrders();
    void load();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const timer = hasPending
      ? setInterval(() => {
          if (document.visibilityState === "visible") void load();
        }, 20_000)
      : null;

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timer) clearInterval(timer);
    };
  }, [refreshOrders, hasPending]);

  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl flex-1 px-4 py-6 sm:px-6">
        {/* Online payments awaiting / completing admin verification — shown only
            when the customer actually has submissions. */}
        {verifications.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-neutral-500">
              <ShieldCheck size={15} /> Payment Verifications
            </h2>
            <div className="space-y-3">
              {verifications.map((v) => (
                <VerificationCard key={v.id} v={v} />
              ))}
            </div>
          </section>
        )}

        <h1 className="mb-5 text-xl font-extrabold text-black sm:text-2xl">
          My Orders{" "}
          <span className="text-base font-medium text-neutral-400">({orders.length})</span>
        </h1>
        {hydrated && orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description={
              verifications.length > 0
                ? "Your payment reference is being verified. Your order will appear here once it is approved."
                : "When you place an order, it will show up here with live delivery status."
            }
            action={
              <Button asChild>
                <Link href="/products">Start Shopping</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}