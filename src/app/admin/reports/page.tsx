"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  Layers,
  PieChart,
  Printer,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice, getProductTotalStock } from "@/lib/utils";

type ReportType = "sales" | "categories" | "valuation" | "payments";

export default function AdminReportsPage() {
  const { products, orders, payments, exportToCsv } = useAdmin();
  const [reportType, setReportType] = useState<ReportType>("sales");

  // Calculations
  const grossSales = orders.reduce((s, o) => s + o.subtotal, 0);
  const totalDiscounts = orders.reduce((s, o) => s + o.discount, 0);
  const totalShipping = orders.reduce((s, o) => s + o.shippingFee, 0);
  const netRevenue = orders
    .filter((o) => o.paymentStatus === "Verified" || o.orderStatus === "Delivered")
    .reduce((s, o) => s + o.total, 0);

  // Stock Valuation calculation
  const stockValuation = useMemo(() => {
    let totalUnits = 0;
    let costVal = 0;
    let retailVal = 0;

    products.forEach((p) => {
      const units = getProductTotalStock(p);
      totalUnits += units;
      costVal += units * (p.costPrice || p.price * 0.45);
      retailVal += units * p.price;
    });

    return {
      totalUnits,
      costVal,
      retailVal,
      unrealizedProfit: retailVal - costVal,
      marginPercent: retailVal > 0 ? Math.round(((retailVal - costVal) / retailVal) * 100) : 0,
    };
  }, [products]);

  // Export current active report
  const handleExport = () => {
    if (reportType === "sales") {
      const data = orders.map((o) => ({
        Order_ID: o.id,
        Date: new Date(o.placedAt).toLocaleDateString(),
        Customer: o.customerName,
        Gross_Amount: o.subtotal,
        Discount: o.discount,
        Shipping: o.shippingFee,
        Net_Total: o.total,
        Status: o.orderStatus,
      }));
      exportToCsv(data, "Miracle_Sales_Report");
    } else if (reportType === "valuation") {
      const data = products.flatMap((p) =>
        p.variants.map((v) => ({
          SKU: v.sku,
          Product: p.name,
          Category: p.categoryId,
          Color: v.color,
          Size: v.size,
          Units_In_Stock: v.stock,
          Cost_Per_Unit: p.costPrice || 0,
          Retail_Price: p.price,
          Total_Cost_Valuation: v.stock * (p.costPrice || 0),
          Total_Retail_Valuation: v.stock * p.price,
        }))
      );
      exportToCsv(data, "Miracle_Stock_Valuation_Report");
    } else if (reportType === "payments") {
      const data = payments.map((p) => ({
        Payment_ID: p.id,
        Order_ID: p.orderId,
        Customer: p.customerName,
        UTR_Number: p.utrNumber,
        Amount: p.amount,
        Status: p.status,
        Is_Duplicate: p.isDuplicateUtr ? "YES" : "NO",
        Submitted: p.submittedAt,
        Verified_By: p.verifiedBy || "N/A",
      }));
      exportToCsv(data, "Miracle_Payments_Reconciliation_Report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                Reports & Financial Analytics
              </h1>
              <p className="text-xs text-neutral-500">
                Revenue audits, category performance, inventory valuation, and payment reconciliation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-100 transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 pb-3">
        {[
          { id: "sales", label: "Sales & Revenue Audit", icon: TrendingUp },
          { id: "categories", label: "Category Performance", icon: Layers },
          { id: "valuation", label: "Stock Valuation & Margin", icon: Warehouse },
          { id: "payments", label: "Payment Settlement & UTR", icon: CreditCard },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as ReportType)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              reportType === t.id
                ? "bg-black text-white shadow-sm"
                : "border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:border-neutral-300"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Report 1: Sales & Revenue Audit */}
      {reportType === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Gross Merchandise Value</p>
              <p className="text-xl font-bold text-black mt-1 font-mono">{formatPrice(grossSales)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Discounts Given</p>
              <p className="text-xl font-bold text-rose-600 mt-1 font-mono">
                -{formatPrice(totalDiscounts)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Delivery Fee Collected</p>
              <p className="text-xl font-bold text-black mt-1 font-mono">{formatPrice(totalShipping)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Net Realized Revenue</p>
              <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {formatPrice(netRevenue)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-neutral-50 p-4 border-b border-neutral-200 text-xs font-semibold text-neutral-700">
              Order Transactions Ledger
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-200 text-neutral-500 uppercase text-[11px] font-semibold bg-neutral-50/50">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right">Gross Amount</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">Net Total</th>
                    <th className="p-3">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50 transition">
                      <td className="p-3 font-mono font-bold text-black">#{o.id}</td>
                      <td className="p-3 text-neutral-500">
                        {new Date(o.placedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-black font-medium">{o.customerName}</td>
                      <td className="p-3 text-right font-mono text-neutral-700">
                        {formatPrice(o.subtotal)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600">
                        {o.discount > 0 ? `-${formatPrice(o.discount)}` : "—"}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-black">
                        {formatPrice(o.total)}
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-700 font-semibold">{o.paymentStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Stock Valuation & Margins */}
      {reportType === "valuation" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Total Physical Units</p>
              <p className="text-xl font-bold text-black mt-1 font-mono">
                {stockValuation.totalUnits} items
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Inventory Cost Valuation</p>
              <p className="text-xl font-bold text-black mt-1 font-mono">
                {formatPrice(stockValuation.costVal)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Retail Selling Valuation</p>
              <p className="text-xl font-bold text-black mt-1 font-mono">
                {formatPrice(stockValuation.retailVal)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-neutral-500 font-medium">Unrealized Gross Margin</p>
              <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {stockValuation.marginPercent}% ({formatPrice(stockValuation.unrealizedProfit)})
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Units</th>
                    <th className="p-3 text-right">Cost / Unit</th>
                    <th className="p-3 text-right">Retail / Unit</th>
                    <th className="p-3 text-right">Total Cost</th>
                    <th className="p-3 text-right">Total Retail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {products.map((p) => {
                    const units = getProductTotalStock(p);
                    const cost = p.costPrice || p.price * 0.45;
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50 transition">
                        <td className="p-3 font-semibold text-black">{p.name}</td>
                        <td className="p-3 text-neutral-600 capitalize">{p.categoryId}</td>
                        <td className="p-3 text-right font-mono text-neutral-700">{units}</td>
                        <td className="p-3 text-right font-mono text-neutral-500">{formatPrice(cost)}</td>
                        <td className="p-3 text-right font-mono text-neutral-700">{formatPrice(p.price)}</td>
                        <td className="p-3 text-right font-mono text-black font-semibold">
                          {formatPrice(units * cost)}
                        </td>
                        <td className="p-3 text-right font-mono text-black font-bold">
                          {formatPrice(units * p.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Category Performance */}
      {reportType === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-black text-sm">Revenue Share by Category</h3>
            <div className="space-y-3">
              {[
                { name: "Women Ethnic & Kurtas", share: 44, revenue: "₹62,400", orders: 38 },
                { name: "Men Linen & Shirts", share: 28, revenue: "₹39,800", orders: 26 },
                { name: "Artisanal Footwear & Mojris", share: 16, revenue: "₹22,700", orders: 15 },
                { name: "Kids Festive & Playwear", share: 12, revenue: "₹17,000", orders: 12 },
              ].map((c) => (
                <div key={c.name} className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-black">{c.name}</p>
                    <p className="text-[11px] text-neutral-500">{c.orders} customer orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-black">{c.revenue}</p>
                    <span className="text-[10px] text-neutral-500">{c.share}% of GMV</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3 flex flex-col justify-center shadow-sm">
            <h3 className="font-bold text-black text-sm">Merchandising Insight</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Women&apos;s Ethnic Wear represents 44% of total order revenue during the current festive quarter, driven heavily by Royal Anarkali sets.
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Leather Mojris have shown the highest attach rate (22% of orders with kurta sets also add footwear).
            </p>
          </div>
        </div>
      )}

      {/* Report 4: Payments & Settlements */}
      {reportType === "payments" && (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-neutral-50 p-4 border-b border-neutral-200 text-xs font-semibold text-neutral-700">
            UPI Merchant Settlements & UTR Reconciliation Log
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 text-neutral-500 uppercase text-[11px] font-semibold bg-neutral-50/50">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">UTR Reference</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition">
                    <td className="p-3 font-mono font-bold text-black">#{p.orderId}</td>
                    <td className="p-3 text-neutral-700">{p.customerName}</td>
                    <td className="p-3 font-mono text-black font-semibold">{p.utrNumber}</td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="p-3">
                      <span className="capitalize text-neutral-700 font-medium">{p.status.replace("_", " ")}</span>
                    </td>
                    <td className="p-3 text-neutral-500">{p.verifiedBy || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
