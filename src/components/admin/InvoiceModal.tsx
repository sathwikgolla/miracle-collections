"use client";

import { useState } from "react";
import { FileText, Package, Printer, X } from "lucide-react";
import type { AdminOrder } from "@/lib/adminTypes";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";

interface InvoiceModalProps {
  order: AdminOrder | null;
  onClose: () => void;
  defaultTab?: "invoice" | "packingslip";
}

export function InvoiceModal({ order, onClose, defaultTab = "invoice" }: InvoiceModalProps) {
  const { settings } = useAdmin();
  const [tab, setTab] = useState<"invoice" | "packingslip">(defaultTab);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = `MC-INV-${order.id.replace(/[^0-9]/g, "") || "2026-001"}`;
  const invoiceDate = new Date(order.placedAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Controls - Hidden during print */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-3 sm:px-6 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("invoice")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                tab === "invoice"
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-600 hover:text-black hover:bg-neutral-100"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Tax Invoice</span>
            </button>
            <button
              onClick={() => setTab("packingslip")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                tab === "packingslip"
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-600 hover:text-black hover:bg-neutral-100"
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Packing Slip</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-100 transition shadow-xs"
            >
              <Printer className="h-4 w-4 text-black" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-100/70">
          <div className="mx-auto max-w-2xl bg-white p-6 sm:p-10 text-neutral-900 shadow-xl rounded-lg font-sans text-xs print:p-0 print:shadow-none print:w-full print:max-w-none border border-neutral-200">
            {tab === "invoice" ? (
              // ---------------- GST TAX INVOICE ----------------
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-neutral-300 pb-5">
                  <div>
                    <h1 className="text-xl font-extrabold uppercase tracking-tight text-neutral-950">
                      {settings.storeName}
                    </h1>
                    <p className="text-neutral-600 mt-1">{settings.address}</p>
                    <p className="text-neutral-600">Email: {settings.supportEmail} | Phone: {settings.supportPhone}</p>
                    <div className="mt-2 inline-block bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                      <span className="font-bold text-neutral-800">GSTIN: </span>
                      <span className="font-mono text-neutral-900">{settings.gstin}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-black text-white font-bold uppercase tracking-wider px-3 py-1 text-[11px] rounded-md shadow-xs">
                      TAX INVOICE
                    </span>
                    <p className="font-mono font-bold text-sm text-neutral-900 mt-2">{invoiceNo}</p>
                    <p className="text-neutral-500">Date: {invoiceDate}</p>
                    <p className="text-neutral-500">Order ID: #{order.id}</p>
                  </div>
                </div>

                {/* Bill to / Ship to */}
                <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[10px] text-neutral-500 mb-1">
                      Billed & Shipped To:
                    </p>
                    <p className="font-bold text-neutral-900 text-sm">{order.shippingAddress.name}</p>
                    <p className="text-neutral-700">{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p className="text-neutral-700">{order.shippingAddress.line2}</p>}
                    <p className="text-neutral-700">
                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                    </p>
                    <p className="text-neutral-600 mt-1">Phone: {order.shippingAddress.phone}</p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-neutral-500 mb-1">
                      Payment Details:
                    </p>
                    <p className="text-neutral-700">Method: <strong>{order.paymentMethod}</strong></p>
                    {order.utrNumber && (
                      <p className="text-neutral-700 font-mono">
                        UTR: <strong>{order.utrNumber}</strong>
                      </p>
                    )}
                    <p className="text-neutral-700">
                      Status: <strong className="text-emerald-700 font-semibold">{order.paymentStatus}</strong>
                    </p>
                    {order.courierName && (
                      <p className="text-neutral-700">
                        Dispatch Courier: {order.courierName} ({order.trackingNumber})
                      </p>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      <th className="py-2">Item & Description</th>
                      <th className="py-2 text-center">SKU / Variant</th>
                      <th className="py-2 text-center">HSN</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {order.items.map((it, idx) => (
                      <tr key={idx} className="py-2.5">
                        <td className="py-2 font-medium text-neutral-900 pr-2">
                          {it.name}
                        </td>
                        <td className="py-2 text-center text-neutral-600 font-mono text-[11px]">
                          {it.variant || it.sku}
                        </td>
                        <td className="py-2 text-center text-neutral-500 font-mono text-[11px]">
                          6204
                        </td>
                        <td className="py-2 text-center font-bold text-neutral-900">
                          {it.qty}
                        </td>
                        <td className="py-2 text-right text-neutral-700">
                          {formatPrice(it.price)}
                        </td>
                        <td className="py-2 text-right font-bold text-neutral-900">
                          {formatPrice(it.price * it.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary calculation */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 border-t border-neutral-300 pt-2 text-right">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal:</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Coupon Discount:</span>
                        <span>- {formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-600">
                      <span>Shipping Fee:</span>
                      <span>{order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 text-[11px]">
                      <span>Included GST ({settings.defaultGstRate}%):</span>
                      <span>{formatPrice(order.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-sm font-bold text-neutral-950">
                      <span>Invoice Total:</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer notes & sign */}
                <div className="border-t border-neutral-200 pt-6 flex justify-between items-end text-[11px] text-neutral-500">
                  <div>
                    <p className="font-semibold text-neutral-700">Terms & Conditions:</p>
                    <p>1. Returns accepted within 7 days in original condition with tags.</p>
                    <p>2. Computer-generated tax invoice verified under Indian IT act.</p>
                  </div>
                  <div className="text-right">
                    <div className="h-10 border-b border-neutral-400 w-36 mb-1 ml-auto" />
                    <p className="font-bold text-neutral-800">For {settings.storeName}</p>
                    <p className="text-[10px]">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            ) : (
              // ---------------- PACKING SLIP ----------------
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-neutral-950">DISPATCH PACKING SLIP</h1>
                    <p className="text-neutral-500 text-xs">Fulfillment Dept • Miracle Collections</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-bold text-sm">#{order.id}</p>
                    <p className="text-neutral-500 text-xs">{invoiceDate}</p>
                  </div>
                </div>

                {/* Destination */}
                <div className="rounded border-2 border-dashed border-neutral-300 p-4 bg-neutral-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Shipment Destination:
                  </p>
                  <p className="text-sm font-bold text-neutral-900">{order.shippingAddress.name}</p>
                  <p className="text-neutral-800">{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p className="text-neutral-800">{order.shippingAddress.line2}</p>}
                  <p className="text-neutral-800 font-semibold">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                  <p className="text-neutral-700 mt-1 font-mono">Contact: {order.shippingAddress.phone}</p>
                </div>

                {/* Picking Checklist */}
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px] text-neutral-700 mb-2">
                    Pick List & Quality Check:
                  </p>
                  <table className="w-full border border-neutral-200">
                    <thead className="bg-neutral-100 text-left">
                      <tr>
                        <th className="p-2 border-r border-neutral-200 w-12 text-center">Check</th>
                        <th className="p-2 border-r border-neutral-200">Item</th>
                        <th className="p-2 border-r border-neutral-200">SKU / Variant</th>
                        <th className="p-2 text-center w-16">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {order.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-center border-r border-neutral-200">
                            <div className="h-4 w-4 border border-neutral-400 mx-auto rounded-sm" />
                          </td>
                          <td className="p-2.5 font-medium text-neutral-900 border-r border-neutral-200">
                            {it.name}
                          </td>
                          <td className="p-2.5 font-mono text-neutral-700 border-r border-neutral-200">
                            {it.variant || it.sku}
                          </td>
                          <td className="p-2.5 text-center font-bold text-neutral-900">
                            {it.qty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-neutral-300 pt-4 flex justify-between items-center text-xs text-neutral-600">
                  <div>
                    <p>Packed by: _____________________</p>
                  </div>
                  <div>
                    <p>QC Inspection: [ PASSED ]</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
