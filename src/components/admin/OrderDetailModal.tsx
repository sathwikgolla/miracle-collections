"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  Send,
  Truck,
  User,
  X,
} from "lucide-react";
import type { AdminOrder, AdminOrderStatus } from "@/lib/adminTypes";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";
import { normalizeOrderStatus, orderLifecycleIndex } from "@/lib/orderStatus";
import {
  hasOrderAddress,
  orderAddressLines,
} from "@/lib/orderAddress";

interface OrderDetailModalProps {
  order: AdminOrder | null;
  onClose: () => void;
  onOpenInvoice?: (order: AdminOrder, tab: "invoice" | "packingslip") => void;
}

const LIFECYCLE_STEPS: AdminOrderStatus[] = [
  "Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export function OrderDetailModal({
  order,
  onClose,
  onOpenInvoice,
}: OrderDetailModalProps) {
  const { updateOrderStatus, addInternalOrderNote, confirmOrder } = useAdmin();
  const [newNote, setNewNote] = useState("");
  const [showShipForm, setShowShipForm] = useState(false);
  const [courierName, setCourierName] = useState(order?.courierName || "Delhivery Surface");
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || "");

  if (!order) return null;

  const normalizedStatus = normalizeOrderStatus(order.orderStatus);
  const currentStepIndex = orderLifecycleIndex(order.orderStatus);

  const handleNextStatus = () => {
    if (order.orderStatus === "Placed") {
      // Accepting the order is the ONE action that deducts stock (atomic and
      // idempotent). A second click is a no-op.
      confirmOrder(order.id);
    } else if (normalizedStatus === "Confirmed") {
      // Confirmed -> Shipped requires courier / AWB details.
      setShowShipForm(true);
    } else if (order.orderStatus === "Shipped") {
      updateOrderStatus(order.id, "Out for Delivery", undefined, undefined, "Order is out for delivery");
    } else if (order.orderStatus === "Out for Delivery") {
      updateOrderStatus(order.id, "Delivered", undefined, undefined, "Order delivered to customer");
    }
  };

  const handleConfirmShipment = () => {
    if (!trackingNumber.trim()) {
      alert("Please enter a tracking / AWB number");
      return;
    }
    updateOrderStatus(
      order.id,
      "Shipped",
      courierName,
      trackingNumber,
      `Order dispatched via ${courierName} (AWB: ${trackingNumber})`
    );
    setShowShipForm(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addInternalOrderNote(order.id, newNote);
    setNewNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-black">Order #{order.id}</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    order.orderStatus === "Delivered"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : order.orderStatus === "Payment Pending"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : order.orderStatus === "Payment Rejected" || order.orderStatus === "Cancelled"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Placed on {new Date(order.placedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInvoice && (
              <>
                <button
                  onClick={() => onOpenInvoice(order, "invoice")}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-neutral-500" />
                  <span>GST Invoice</span>
                </button>
                <button
                  onClick={() => onOpenInvoice(order, "packingslip")}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Packing Slip</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Order Lifecycle Progress Bar */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">
              Order Lifecycle Stage
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step}
                    className={`rounded-lg p-2.5 text-center border transition ${
                      isCurrent
                        ? "bg-black border-black text-white font-bold shadow-xs"
                        : isPassed
                        ? "bg-white border-neutral-200 text-black font-medium"
                        : "bg-neutral-100 border-neutral-200 text-neutral-400"
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {isPassed ? (
                        <CheckCircle2 className={`h-4 w-4 ${isCurrent ? "text-white" : "text-black"}`} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-neutral-300" />
                      )}
                    </div>
                    <p className="text-[11px] leading-tight">{step}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick advance action button */}
            {normalizedStatus !== "Delivered" &&
              order.orderStatus !== "Cancelled" &&
              order.orderStatus !== "Returned" &&
              order.orderStatus !== "Payment Rejected" && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleNextStatus}
                    className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    <span>
                      {order.orderStatus === "Placed"
                        ? "Accept / Confirm Order"
                        : normalizedStatus === "Confirmed"
                        ? "Dispatch / Ship Order"
                        : order.orderStatus === "Shipped"
                        ? "Move to Out for Delivery"
                        : "Mark as Delivered"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
          </div>

          {/* Dispatch / Shipping Form Drawer */}
          {showShipForm && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-black font-bold text-xs">
                <Truck className="h-4 w-4" />
                <span>Enter Shipping & Courier Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-neutral-600 font-medium">Courier Partner</label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none"
                  >
                    <option value="Delhivery Surface">Delhivery Surface</option>
                    <option value="Blue Dart Express">Blue Dart Express</option>
                    <option value="DTDC Air">DTDC Air</option>
                    <option value="Shadowfax Local">Shadowfax Local</option>
                    <option value="India Post Speed Post">India Post Speed Post</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-600 font-medium">AWB / Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DEL489001928IN"
                    className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-black font-mono focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowShipForm(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-black font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmShipment}
                  className="px-4 py-1.5 rounded-md bg-black hover:bg-neutral-800 text-xs font-semibold text-white shadow-xs transition-colors"
                >
                  Confirm Shipment & Update Customer
                </button>
              </div>
            </div>
          )}

          {/* Customer & Payment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Customer & Delivery Address
              </p>
              <div className="flex items-center gap-2 text-black font-semibold">
                <User className="h-4 w-4 text-neutral-500" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 text-xs">
                <Phone className="h-3.5 w-3.5 text-neutral-500" />
                <span className="font-mono">{order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 text-xs">
                <Mail className="h-3.5 w-3.5 text-neutral-500" />
                <span>{order.customerEmail}</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-600 text-xs pt-2 border-t border-neutral-200 mt-2">
                <MapPin className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div className="min-w-0">
                  {/* The order's OWN saved delivery address. Every line is
                      rendered only when present — never a ", -" placeholder —
                      and "Address unavailable" when nothing was saved. */}
                  {hasOrderAddress(order.shippingAddress) ? (
                    <>
                      {order.shippingAddress.name && (
                        <p className="font-semibold text-black">{order.shippingAddress.name}</p>
                      )}
                      {order.shippingAddress.phone && (
                        <p className="font-mono">{order.shippingAddress.phone}</p>
                      )}
                      {orderAddressLines(order.shippingAddress).map((line, i) => (
                        <p key={`${i}-${line}`}>{line}</p>
                      ))}
                    </>
                  ) : (
                    <p className="italic text-neutral-500">Address unavailable</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment & Courier info */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Payment & Fulfillment
              </p>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Payment Method:</span>
                <span className="font-semibold text-black">{order.paymentMethod}</span>
              </div>
              {order.utrNumber && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">Bank UTR Reference:</span>
                  <span className="font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-neutral-300">
                    {order.utrNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Payment Status:</span>
                <span className="font-bold text-emerald-700">{order.paymentStatus}</span>
              </div>
              {order.courierName && (
                <div className="border-t border-neutral-200 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Courier:</span>
                    <span className="text-black font-medium">{order.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">AWB Tracking:</span>
                    <span className="font-mono text-black font-bold">{order.trackingNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line items table */}
          <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white">
            <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 text-xs font-bold text-neutral-600 uppercase tracking-wider">
              Ordered Items ({order.items.reduce((s, i) => s + i.qty, 0)} Units)
            </div>
            <div className="divide-y divide-neutral-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 text-xs">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover border border-neutral-200"
                    />
                    <div>
                      <p className="font-bold text-black text-sm">{item.name}</p>
                      <p className="text-neutral-500 font-mono text-[11px]">
                        SKU: {item.sku} • Variant: {item.variant}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-black text-sm">
                      {formatPrice(item.price * item.qty)}
                    </p>
                    <p className="text-neutral-500">
                      {item.qty} × {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 space-y-1.5 text-xs text-right">
              <div className="flex justify-end gap-6 text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-black">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-end gap-6 text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">- {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-end gap-6 text-neutral-600">
                <span>Delivery:</span>
                <span className="font-mono font-bold text-black">
                  {order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-end gap-6 text-neutral-500 text-[11px]">
                <span>Taxes (Included):</span>
                <span className="font-mono">{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="flex justify-end gap-6 text-sm font-extrabold text-black border-t border-neutral-200 pt-2">
                <span>Total Amount:</span>
                <span className="font-mono text-base">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Timeline History */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Order Activity Timeline
              </p>
              <div className="space-y-3 text-xs">
                {order.timeline.map((entry, idx) => (
                  <div key={idx} className="relative pl-5 border-l border-neutral-300 space-y-0.5">
                    <span className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-black" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-black">{entry.status}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-neutral-600 text-[11px]">{entry.note}</p>
                    {entry.staff && (
                      <p className="text-[10px] text-neutral-500">By: {entry.staff}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  Internal Staff Notes (Not visible to customer)
                </p>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {order.internalNotes && order.internalNotes.length > 0 ? (
                    order.internalNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="rounded-md bg-white border border-neutral-200 p-2.5 text-xs text-neutral-700 shadow-xs"
                      >
                        {note}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500 py-2">No internal notes added yet.</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add note for staff..."
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
