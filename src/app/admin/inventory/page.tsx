"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  History,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Warehouse,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { StockAdjustModal } from "@/components/admin/StockAdjustModal";
import { BulkStockModal } from "@/components/admin/BulkStockModal";
import { getInventoryRows, LOW_STOCK_THRESHOLD } from "@/lib/inventory";

type InventoryTab = "matrix" | "ledger" | "alerts";

export default function AdminInventoryPage() {
  const { products, stockLedger, exportToCsv } = useAdmin();
  const [tab, setTab] = useState<InventoryTab>("matrix");
  const [search, setSearch] = useState("");
  const [adjustingItem, setAdjustingItem] = useState<{ productId: string; sku: string } | null>(
    null
  );
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // ONE shared inventory model: a product sold in variants expands to one row
  // per variant; a variant-less product becomes a single product-level row.
  // This is why the Inventory page and the dashboard low-stock KPI now agree.
  const allVariants = useMemo(() => getInventoryRows(products), [products]);

  const filteredVariants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allVariants.filter(
      (v) =>
        !q ||
        v.productName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q)
    );
  }, [allVariants, search]);

  const lowStockVariants = useMemo(() => {
    return allVariants.filter((v) => v.stock <= LOW_STOCK_THRESHOLD);
  }, [allVariants]);

  const handleExportLedger = () => {
    const data = stockLedger.map((l) => ({
      ID: l.id,
      Date: new Date(l.timestamp).toLocaleString(),
      Product: l.productName,
      SKU: l.variantSku,
      Variant: l.variantLabel,
      Type: l.type,
      Units_Changed: l.change,
      Previous_Stock: l.previousStock,
      New_Stock: l.newStock,
      Reason: l.reason,
      Staff_Member: l.staffName,
      Reference: l.referenceId || "N/A",
    }));
    exportToCsv(data, "Miracle_Stock_Ledger");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-sm">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                Inventory & Stock Ledger
              </h1>
              <p className="text-xs text-neutral-500">
                Variant-level stock tracking, real-time audit ledger, and CSV operations
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-100 transition shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Bulk CSV Import / Export</span>
          </button>
          <button
            onClick={() => setAdjustingItem({ productId: products[0]?.id || "", sku: "" })}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTab("matrix")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "matrix"
                ? "bg-black text-white shadow-sm"
                : "border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:border-neutral-300"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Stock Matrix ({allVariants.length} SKUs)</span>
          </button>
          <button
            onClick={() => setTab("ledger")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "ledger"
                ? "bg-black text-white shadow-sm"
                : "border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:border-neutral-300"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit Ledger ({stockLedger.length} Records)</span>
          </button>
          <button
            onClick={() => setTab("alerts")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "alerts"
                ? "bg-black text-white shadow-sm"
                : "border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:border-neutral-300"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Low Stock Alerts ({lowStockVariants.length})</span>
          </button>
        </div>

        {tab === "matrix" && (
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by SKU, product, size, color..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 pl-9 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none"
            />
          </div>
        )}

        {tab === "ledger" && (
          <button
            onClick={handleExportLedger}
            className="flex items-center gap-1.5 text-xs font-semibold text-black hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Ledger CSV</span>
          </button>
        )}
      </div>

      {/* Tab 1: Variant Stock Matrix */}
      {tab === "matrix" && (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="p-4">Variant SKU</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Size & Color</th>
                  <th className="p-4 text-right">Physical Stock</th>
                  <th className="p-4 text-right">Soft-Reserved</th>
                  <th className="p-4 text-right">Available to Buy</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      No matching variants found.
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map((v) => (
                    <tr key={`${v.productId}-${v.sku}`} className="hover:bg-neutral-50 transition">
                      <td className="p-4 font-mono font-semibold text-black">{v.sku}</td>
                      <td className="p-4 font-medium text-black max-w-[220px] truncate">
                        {v.productName}
                      </td>
                      <td className="p-4 text-neutral-600">
                        {v.color} / <span className="font-semibold text-black">{v.size}</span>
                      </td>
                      <td className="p-4 text-right font-mono text-sm font-semibold text-black">
                        {v.stock}
                      </td>
                      <td className="p-4 text-right font-mono text-neutral-500">
                        {v.reservedStock > 0 ? (
                          <span className="text-amber-600 font-semibold">{v.reservedStock}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="p-4 text-right font-mono text-sm">
                        <span
                          className={`font-bold ${
                            v.availableStock <= 3
                              ? "text-rose-600"
                              : v.availableStock <= 5
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {v.availableStock}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() =>
                            setAdjustingItem({ productId: v.productId, sku: v.sku })
                          }
                          className="rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 px-3 py-1 font-semibold text-black transition shadow-sm"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Ledger */}
      {tab === "ledger" && (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Product & SKU</th>
                  <th className="p-4">Change Type</th>
                  <th className="p-4 text-center">Movement</th>
                  <th className="p-4 text-right">Stock (Prev → New)</th>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Audit Reason & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {stockLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      No stock ledger entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  stockLedger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-neutral-50 transition">
                      <td className="p-4 font-mono text-neutral-500 text-[11px]">
                        {new Date(entry.timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-black">{entry.productName}</p>
                        <p className="text-[11px] font-mono text-neutral-500">
                          {entry.variantSku} ({entry.variantLabel})
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-700 font-semibold uppercase">
                          {entry.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-sm">
                        <span
                          className={
                            entry.change > 0
                              ? "text-emerald-600"
                              : entry.change < 0
                              ? "text-rose-600"
                              : "text-neutral-500"
                          }
                        >
                          {entry.change > 0 ? `+${entry.change}` : entry.change}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-neutral-600">
                        {entry.previousStock} →{" "}
                        <span className="font-bold text-black">{entry.newStock}</span>
                      </td>
                      <td className="p-4 text-neutral-700 font-medium">{entry.staffName}</td>
                      <td className="p-4 text-neutral-500 max-w-xs">{entry.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Low Stock Alerts */}
      {tab === "alerts" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs">
            <p className="font-bold">
              Low Stock Replenishment Threshold (≤ 5 units remaining)
            </p>
            <p className="text-neutral-600 mt-1">
              These items are at immediate risk of overselling or displaying &quot;Sold out&quot; on the customer storefront.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockVariants.length === 0 ? (
              <div className="col-span-full rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
                All variants are safely above the low-stock threshold.
              </div>
            ) : (                lowStockVariants.map((v) => (
                <div
                  key={`${v.productId}-${v.sku}`}
                  className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {v.sku}
                      </span>
                      <h3 className="font-bold text-black text-sm mt-2">{v.productName}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {v.color} • Size: <strong className="text-black">{v.size}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-rose-600 font-mono">{v.stock}</span>
                      <p className="text-[10px] text-neutral-400">units left</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex justify-end">
                    <button
                      onClick={() =>
                        setAdjustingItem({ productId: v.productId, sku: v.sku })
                      }
                      className="rounded-lg bg-black hover:bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                    >
                      Restock Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustingItem && (
        <StockAdjustModal
          initialProductId={adjustingItem.productId}
          initialSku={adjustingItem.sku}
          onClose={() => setAdjustingItem(null)}
        />
      )}

      {/* Bulk CSV Modal */}
      {bulkModalOpen && <BulkStockModal onClose={() => setBulkModalOpen(false)} />}
    </div>
  );
}
