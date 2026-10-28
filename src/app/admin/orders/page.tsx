"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ClipboardList,
  Copy,
  Download,
  FileText,
  MapPin,
  Search,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";
import type { AdminOrder, AdminOrderStatus } from "@/lib/adminTypes";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { InvoiceModal } from "@/components/admin/InvoiceModal";
import { Modal } from "@/components/ui/Modal";
import { normalizeOrderStatus } from "@/lib/orderStatus";
import {
  formatOrderAddress,
  hasOrderAddress,
  orderAddressLines,
  orderAddressPreview,
} from "@/lib/orderAddress";

const STATUS_TABS: (AdminOrderStatus | "All")[] = [
  "All",
  "Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

/** Small popup with the complete saved address + one-click copy. */
function AddressModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const s = order.shippingAddress;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(formatOrderAddress(s));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — the address is
      // still fully visible on screen for manual copying.
    }
  };

  return (
    <Modal open onClose={onClose} title="Delivery Address" className="max-w-md">
      <p className="text-[11px] font-mono text-neutral-500">Order {order.id}</p>
      <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
        {s.name && <p className="font-semibold text-black">{s.name}</p>}
        {s.phone && <p className="font-mono text-xs text-neutral-600">{s.phone}</p>}
        <div className="mt-2 space-y-0.5 leading-relaxed text-neutral-700">
          {orderAddressLines(s).map((line, i) => (
            <p key={`${i}-${line}`}>{line}</p>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Address"}
        </button>
        <button
          onClick={onClose}
          className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default function AdminOrdersPage() {
  const { orders, exportToCsv } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminOrderStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  // Which order's full delivery address is open in the address popup.
  const [addressOrder, setAddressOrder] = useState<AdminOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<{
    order: AdminOrder;
    tab: "invoice" | "packingslip";
  } | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchTab =
        activeTab === "All" || normalizeOrderStatus(o.orderStatus) === activeTab;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.utrNumber && o.utrNumber.includes(q)) ||
        o.shippingAddress.city.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [orders, activeTab, search]);

  const handleExportCsv = () => {
    const data = filteredOrders.map((o) => ({
      Order_ID: o.id,
      Date: new Date(o.placedAt).toLocaleDateString(),
      Customer: o.customerName,
      Phone: o.customerPhone,
      City: o.shippingAddress.city,
      Items_Count: o.items.reduce((s, i) => s + i.qty, 0),
      Subtotal: o.subtotal,
      Discount: o.discount,
      Total: o.total,
      Payment_Method: o.paymentMethod,
      Payment_Status: o.paymentStatus,
      UTR: o.utrNumber || "N/A",
      Order_Status: o.orderStatus,
      Courier: o.courierName || "N/A",
      AWB: o.trackingNumber || "N/A",
    }));
    exportToCsv(data, "Miracle_Orders");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-black" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
              Order Fulfillment & Management
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Order lifecycle management, GST tax invoices, packing slips and courier dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4 text-black" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Orders Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        {/* Status Tabs */}
        <div className="flex overflow-x-auto gap-1.5 no-scrollbar py-1">
          {STATUS_TABS.map((tab) => {
            const count =
              tab === "All"
                ? orders.length
                : orders.filter((o) => normalizeOrderStatus(o.orderStatus) === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab
                    ? "bg-black text-white shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    activeTab === tab
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, phone, city, UTR..."
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 pl-9 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Delivery Address</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Order Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-4 font-mono">
                      <p className="font-bold text-black text-sm">#{o.id}</p>
                      <p className="text-neutral-500 text-[11px] font-sans mt-0.5">
                        {new Date(o.placedAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    <td className="p-4 text-black">
                      <p className="font-semibold text-black">{o.customerName}</p>
                      <p className="text-neutral-500 font-mono text-[11px]">{o.customerPhone}</p>
                    </td>

                    {/* The exact address saved with THIS order — short preview
                        in the table, full details (and copy) in the popup. */}
                    <td className="p-4">
                      {hasOrderAddress(o.shippingAddress) ? (
                        <div className="min-w-0 max-w-[170px]">
                          {o.shippingAddress.name && (
                            <p className="truncate font-semibold text-black">
                              {o.shippingAddress.name}
                            </p>
                          )}
                          <p className="line-clamp-1 text-[11px] text-neutral-500">
                            {orderAddressPreview(o.shippingAddress)}
                          </p>
                          <button
                            onClick={() => setAddressOrder(o)}
                            className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            <MapPin className="h-3 w-3" />
                            View Address
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] italic text-neutral-400">
                          Address unavailable
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-neutral-600">
                      <p className="text-black font-medium">{o.shippingAddress.city}</p>
                      <p className="text-[11px] text-neutral-500">{o.shippingAddress.state}</p>
                    </td>

                    <td className="p-4 text-neutral-700">
                      <span className="font-semibold text-black">
                        {o.items.reduce((s, i) => s + i.qty, 0)} items
                      </span>
                      <p className="text-[11px] text-neutral-500 truncate max-w-[140px]">
                        {o.items[0]?.name}
                      </p>
                    </td>

                    <td className="p-4 font-mono">
                      <p className="font-extrabold text-black text-sm">{formatPrice(o.total)}</p>
                      {o.discount > 0 && (
                        <p className="text-emerald-700 text-[10px]">
                          -{formatPrice(o.discount)} off
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            o.paymentStatus === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : o.paymentStatus === "Pending Verification"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                        {o.utrNumber && (
                          <p className="font-mono text-[10px] text-neutral-500 truncate max-w-[120px]">
                            UTR: {o.utrNumber}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                          o.orderStatus === "Delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : o.orderStatus === "Shipped"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : o.orderStatus === "Packed"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : o.orderStatus === "Payment Pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-neutral-100 text-neutral-700 border-neutral-200"
                        }`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 px-2.5 py-1.5 font-semibold text-black transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setInvoiceOrder({ order: o, tab: "invoice" })}
                          title="Print GST Invoice"
                          className="rounded-md border border-neutral-300 bg-white p-1.5 text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    No orders match the selected filters or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOpenInvoice={(order, tab) => {
            setSelectedOrder(null);
            setInvoiceOrder({ order, tab });
          }}
        />
      )}

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder.order}
          defaultTab={invoiceOrder.tab}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {addressOrder && (
        <AddressModal order={addressOrder} onClose={() => setAddressOrder(null)} />
      )}
    </div>
  );
}
