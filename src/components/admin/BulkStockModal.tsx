"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

interface BulkStockModalProps {
  onClose: () => void;
}

export function BulkStockModal({ onClose }: BulkStockModalProps) {
  const { products, bulkUpdateStock, exportToCsv } = useAdmin();
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<
    { sku: string; currentStock: number; newStock: number; valid: boolean; name: string }[]
  >([]);
  const [parsed, setParsed] = useState(false);

  // Flatten all variants
  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({
      productId: p.id,
      productName: p.name,
      sku: v.sku,
      size: v.size,
      color: v.color,
      currentStock: v.stock,
    }))
  );

  const handleDownloadTemplate = () => {
    const data = allVariants.map((v) => ({
      SKU: v.sku,
      Product_Name: v.productName,
      Size: v.size,
      Color: v.color,
      Current_Stock: v.currentStock,
      New_Stock: v.currentStock,
    }));
    exportToCsv(data, "Miracle_Inventory_Template");
  };

  const handleParseCsv = (content: string) => {
    setCsvText(content);
    const lines = content.trim().split("\n");
    if (lines.length <= 1) return;

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const skuIdx = headers.findIndex((h) => h.includes("sku"));
    const stockIdx = headers.findIndex(
      (h) => h.includes("new_stock") || h.includes("stock") || h.includes("quantity")
    );

    if (skuIdx === -1 || stockIdx === -1) {
      alert("CSV must contain 'SKU' and 'New_Stock' (or 'Stock') columns");
      return;
    }

    const rows: {
      sku: string;
      currentStock: number;
      newStock: number;
      valid: boolean;
      name: string;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(",").map((c) => c.replace(/['"]+/g, "").trim());
      const sku = cols[skuIdx];
      const stock = parseInt(cols[stockIdx], 10);

      const match = allVariants.find(
        (v) => v.sku.toLowerCase() === (sku || "").toLowerCase()
      );

      rows.push({
        sku: sku || "UNKNOWN",
        currentStock: match ? match.currentStock : 0,
        newStock: isNaN(stock) ? 0 : stock,
        valid: Boolean(match) && !isNaN(stock) && stock >= 0,
        name: match ? match.productName : "Unknown SKU (Not in catalog)",
      });
    }

    setParsedRows(rows);
    setParsed(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleApplyChanges = () => {
    const validRows = parsedRows
      .filter((r) => r.valid)
      .map((r) => ({ sku: r.sku, stock: r.newStock }));

    if (validRows.length === 0) {
      alert("No valid rows to update.");
      return;
    }

    bulkUpdateStock(validRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-black">Bulk Stock CSV Import & Export</h2>
              <p className="text-xs text-neutral-500">Live Inventory Bulk Adjustment & Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Step 1: Download current stock CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div>
              <p className="font-bold text-black">Step 1: Download Current Inventory CSV</p>
              <p className="text-neutral-500 text-[11px] mt-0.5">
                Pre-filled with all {allVariants.length} active variant SKUs and current counts.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 py-2 font-semibold text-black hover:bg-neutral-100 transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 text-black" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Step 2: Upload modified CSV */}
          <div className="space-y-2">
            <p className="font-bold text-black">Step 2: Upload Updated CSV File</p>
            <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center hover:border-black transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
              <p className="font-semibold text-black">Drag & drop your CSV file here, or click to browse</p>
              <p className="text-[11px] text-neutral-500 mt-1">Accepts standard .csv format with SKU and Stock columns</p>
            </div>
          </div>

          {/* Step 3: Preview Parsed Results */}
          {parsed && (
            <div className="space-y-2 animate-slide-up">
              <div className="flex items-center justify-between">
                <p className="font-bold text-black">
                  Preview Import Diff ({parsedRows.length} rows detected)
                </p>
                <div className="text-[11px]">
                  <span className="text-emerald-700 font-bold">
                    {parsedRows.filter((r) => r.valid).length} Valid
                  </span>{" "}
                  •{" "}
                  <span className="text-rose-700 font-bold">
                    {parsedRows.filter((r) => !r.valid).length} Invalid
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 overflow-hidden max-h-48 overflow-y-auto bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50 text-neutral-600 text-[10px] font-bold uppercase sticky top-0 border-b border-neutral-200">
                    <tr>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5 text-right">Current</th>
                      <th className="p-2.5 text-right">New Stock</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.valid ? "hover:bg-neutral-50/50" : "bg-rose-50"}>
                        <td className="p-2.5 text-black font-bold">{r.sku}</td>
                        <td className="p-2.5 text-neutral-700 font-sans truncate max-w-[180px]">
                          {r.name}
                        </td>
                        <td className="p-2.5 text-right text-neutral-500">{r.currentStock}</td>
                        <td className="p-2.5 text-right text-black font-bold">{r.newStock}</td>
                        <td className="p-2.5 text-center font-sans">
                          {r.valid ? (
                            <span className="text-emerald-700 font-bold text-[10px]">
                              ✓ Ready
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold text-[10px]">
                              ✗ Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!parsed || parsedRows.filter((r) => r.valid).length === 0}
            onClick={handleApplyChanges}
            className="rounded-md bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            Batch Apply Inventory Changes
          </button>
        </div>
      </div>
    </div>
  );
}
