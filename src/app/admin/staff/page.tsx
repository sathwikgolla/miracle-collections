"use client";

import { useState } from "react";
import { Check, Plus, Shield, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import type { StaffMember, StaffRole } from "@/lib/adminTypes";
import { handleAvatarError } from "@/lib/utils";

const ROLES: StaffRole[] = [
  "Super Admin",
  "Store Manager",
  "Fulfillment Specialist",
  "Inventory Manager",
  "Verification Officer",
];

const PERMISSION_MATRIX = [
  { module: "Dashboard & KPIs", admin: true, manager: true, fulfillment: true, inventory: true, finance: true },
  { module: "Orders Lifecycle", admin: true, manager: true, fulfillment: true, inventory: false, finance: false },
  { module: "Print Tax Invoices", admin: true, manager: true, fulfillment: true, inventory: false, finance: true },
  { module: "Verify/Reject UTR Payments", admin: true, manager: false, fulfillment: false, inventory: false, finance: true },
  { module: "Products Catalog Editor", admin: true, manager: true, fulfillment: false, inventory: true, finance: false },
  { module: "Inventory Stock Ledger Adjustments", admin: true, manager: false, fulfillment: false, inventory: true, finance: false },
  { module: "Content & Festive Theming", admin: true, manager: true, fulfillment: false, inventory: false, finance: false },
  { module: "Coupons & Promotions", admin: true, manager: true, fulfillment: false, inventory: false, finance: false },
  { module: "Financial Reports & Valuation", admin: true, manager: true, fulfillment: false, inventory: false, finance: true },
  { module: "Store Settings & Merchant UPI", admin: true, manager: false, fulfillment: false, inventory: false, finance: false },
];

export default function AdminStaffPage() {
  const { staff, currentStaff, setCurrentStaff, addStaff, deleteStaff } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("Store Manager");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addStaff({
      name: name.trim(),
      email: email.trim(),
      role,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      status: "active",
      lastActive: new Date().toISOString(),
    });

    setName("");
    setEmail("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                Staff Team & Roles
              </h1>
              <p className="text-xs text-neutral-500">
                Staff member accounts, active sessions, and role-based permissions matrix
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Directory Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-black uppercase tracking-wider">
          Active Team Members ({staff.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staff.map((s) => {
            const isCurrentUser = currentStaff.id === s.id;

            return (
              <div
                key={s.id}
                className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between transition ${
                  isCurrentUser
                    ? "border-black bg-neutral-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={s.avatar}
                      alt={s.name}
                      onError={handleAvatarError}
                      className="h-10 w-10 rounded-full object-cover border border-neutral-200"
                    />
                    <div>
                      <h3 className="font-bold text-black text-sm">{s.name}</h3>
                      <span className="text-[10px] text-neutral-500 font-semibold">{s.role}</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 mt-3 truncate">{s.email}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Last active: {s.lastActive}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                  {isCurrentUser ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                      <Check className="h-3.5 w-3.5" /> Active Session
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentStaff(s)}
                      className="text-black hover:underline font-semibold"
                    >
                      Switch to this user
                    </button>
                  )}

                  {staff.length > 1 && !isCurrentUser && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove staff member ${s.name}?`)) deleteStaff(s.id);
                      }}
                      className="text-neutral-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm space-y-4 p-6">
        <div>
          <h2 className="text-sm font-bold text-black uppercase tracking-wider">
            Role-Based Access Control Matrix (RBAC)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Module permission scopes defined according to administration policies
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-3">Module Feature</th>
                <th className="p-3 text-center">Super Admin</th>
                <th className="p-3 text-center">Store Manager</th>
                <th className="p-3 text-center">Fulfillment</th>
                <th className="p-3 text-center">Inventory Mgr</th>
                <th className="p-3 text-center">Verification Off.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {PERMISSION_MATRIX.map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50 transition">
                  <td className="p-3 font-medium text-black">{row.module}</td>
                  <td className="p-3 text-center">
                    <span className="text-emerald-700 font-bold">✓ Full</span>
                  </td>
                  <td className="p-3 text-center">
                    {row.manager ? (
                      <span className="text-emerald-700 font-bold">✓ Full</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.fulfillment ? (
                      <span className="text-black font-semibold">✓ View/Ship</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.inventory ? (
                      <span className="text-amber-700 font-semibold">✓ Edit Stock</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.finance ? (
                      <span className="text-emerald-700 font-bold">✓ Verify</span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-black">Add Staff Team Member</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meera Raman"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Work Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="meera@miraclecollections.in"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Assign Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black font-semibold focus:border-black focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
