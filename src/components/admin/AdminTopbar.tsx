"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  Layers,
  LogOut,
  Menu,
  Moon,
  PackagePlus,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useStore } from "@/context/StoreContext";
import { handleAvatarError } from "@/lib/utils";

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenQuickProduct?: () => void;
  onOpenQuickStock?: () => void;
}

export function AdminTopbar({
  onOpenMobileSidebar,
}: AdminTopbarProps) {
  const {
    staff,
    currentStaff,
    setCurrentStaff,
    pendingPaymentCount,
    newOrderCount,
    lowStockCount,
    resetToSampleData,
    adminToast,
    settings,
  } = useAdmin();

  const { theme, toggleTheme, logout, hydrated } = useStore();
  const router = useRouter();

  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white/95 px-3 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Festive Theme Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-800">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span className="capitalize">{settings.activeFestiveTheme} Theme</span>
        </div>

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {quickMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setQuickMenuOpen(false)}
              />
              <div className="absolute right-0 z-40 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl text-xs animate-fade-in">
                <Link
                  href="/admin/products"
                  onClick={() => setQuickMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black font-medium"
                >
                  <PackagePlus className="h-4 w-4 text-neutral-500" />
                  <span>Create New Product</span>
                </Link>
                <Link
                  href="/admin/payments"
                  onClick={() => setQuickMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black font-medium"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Verify UTR Payments</span>
                </Link>
                <Link
                  href="/admin/inventory"
                  onClick={() => setQuickMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black font-medium"
                >
                  <Layers className="h-4 w-4 text-neutral-500" />
                  <span>Adjust Stock / Ledger</span>
                </Link>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    if (confirm("Reset admin state to default seed data from PRD?")) {
                      resetToSampleData();
                    }
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-neutral-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset to PRD Seed Data</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Switcher Button matching Customer Website */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          suppressHydrationWarning
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors"
          title={hydrated && theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {hydrated && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {(pendingPaymentCount > 0 || newOrderCount > 0 || lowStockCount > 0) && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                {pendingPaymentCount + newOrderCount + (lowStockCount > 0 ? 1 : 0)}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-3 shadow-2xl text-xs animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="font-bold text-black">Alerts & Notifications</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Live</span>
                </div>
                <div className="py-2 space-y-2">
                  {newOrderCount > 0 && (
                    <Link
                      href="/admin/orders"
                      onClick={() => setNotifOpen(false)}
                      className="block p-2.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100/60 transition"
                    >
                      <p className="font-semibold text-blue-800">
                        {newOrderCount} New Order{newOrderCount > 1 ? "s" : ""} awaiting acceptance
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Confirm to deduct stock and start fulfillment.
                      </p>
                    </Link>
                  )}

                  {pendingPaymentCount > 0 ? (
                    <Link
                      href="/admin/payments"
                      onClick={() => setNotifOpen(false)}
                      className="block p-2.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100/60 transition"
                    >
                      <p className="font-semibold text-amber-800">
                        {pendingPaymentCount} Payment{pendingPaymentCount > 1 ? "s" : ""} need attention
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Checkout submissions awaiting approval, customer UTRs, or bank
                        verification.
                      </p>
                    </Link>
                  ) : (
                    <p className="text-neutral-500 text-center py-2">No pending payments</p>
                  )}

                  {lowStockCount > 0 && (
                    <Link
                      href="/admin/inventory"
                      onClick={() => setNotifOpen(false)}
                      className="block p-2.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100/60 transition"
                    >
                      <p className="font-semibold text-rose-800">
                        {lowStockCount} Low Stock Alert{lowStockCount > 1 ? "s" : ""}
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Variants with ≤ 5 units in stock.
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Staff Role Switcher & Admin Profile */}
        <div className="relative">
          <button
            onClick={() => setStaffMenuOpen(!staffMenuOpen)}
            className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-black hover:bg-neutral-100 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentStaff.avatar}
              alt={currentStaff.name}
              onError={handleAvatarError}
              className="h-6 w-6 rounded-full object-cover border border-neutral-200"
            />
            <div className="text-left hidden sm:block">
              <p className="font-semibold text-black text-[11px] leading-tight">{currentStaff.name}</p>
              <p className="text-[10px] text-neutral-500 leading-tight">{currentStaff.role}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-neutral-400" />
          </button>

          {staffMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setStaffMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-2 shadow-2xl text-xs animate-fade-in">
                {/* Active Admin Profile info */}
                <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                  <p className="font-bold text-black">{currentStaff.name}</p>
                  <p className="text-[11px] text-neutral-500">{currentStaff.role} · {currentStaff.email}</p>
                </div>

                <div className="px-3 py-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Switch Active Staff
                  </p>
                </div>
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentStaff(s);
                      setStaffMenuOpen(false);
                      adminToast(`Switched user to ${s.name} (${s.role})`, "info");
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.avatar}
                        alt={s.name}
                        onError={handleAvatarError}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-black">{s.name}</p>
                        <p className="text-[10px] text-neutral-500">{s.role}</p>
                      </div>
                    </div>
                    {currentStaff.id === s.id && <Check className="h-4 w-4 text-black font-bold" />}
                  </button>
                ))}

                <div className="my-1 border-t border-neutral-100" />
                <Link
                  href="/admin/settings"
                  onClick={() => setStaffMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-md font-medium"
                >
                  <SettingsIcon size={14} /> Store Settings
                </Link>
                <Link
                  href="/admin/staff"
                  onClick={() => setStaffMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-md font-medium"
                >
                  <ShieldCheck size={14} /> Staff & Permissions
                </Link>
                <button
                  onClick={async () => {
                    setStaffMenuOpen(false);
                    // Clear the Supabase session, then leave the admin area so
                    // the server gate cannot be bypassed by a client-side logout.
                    await logout();
                    router.replace("/");
                    router.refresh();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-md font-medium"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
