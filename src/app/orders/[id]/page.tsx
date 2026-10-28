"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/Button";
import { UtrPaymentForm } from "@/components/orders/UtrPaymentForm";
import { cn, formatPrice, handleImageError } from "@/lib/utils";
import { normalizeOrderStatus } from "@/lib/orderStatus";
import { requiresOnlinePaymentVerification, paymentStatusLabel } from "@/lib/paymentMethods";
import { getOrderById } from "@/lib/supabase/orders";
import type { Order } from "@/lib/types";

const STEPS: { key: string; label: string; icon: typeof Package }[] = [
  { key: "Placed", label: "Order Placed", icon: CheckCircle2 },
  { key: "Confirmed", label: "Order Confirmed", icon: Package },
  { key: "Shipped", label: "Shipped", icon: Package },
  { key: "Out for Delivery", label: "Out for Delivery", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { orders, user, cancelOrder, refreshOrders } = useStore();
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const order = orders.find((o) => o.id === params.id) ?? fetchedOrder;

  // Revalidate on mount. The admin advances the order in another session, and
  // this provider persists across navigation, so the in-context order may be a
  // stale snapshot. Fall back to a direct RLS-scoped read for deep links / a
  // just-placed order that isn't in context yet.
  useEffect(() => {
    // Wait for the session to hydrate: the read is RLS-scoped to the signed-in
    // user, so querying before that would be a pointless request (and would
    // flash "Order not found" behind RequireAuth).
    if (!params.id || !user) return;
    let active = true;
    setLoadingOrder(true);
    (async () => {
      // The list refresh already returns the authoritative orders; only fall back
      // to a direct single-order read for a deep link / just-placed order that is
      // not in any list yet. Avoids issuing two identical RLS-scoped reads.
      const list = await refreshOrders();
      const inList = list?.find((o) => o.id === params.id) ?? null;
      const fresh = inList ?? (await getOrderById(params.id));
      if (!active) return;
      if (fresh) setFetchedOrder(fresh);
      setLoadingOrder(false);
    })();
    return () => {
      active = false;
    };
  }, [params.id, user, refreshOrders]);

  return (
    <RequireAuth>
      <main className="mx-auto max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-neutral-500">
          <Link href="/orders" className="hover:text-black">
            My Orders
          </Link>
          <span>/</span>
          <span className="text-neutral-700">{params.id}</span>
        </nav>

        {loadingOrder && !order ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
            <p className="text-sm text-neutral-500">Loading order…</p>
          </div>
        ) : !order ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
            <Package size={28} className="mx-auto text-neutral-400" />
            <p className="mt-3 text-sm text-neutral-500">Order not found.</p>
            <Button asChild className="mt-5">
              <Link href="/orders">Back to Orders</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-extrabold text-black">{order.id}</h1>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
                    <Calendar size={14} />
                    Placed{" "}
                    {new Date(order.placedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-bold",
                    order.status === "Delivered" && "border-green-200 bg-green-50 text-green-700",
                    order.status === "Cancelled" && "border-red-200 bg-red-50 text-red-700",
                    !["Delivered", "Cancelled"].includes(order.status) &&
                      "border-blue-200 bg-blue-50 text-blue-700"
                  )}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {/* Status timeline */}
            {order.status !== "Cancelled" ? (
              <div className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-bold text-black">Order Status</h2>
                <ol className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
                  {STEPS.map((s, i) => {
                    const idx = STEPS.findIndex(
                      (x) => x.key === normalizeOrderStatus(order!.status)
                    );
                    const reached = idx >= 0 && i <= idx;
                    return (
                      <li key={s.key} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold",
                            reached
                              ? "border-black bg-black text-white"
                              : "border-neutral-300 text-neutral-400"
                          )}
                        >
                          <s.icon size={13} />
                          {s.label}
                        </span>
                        {i < STEPS.length - 1 && (
                          <span className="h-px w-6 bg-neutral-300 sm:w-10" />
                        )}
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-xs text-neutral-400">
                  Expected delivery: <span className="font-semibold text-black">{order.deliveryBy}</span>
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">
                This order was cancelled.
              </div>
            )}

            {/* Items */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-black">Items</h2>
              <div className="divide-y divide-neutral-100">
                {order.items.map((item, index) => (
                  <div key={`${item.productId}-${item.size || ''}-${item.color || ''}-${index}`} className="flex items-center gap-3 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={handleImageError}
                      className="h-16 w-16 rounded border border-neutral-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-black">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        {item.brand} · Qty {item.qty}
                        {item.size ? ` · ${item.size}` : ""}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-black">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address + Payment */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-black">
                  <MapPin size={16} /> Delivery Address
                </h2>
                {/* The exact address captured at checkout, stored on this
                    order's own shipping-address row (not the profile). */}
                {order.addressName && (
                  <p className="text-sm font-semibold text-black">{order.addressName}</p>
                )}
                {order.addressPhone && (
                  <p className="font-mono text-xs text-neutral-500">{order.addressPhone}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{order.address}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-black">
                  <CreditCard size={16} /> Payment
                </h2>
                <p className="text-sm text-neutral-600">{order.paymentMethod}</p>
                {order.courierName && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Courier: <span className="font-semibold text-black">{order.courierName}</span>
                    {order.trackingNumber ? (
                      <>
                        {" · "}AWB:{" "}
                        <span className="font-mono font-semibold text-black">{order.trackingNumber}</span>
                      </>
                    ) : null}
                  </p>
                )}
                <span
                  className={cn(
                    "mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    (order.paymentStatus === "Paid" || order.paymentStatus === "Verified") &&
                      "border-green-200 bg-green-50 text-green-700",
                    (order.paymentStatus === "Pending" ||
                      order.paymentStatus === "Pending Verification") &&
                      "border-amber-200 bg-amber-50 text-amber-700",
                    order.paymentStatus === "Failed" && "border-red-200 bg-red-50 text-red-700"
                  )}
                >
                  {paymentStatusLabel(order.paymentStatus)}
                </span>
              </div>
            </div>

            {/* Manual reference verification — only while payment is unresolved
                and the method actually needs online verification (not COD). The
                shared helper is the single source of this rule. */}
            {requiresOnlinePaymentVerification(order.paymentMethod) &&
              order.paymentStatus !== "Verified" &&
              order.paymentStatus !== "Paid" &&
              (order.paymentStatus === "Pending Verification" ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                  <p className="font-bold text-amber-900">Payment under verification</p>
                  <p className="mt-1 text-xs">
                    We received your UTR reference and are verifying it against the merchant account.
                  </p>
                </div>
              ) : (
                <UtrPaymentForm orderId={order.id} />
              ))}

            {/* Totals */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>MRP</span>
                  <span>{formatPrice(order.itemTotal + order.discount)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>− {formatPrice(order.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>
                    {order.deliveryCharge === 0 ? "FREE" : formatPrice(order.deliveryCharge)}
                  </span>
                </div>
                {order.coupon && order.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon ({order.coupon})</span>
                    <span>− {formatPrice(order.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-200 pt-2.5 text-base font-bold text-black">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/orders">Back to Orders</Link>
              </Button>
              {order.status !== "Cancelled" && order.status !== "Delivered" && (
                <Button variant="outline" onClick={() => cancelOrder(order.id)}>
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}