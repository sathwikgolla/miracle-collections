"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Filter, History, Search } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import type { AuditLogEntry } from "@/lib/adminTypes";

export default function AdminAuditPage() {
  const { auditLogs, exportToCsv } = useAdmin();
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchModule = selectedModule === "all" || l.module === selectedModule;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        l.description.toLowerCase().includes(q) ||
        l.staffName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q);
      return matchModule && matchSearch;
    });
  }, [auditLogs, selectedModule, search]);

  const handleExportCsv = () => {
    const data = filteredLogs.map((l) => ({
      Timestamp: new Date(l.timestamp).toLocaleString(),
      Staff_Member: l.staffName,
      Role: l.role,
      Module: l.module,
      Action: l.action,
      Description: l.description,
      IP_Address: l.ipAddress,
    }));
    exportToCsv(data, "Miracle_Admin_Audit_Log");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                Administrative Audit Trail
              </h1>
              <p className="text-xs text-neutral-500">
                Immutable activity records for all administrative, inventory, and payment operations
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-100 transition shadow-sm"
        >
          <Download className="h-4 w-4 text-emerald-600" />
          <span>Export Audit Log CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black font-semibold focus:border-black focus:outline-none"
          >
            <option value="all">All Modules ({auditLogs.length})</option>
            <option value="Payments">Payments & UTR</option>
            <option value="Orders">Orders</option>
            <option value="Products">Products</option>
            <option value="Inventory">Inventory</option>
            <option value="Content">Content & Themes</option>
            <option value="Coupons">Coupons</option>
            <option value="Settings">Settings</option>
            <option value="Staff">Staff</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, staff member, details..."
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 pl-9 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Staff Member & Role</th>
                <th className="p-4">Module</th>
                <th className="p-4">Action</th>
                <th className="p-4">Event Description / Diff</th>
                <th className="p-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition">
                    <td className="p-4 font-mono text-neutral-500 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="p-4 text-neutral-700">
                      <p className="font-semibold text-black">{log.staffName}</p>
                      <p className="text-[10px] text-neutral-500">{log.role}</p>
                    </td>

                    <td className="p-4">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-700 font-semibold">
                        {log.module}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          log.action === "Create"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : log.action === "Delete" || log.action === "Reject"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : log.action === "Verify"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 text-neutral-700 max-w-md">{log.description}</td>

                    <td className="p-4 text-right font-mono text-neutral-400 text-[11px]">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
