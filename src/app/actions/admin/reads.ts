"use server";

import type { AdminActionResult } from "@/lib/adminActionResult";
import { requireAdmin } from "@/lib/supabase/require-admin";
import {
  getAllOrders,
  getPayments,
  getPaymentVerifications,
  getCustomers,
  getCoupons,
  getStaff,
  getAuditLogs,
  getStockLedger,
  getSettings,
  getBanners,
  getAnnouncements,
  getYoutubeVideos,
  getFilters,
} from "@/lib/supabase/admin";
import type {
  AdminOrder,
  AdminPayment,
  AdminPaymentVerification,
  AdminCustomer,
  AdminCoupon,
  AdminBanner,
  AdminSettings,
  AnnouncementBarItem,
  YouTubeVideoItem,
  StaffMember,
  AuditLogEntry,
  CategoryFilter,
  StockLedgerEntry,
} from "@/lib/adminTypes";

/**
 * Admin read operations.
 *
 * These read data that RLS deliberately restricts (all customers' orders,
 * payments, audit logs, stock ledger, staff, ...), so they run in the
 * server-only service-role layer behind an independent admin authorization
 * check rather than in the browser.
 */

export async function adminGetOrders(): Promise<AdminActionResult<AdminOrder[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getAllOrders() };
}

export async function adminGetPayments(): Promise<AdminActionResult<AdminPayment[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getPayments() };
}

/** Checkout payment verifications (pre-order UTR submissions), admin only. */
export async function adminGetPaymentVerifications(): Promise<
  AdminActionResult<AdminPaymentVerification[]>
> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getPaymentVerifications() };
}

export async function adminGetCustomers(): Promise<AdminActionResult<AdminCustomer[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getCustomers() };
}

export async function adminGetCoupons(): Promise<AdminActionResult<AdminCoupon[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getCoupons() };
}

export async function adminGetBanners(): Promise<AdminActionResult<AdminBanner[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getBanners() };
}

export async function adminGetAnnouncements(): Promise<AdminActionResult<AnnouncementBarItem[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getAnnouncements() };
}

export async function adminGetYoutubeVideos(): Promise<AdminActionResult<YouTubeVideoItem[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getYoutubeVideos() };
}

export async function adminGetSettings(): Promise<AdminActionResult<AdminSettings | null>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getSettings() };
}

export async function adminGetStaff(): Promise<AdminActionResult<StaffMember[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getStaff() };
}

export async function adminGetAuditLogs(): Promise<AdminActionResult<AuditLogEntry[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getAuditLogs() };
}

export async function adminGetStockLedger(): Promise<AdminActionResult<StockLedgerEntry[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getStockLedger() };
}

export async function adminGetFilters(): Promise<AdminActionResult<CategoryFilter[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;
  return { success: true, data: await getFilters() };
}

// NOTE: there is no `adminGetSubcategories` action. Subcategory options are
// derived client/server-side from the `categories` table via
// `buildSubcategoryOptions()` in `@/lib/catalogTaxonomy` — never from a
// `subcategories` database table.
