"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";
import type { AdminOrder, AdminPayment, AdminProduct } from "@/lib/adminTypes";
import { PaymentVerifyModal } from "@/components/admin/PaymentVerifyModal";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { StockAdjustModal } from "@/components/admin/StockAdjustModal";
import { InvoiceModal } from "@/components/admin/InvoiceModal";
import { getLowStockRows } from "@/lib/inventory";

type ChartPeriod = "today" | "7d" | "30d" | "1y";

export default function AdminDashboardPage() {
  const {
    orders,
    payments,
    paymentVerifications,
    products,
    customers,
    settings,
    totalRevenue,
    pendingPaymentCount,
    lowStockCount,
  } = useAdmin();

  const [period, setPeriod] = useState<ChartPeriod>("7d");
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<{ id: string; sku: string } | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<{ order: AdminOrder; tab: "invoice" | "packingslip" } | null>(null);

  // Low-stock rows — the SAME shared source the Inventory page uses, so the
  // dashboard and inventory can never disagree (incl. variant-less products).
  const lowStockItems = useMemo(() => getLowStockRows(products), [products]);

  // Pending Payments list
  // Match the shared pendingPaymentCount predicate so the KPI and this list
  // can never disagree: pre-order checkout submissions awaiting a decision +
  // awaiting a customer UTR + awaiting verification on existing orders.
  const pendingPayments = useMemo(
    () =>
      payments.filter(
        (p) => p.status === "pending_verification" || p.status === "awaiting_reference"
      ),
    [payments]
  );
  const pendingVerifications = useMemo(
    () => paymentVerifications.filter((v) => v.status === "pending"),
    [paymentVerifications]
  );
  const pendingQueueCount = pendingPayments.length + pendingVerifications.length;

  // Dynamic Chart Data based on period
  const chartData = useMemo(() => {
    if (period === "today") {
      return [
        { label: "8 AM", sales: 2400, orders: 2 },
        { label: "10 AM", sales: 4890, orders: 4 },
        { label: "12 PM", sales: 7800, orders: 6 },
        { label: "2 PM", sales: 6200, orders: 5 },
        { label: "4 PM", sales: 9100, orders: 7 },
        { label: "6 PM", sales: 12400, orders: 9 },
        { label: "Now", sales: 8600, orders: 6 },
      ];
    }
    if (period === "7d") {
      return [
        { label: "Sat", sales: 18400, orders: 14 },
        { label: "Sun", sales: 24900, orders: 19 },
        { label: "Mon", sales: 15200, orders: 11 },
        { label: "Tue", sales: 19800, orders: 15 },
        { label: "Wed", sales: 22100, orders: 17 },
        { label: "Thu", sales: 28400, orders: 21 },
        { label: "Today", sales: 31200, orders: 24 },
      ];
    }
    if (period === "30d") {
      return [
        { label: "Week 1", sales: 112000, orders: 84 },
        { label: "Week 2", sales: 145000, orders: 108 },
        { label: "Week 3", sales: 168000, orders: 126 },
        { label: "Week 4", sales: 194000, orders: 145 },
      ];
    }
    return [
      { label: "Q1", sales: 340000, orders: 250 },
      { label: "Q2", sales: 490000, orders: 360 },
      { label: "Q3", sales: 680000, orders: 510 },
      { label: "Q4 (Festive)", sales: 940000, orders: 720 },
    ];
  }, [period]);

  const maxSale = Math.max(...chartData.map((d) => d.sales));

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
              Miracle Collections — Admin Dashboard
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            Real-time Store Operations • Merchant UPI Verification & Live Inventory Matrix
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Active Theme</p>
            <p className="text-xs text-black font-bold capitalize">
              {settings?.activeFestiveTheme?.replace("_", " ") || "Default"}
            </p>
          </div>
          <Link
            href="/admin/content"
            className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Switch Theme</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-neutral-300 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-black border border-neutral-200">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-black mt-3 font-mono">
            {formatPrice(totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2">
            <span className="font-bold">+18.4%</span>
            <span className="text-neutral-500">vs last period</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-neutral-300 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-black border border-neutral-200">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-black mt-3 font-mono">{orders.length}</p>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2">
            <span className="text-emerald-700 font-semibold">
              {orders.filter((o) => o.orderStatus === "Delivered").length} Delivered
            </span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">
              {orders.filter((o) => o.orderStatus === "Payment Pending").length} Pending
            </span>
          </div>
        </div>

        {/* Pending UTR Queue Alert */}
        <Link
          href="/admin/payments"
          className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm relative overflow-hidden group hover:border-amber-300 transition block"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Pending UTR Queue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-3 font-mono">
            {pendingPaymentCount}{" "}
            <span className="text-xs font-normal text-amber-700">awaiting check</span>
          </p>
          <div className="flex items-center gap-1 text-xs text-amber-800 mt-2 group-hover:underline font-semibold">
            <span>Verify customer payments</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        {/* Low Stock Alert */}
        <Link
          href="/admin/inventory"
          className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 transition block"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Low Stock Alerts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-900 mt-3 font-mono">
            {lowStockCount}{" "}
            <span className="text-xs font-normal text-rose-700">variants ≤ 5 units</span>
          </p>
          <div className="flex items-center gap-1 text-xs text-rose-800 mt-2 group-hover:underline font-semibold">
            <span>Open inventory ledger</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>

      {/* Secondary KPI Targets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-neutral-500">Cart-to-Order Conversion</p>
          <p className="text-base font-extrabold text-black mt-1">3.4%</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Exceeds 3.0% store target</span>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-neutral-500">Oversell Incidents</p>
          <p className="text-base font-extrabold text-emerald-600 mt-1">0 incidents</p>
          <span className="text-[10px] text-neutral-500">Race-safe reservations</span>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-neutral-500">Avg Verification Time</p>
          <p className="text-base font-extrabold text-black mt-1">22 mins</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Target &lt; 2 hrs</span>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-neutral-500">Active Customer Base</p>
          <p className="text-base font-extrabold text-black mt-1">{customers.length} Accounts</p>
          <span className="text-[10px] text-neutral-500">28% repeat order rate</span>
        </div>
      </div>

      {/* Charts & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Sales Chart */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-black">Sales & Orders Volume</h2>
              <p className="text-xs text-neutral-500">Revenue trajectory over time</p>
            </div>

            <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-1 text-xs">
              {(["today", "7d", "30d", "1y"] as ChartPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded px-2.5 py-1 font-semibold uppercase text-[10px] transition ${
                    period === p
                      ? "bg-black text-white shadow-xs"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-neutral-100">
            {chartData.map((d, i) => {
              const heightPercent = Math.max(12, Math.round((d.sales / maxSale) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] text-black font-mono font-bold opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {formatPrice(d.sales)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[42px] rounded-t-md bg-neutral-900 transition-all duration-200 group-hover:bg-black relative admin-chart-bar"
                  />
                  <span className="text-[10px] text-neutral-500 font-medium truncate max-w-full">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
            <span>Period Peak: <strong className="text-black font-mono">{formatPrice(maxSale)}</strong></span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-black" /> Gross Merchandise Value (GMV)
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-black">Category Sales Distribution</h2>
            <p className="text-xs text-neutral-500">Miracle Collections Core Segments</p>
          </div>

          <div className="space-y-3.5 my-auto">
            {[
              { name: "Women Ethnic & Kurtas", share: 44, color: "bg-black" },
              { name: "Men Linen & Shirts", share: 28, color: "bg-neutral-700" },
              { name: "Artisanal Footwear & Mojris", share: 16, color: "bg-neutral-500" },
              { name: "Kids Festive & Playwear", share: 12, color: "bg-neutral-400" },
            ].map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-700 font-medium">{cat.name}</span>
                  <span className="font-bold text-black font-mono">{cat.share}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    style={{ width: `${cat.share}%` }}
                    className={`h-full rounded-full ${cat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/admin/categories"
            className="flex items-center justify-between text-xs text-black font-semibold hover:underline pt-3 border-t border-neutral-100"
          >
            <span>Manage Categories & Filters</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Action Center: Pending UTR Queue & Critical Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending UTR Verification Queue */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-black" />
              <h2 className="text-sm font-bold text-black">Pending UTR Verifications</h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                {pendingQueueCount} Urgent
              </span>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs text-black font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
            {pendingQueueCount > 0 ? (
              <>
                {/* Pre-order submissions: no order exists yet — review on /admin/payments */}
                {pendingVerifications.map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black">New checkout submission</span>
                        <span className="rounded bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[10px] font-bold border border-amber-200">
                          PRE-ORDER
                        </span>
                      </div>
                      <p className="text-neutral-500 mt-0.5">
                        {v.customerName} •{" "}
                        UTR: <span className="font-mono text-black font-semibold">{v.utrNumber}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-black font-mono">{formatPrice(v.amount)}</span>
                      <Link
                        href="/admin/payments"
                        className="rounded-md bg-black hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}

                {pendingPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">Order #{p.orderId}</span>
                      {p.isDuplicateUtr && (
                        <span className="rounded bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[10px] font-bold border border-rose-200">
                          DUPLICATE UTR
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-500 mt-0.5">
                      {p.customerName} •{" "}
                      {p.utrNumber ? (
                        <>
                          UTR: <span className="font-mono text-black font-semibold">{p.utrNumber}</span>
                        </>
                      ) : (
                        <span className="italic">Awaiting customer UTR</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-black font-mono">{formatPrice(p.amount)}</span>
                    {p.status === "pending_verification" ? (
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="rounded-md bg-black hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        Verify
                      </button>
                    ) : (
                      <span className="text-neutral-400 text-[11px] italic">Awaiting UTR</span>
                    )}
                  </div>
                </div>
              ))}
              </>
            ) : (
              <p className="text-xs text-neutral-500 py-6 text-center">
                All UTR payments verified. Queue is clear!
              </p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-black" />
              <h2 className="text-sm font-bold text-black">Low Stock Variant Alerts</h2>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                {lowStockItems.length} SKUs Low
              </span>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs text-black font-semibold hover:underline flex items-center gap-1"
            >
              <span>Stock Matrix</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-black truncate max-w-[220px]">
                      {item.productName}
                    </p>
                    <p className="text-neutral-500 font-mono text-[11px] mt-0.5">
                      {item.sku} • {item.color} / {item.size}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {item.stock} left
                    </span>
                    <button
                      onClick={() =>
                        setAdjustingProduct({ id: item.productId, sku: item.sku })
                      }
                      className="rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-black transition-colors"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-500 py-6 text-center">
                All variants healthy above safety threshold.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Stream */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-black">Recent Customer Orders</h2>
            <p className="text-xs text-neutral-500">Live order fulfillment queue</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-black font-semibold hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-black">#{o.id}</td>
                  <td className="py-3 px-4 text-black">
                    <p className="font-semibold text-black">{o.customerName}</p>
                    <p className="text-neutral-500 text-[11px] font-mono">{o.customerPhone}</p>
                  </td>
                  <td className="py-3 px-4 text-neutral-500">
                    {o.items.reduce((s, i) => s + i.qty, 0)} items
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-black">{formatPrice(o.total)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        o.paymentStatus === "Verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        o.orderStatus === "Delivered"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : o.orderStatus === "Shipped"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : o.orderStatus === "Packed"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200"
                      }`}
                    >
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 px-3 py-1 font-semibold text-black transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedPayment && (
        <PaymentVerifyModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

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

      {adjustingProduct && (
        <StockAdjustModal
          initialProductId={adjustingProduct.id}
          initialSku={adjustingProduct.sku}
          onClose={() => setAdjustingProduct(null)}
        />
      )}

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder.order}
          defaultTab={invoiceOrder.tab}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
