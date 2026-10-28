"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2, CreditCard, MapPin } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";
import { formatPrice, handleImageError } from "@/lib/utils";

export function OrderSuccessClient() {
  const sp = useSearchParams();
  const { orders, hydrated } = useStore();
  const id = sp.get("id") ?? "";
  const order = orders.find((o) => o.id === id);

  if (hydrated && !order) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">Order not found.</p>
        <Button asChild className="mt-5">
          <Link href="/orders">View My Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {/* Success header */}
      <div className="flex flex-col items-center bg-black px-6 py-10 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <CheckCircle2 size={36} className="text-green-400" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">Order Placed Successfully!</h1>
        <p className="mt-1 text-sm text-neutral-300">
          Thank you for your purchase!
        </p>
        <p className="mt-4 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">
          Order ID: {order?.id}
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="flex items-center gap-1.5 font-bold text-black">
              <Calendar size={15} /> Order Date
            </p>
            <p className="mt-1 text-neutral-600">
              {order ? new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="flex items-center gap-1.5 font-bold text-black">
              <CreditCard size={15} /> Payment
            </p>
            <p className="mt-1 text-neutral-600">{order?.paymentMethod}</p>
            <span className="mt-1 inline-block text-xs font-semibold text-green-700">{order?.paymentStatus}</span>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4 sm:col-span-2">
            <p className="flex items-center gap-1.5 font-bold text-black">
              <MapPin size={15} /> Delivery Address
            </p>
            {order?.addressName && (
              <p className="mt-1 font-semibold text-black">{order.addressName}</p>
            )}
            {order?.addressPhone && (
              <p className="font-mono text-xs text-neutral-500">{order.addressPhone}</p>
            )}
            <p className="mt-1 text-neutral-600">{order?.address}</p>
          </div>
        </div>

        {/* Items */}
        <div className="mt-5 rounded-lg border border-neutral-200">
          <div className="border-b border-neutral-100 px-4 py-2.5 text-sm font-bold text-black">
            Ordered Products
          </div>
          <div className="divide-y divide-neutral-100">
            {order?.items.map((item, index) => (
              <div key={`${item.productId}-${item.size || ''}-${item.color || ''}-${index}`} className="flex items-center gap-3 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} onError={handleImageError} className="h-14 w-14 rounded border border-neutral-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-black">{item.name}</p>
                  <p className="text-xs text-neutral-500">Qty {item.qty}</p>
                </div>
                <span className="text-sm font-semibold text-black">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals + delivery */}
        <div className="mt-5 rounded-lg border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">
            Expected delivery: <span className="font-bold text-black">{order?.deliveryBy}</span>
          </p>
          <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-black">
            <span>Total Amount</span>
            <span>{formatPrice(order?.total ?? 0)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild fullWidth>
            <Link href={`/orders/${order?.id}`}>Track Order</Link>
          </Button>
          <Button asChild variant="outline" fullWidth>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}