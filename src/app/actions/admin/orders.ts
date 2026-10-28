"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_MESSAGES, type AdminActionResult } from "@/lib/adminActionResult";
import { requireAdmin } from "@/lib/supabase/require-admin";
import {
  adminSupabase,
  getOrderById,
  getPaymentVerificationById,
} from "@/lib/supabase/admin";
import { normalizeOrderStatus } from "@/lib/orderStatus";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { AdminOrder, AdminPaymentVerification } from "@/lib/adminTypes";
import type { Product } from "@/lib/types";
import { transformProduct } from "@/lib/supabase/productMapper";

/**
 * Server actions for order management (admin only).
 *
 * Customers can never reach these: they require a server-verified admin
 * session. The acting staff member's name is resolved FROM THE SERVER (the
 * caller's own profile) — never from a client-supplied value — so admin
 * actions work even when the client has no `staff` roster loaded.
 */

/** Resolve the acting admin's display name from their own profile. */
async function actingStaffName(userId: string): Promise<string> {
  const { data } = await adminSupabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();
  return data?.name || "Admin";
}

function revalidateOrderViews() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/orders");
}

/**
 * Forward-only fulfillment state machine. Confirming is deliberately NOT a
 * valid target here — that transition (which deducts stock) must go through
 * `adminConfirmOrder`. Delivered/Cancelled have no forward transitions, so
 * invalid moves like Placed -> Delivered or Delivered -> Confirmed are rejected.
 */
const ORDER_TRANSITIONS: Record<string, string[]> = {
  Placed: ["Cancelled"],
  Confirmed: ["Shipped"],
  Shipped: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
  Returned: [],
};

/**
 * ACCEPT / CONFIRM an order — the one operation that deducts stock.
 *
 * Delegates to the atomic `confirm_order` Postgres function (single
 * transaction, admin-checked, idempotent): it verifies stock for every line,
 * fails the whole confirmation if any line is short, deducts variant-aware
 * stock, writes one stock_ledger entry per line, and moves the order to
 * `Confirmed`. Calling it again is a no-op, so double-clicks / two tabs /
 * retries can never deduct twice.
 */
export async function adminConfirmOrder(
  orderId: string
): Promise<AdminActionResult<{ order: AdminOrder | null; products: Product[]; ledgerEntryCount: number }>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;

  try {
    const staffName = await actingStaffName(guard.userId);

    // The RPC runs as SECURITY DEFINER but checks profiles.role itself, so we
    // call it with the caller's authenticated session (auth.uid() is present).
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("confirm_order", {
      p_order_id: orderId,
      p_staff_name: staffName,
    });

    if (error) {
      console.error("confirm_order failed:", error.message);
      const m = (error.message ?? "").toLowerCase();
      if (m.includes("insufficient_stock")) {
        const productName = error.message.split(":")[1]?.trim();
        return {
          success: false,
          status: 409,
          error: productName
            ? `Insufficient stock for ${productName}.`
            : "Insufficient stock for one or more items.",
        };
      }
      if (m.includes("forbidden")) return { success: false, status: 403, error: ADMIN_MESSAGES.forbidden };
      return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
    }

    const result = (data ?? {}) as {
      success?: boolean;
      already_confirmed?: boolean;
      error?: string;
      order_status?: string;
      ledger?: { product_id: string }[];
    };

    if (result.success === false) {
      if (result.error === "order_not_found") {
        return { success: false, status: 404, error: "Order not found." };
      }
      return { success: false, status: 409, error: "This order can no longer be confirmed." };
    }

    // Gather the affected products so the client can update just those rows.
    const affectedIds = Array.from(
      new Set((result.ledger ?? []).map((l) => l.product_id).filter(Boolean))
    );
    const products: Product[] = [];
    for (const productId of affectedIds) {
      const { data: full } = await adminSupabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("id", productId)
        .single();
      if (full) products.push(transformProduct(full));
    }

    // Audit trail (idempotent confirms are still logged, but note which).
    await adminSupabase.from("audit_logs").insert({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      staff_name: staffName,
      role: "Admin",
      module: "Orders",
      action: "Update",
      description: result.already_confirmed
        ? `Order ${orderId} was already confirmed`
        : `Confirmed order ${orderId}; deducted stock for ${products.length} product(s)`,
      ip_address: "unknown",
    });

    revalidateOrderViews();

    return {
      success: true,
      data: {
        order: await getOrderById(orderId),
        products,
        ledgerEntryCount: (result.ledger ?? []).length,
      },
    };
  } catch (error) {
    console.error("Error confirming order:", error);
    return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
  }
}

/**
 * Move an order forward/backward through the fulfillment lifecycle WITHOUT
 * touching stock. Stock is only ever changed by `adminConfirmOrder` (and by
 * customer cancellation restoring it).
 */
export async function adminUpdateOrderStatus(
  orderId: string,
  status: string,
  _staffName?: string,
  note?: string,
  courierName?: string,
  trackingNumber?: string
): Promise<AdminActionResult<AdminOrder | null>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;

  try {
    // Read the CURRENT status and enforce a valid forward transition.
    const { data: current } = await adminSupabase
      .from("orders")
      .select("order_status")
      .eq("id", orderId)
      .single();

    if (!current) {
      return { success: false, status: 404, error: "Order not found." };
    }

    const currentNorm = normalizeOrderStatus(current.order_status ?? "Placed");

    if (status === "Confirmed") {
      return {
        success: false,
        status: 400,
        error: "Use Accept / Confirm Order — that is what deducts stock.",
      };
    }

    const allowed = ORDER_TRANSITIONS[currentNorm] ?? [];
    if (!allowed.includes(status)) {
      return {
        success: false,
        status: 409,
        error: `Cannot move an order from ${currentNorm} to ${status}.`,
      };
    }

    const staffName = await actingStaffName(guard.userId);
    const now = new Date().toISOString();

    const patch: Record<string, unknown> = { order_status: status, updated_at: now };
    if (courierName) patch.courier_name = courierName;
    if (trackingNumber) patch.tracking_number = trackingNumber;

    const { error } = await adminSupabase.from("orders").update(patch).eq("id", orderId);
    if (error) throw error;

    await adminSupabase.from("order_timeline").insert({
      order_id: orderId,
      status,
      timestamp: now,
      note: note || `Status updated to ${status}`,
      staff_name: staffName,
    });

    await adminSupabase.from("audit_logs").insert({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: now,
      staff_name: staffName,
      role: "Admin",
      module: "Orders",
      action: "Update",
      description: `Updated order ${orderId} status to ${status}`,
      ip_address: "unknown",
    });

    revalidateOrderViews();
    return { success: true, data: await getOrderById(orderId) };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
  }
}

/** The payment lifecycle is independent of the order lifecycle. */
export async function adminVerifyPayment(
  paymentId: string
): Promise<AdminActionResult<AdminOrder | null>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;

  try {
    const staffName = await actingStaffName(guard.userId);
    const now = new Date().toISOString();

    // Atomic guard: only a submitted payment may be verified — never an order
    // still awaiting the customer's UTR reference. The conditional update also
    // makes concurrent verifies safe (at most one row transitions).
    const { data: payment, error } = await adminSupabase
      .from("payments")
      .update({ status: "verified", verified_at: now, verified_by: staffName })
      .eq("id", paymentId)
      .eq("status", "pending_verification")
      .select("order_id")
      .maybeSingle();
    if (error) throw error;
    if (!payment) {
      return { success: false, status: 409, error: "This payment is not awaiting verification." };
    }

    if (payment?.order_id) {
      // Only payment_status changes — the order's fulfillment status is a
      // separate axis and must not be rewritten by a payment decision.
      await adminSupabase
        .from("orders")
        .update({ payment_status: "Verified", updated_at: now })
        .eq("id", payment.order_id);

      await adminSupabase.from("order_timeline").insert({
        order_id: payment.order_id,
        status: "Payment Verified",
        timestamp: now,
        note: `Payment verified by ${staffName}`,
        staff_name: staffName,
      });
    }

    await adminSupabase.from("audit_logs").insert({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: now,
      staff_name: staffName,
      role: "Admin",
      module: "Payments",
      action: "Verify",
      description: `Verified payment ${paymentId}`,
      ip_address: "unknown",
    });

    revalidateOrderViews();
    revalidatePath("/admin/payments");
    return { success: true, data: payment?.order_id ? await getOrderById(payment.order_id) : null };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
  }
}

/** Shared error mapping for the payment-verification RPCs. */
function verificationRpcError(message: string): AdminActionResult<never> {
  const m = (message ?? "").toLowerCase();
  if (m.includes("forbidden")) return { success: false, status: 403, error: ADMIN_MESSAGES.forbidden };
  if (m.includes("unauthenticated")) return { success: false, status: 401, error: "You must be logged in." };
  if (m.includes("insufficient_stock")) {
    const productName = message.split(":")[1]?.trim();
    return {
      success: false,
      status: 409,
      error: productName
        ? `Insufficient stock for ${productName}.`
        : "Insufficient stock for one or more items.",
    };
  }
  if (m.includes("product_not_found") || m.includes("product_unavailable"))
    return { success: false, status: 409, error: "One of the items is no longer available." };
  if (m.includes("invalid_variant"))
    return { success: false, status: 409, error: "The selected size or colour is no longer available." };
  if (m.includes("could not find the function") || m.includes("schema cache") || m.includes("pgrst202"))
    return {
      success: false,
      status: 500,
      error: "Payment verification is not available yet. Please apply the checkout-verification migration.",
    };
  return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
}

/**
 * ACCEPT a checkout payment verification — the ONLY way an online-payment
 * order now comes into existence.
 *
 * Delegates to the atomic `approve_payment_verification` Postgres function
 * (admin-checked, row-locked, idempotent): it re-quotes prices/stock from
 * live data, creates the order EXACTLY ONCE with `Placed` + payment `Verified`,
 * and marks the payments row verified — all in one transaction. A second call
 * returns the same order instead of creating another.
 */
export async function adminApprovePaymentVerification(verificationId: string): Promise<
  AdminActionResult<{
    order: AdminOrder | null;
    verification: AdminPaymentVerification | null;
    alreadyApproved: boolean;
  }>
> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;

  try {
    const staffName = await actingStaffName(guard.userId);

    // SECURITY DEFINER RPC, but called with the caller's authenticated session
    // so the function's own auth.uid() + profiles.role check is the authority.
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("approve_payment_verification", {
      p_verification_id: verificationId,
      p_staff_name: staffName,
    });

    if (error) {
      console.error("approve_payment_verification failed:", error.message);
      return verificationRpcError(error.message);
    }

    const result = (data ?? {}) as {
      success?: boolean;
      already_approved?: boolean;
      order_id?: string;
      error?: string;
    };

    if (result.success === false) {
      if (result.error === "not_found")
        return { success: false, status: 404, error: "Payment verification not found." };
      if (result.error === "already_rejected")
        return {
          success: false,
          status: 409,
          error: "This submission was already rejected — no order was placed.",
        };
      return { success: false, status: 409, error: "This submission can no longer be approved." };
    }

    const orderId = result.order_id ?? "";
    const order = orderId ? await getOrderById(orderId) : null;
    const verification = await getPaymentVerificationById(verificationId);

    // Audit (an idempotent repeat approval is logged too, but marked as such).
    await adminSupabase.from("audit_logs").insert({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      staff_name: staffName,
      role: "Admin",
      module: "Payments",
      action: "Verify",
      description: result.already_approved
        ? `Payment verification ${verificationId} was already approved (order ${orderId})`
        : `Approved payment verification ${verificationId} (UTR ${verification?.utrNumber ?? "n/a"}); placed order ${orderId}`,
      ip_address: "unknown",
    });

    revalidateOrderViews();
    revalidatePath("/admin/payments");

    return {
      success: true,
      data: { order, verification, alreadyApproved: Boolean(result.already_approved) },
    };
  } catch (error) {
    console.error("Error approving payment verification:", error);
    return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
  }
}

/**
 * REJECT a checkout payment verification. No order is ever created; the
 * database restores the customer's cart items in the same transaction.
 * Idempotent: rejecting twice is a no-op, and an already-approved submission
 * can no longer be rejected.
 */
export async function adminRejectPaymentVerification(
  verificationId: string,
  reason: string
): Promise<AdminActionResult<AdminPaymentVerification | null>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;

  try {
    const staffName = await actingStaffName(guard.userId);

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("reject_payment_verification", {
      p_verification_id: verificationId,
      p_reason: reason,
      p_staff_name: staffName,
    });

    if (error) {
      console.error("reject_payment_verification failed:", error.message);
      return verificationRpcError(error.message);
    }

    const result = (data ?? {}) as {
      success?: boolean;
      already_rejected?: boolean;
      error?: string;
    };

    if (result.success === false) {
      if (result.error === "not_found")
        return { success: false, status: 404, error: "Payment verification not found." };
      if (result.error === "already_approved")
        return {
          success: false,
          status: 409,
          error: "This submission was already approved — the order exists and cannot be undone here.",
        };
      return { success: false, status: 409, error: "This submission can no longer be rejected." };
    }

    const verification = await getPaymentVerificationById(verificationId);

    await adminSupabase.from("audit_logs").insert({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      staff_name: staffName,
      role: "Admin",
      module: "Payments",
      action: "Reject",
      description: `Rejected payment verification ${verificationId}: ${reason}`,
      ip_address: "unknown",
    });

    revalidateOrderViews();
    revalidatePath("/admin/payments");

    return { success: true, data: verification };
  } catch (error) {
    console.error("Error rejecting payment verification:", error);
    return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
  }
}

export async function adminRejectPayment(
  paymentId: string,
  reason: string
): Promise<AdminActionResult<AdminOrder | null>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.failure;

  try {
    const staffName = await actingStaffName(guard.userId);
    const now = new Date().toISOString();

    const { data: payment, error } = await adminSupabase
      .from("payments")
      .update({
        status: "rejected",
        rejection_reason: reason,
        verified_at: now,
        verified_by: staffName,
      })
      .eq("id", paymentId)
      .eq("status", "pending_verification")
      .select("order_id")
      .maybeSingle();
    if (error) throw error;
    if (!payment) {
      return { success: false, status: 409, error: "This payment is not awaiting verification." };
    }

    if (payment?.order_id) {
      await adminSupabase
        .from("orders")
        .update({ payment_status: "Failed", updated_at: now })
        .eq("id", payment.order_id);

      await adminSupabase.from("order_timeline").insert({
        order_id: payment.order_id,
        status: "Payment Rejected",
        timestamp: now,
        note: `Payment rejected: ${reason}`,
        staff_name: staffName,
      });
    }

    await adminSupabase.from("audit_logs").insert({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: now,
      staff_name: staffName,
      role: "Admin",
      module: "Payments",
      action: "Reject",
      description: `Rejected payment ${paymentId}: ${reason}`,
      ip_address: "unknown",
    });

    revalidateOrderViews();
    revalidatePath("/admin/payments");
    return { success: true, data: payment?.order_id ? await getOrderById(payment.order_id) : null };
  } catch (error) {
    console.error("Error rejecting payment:", error);
    return { success: false, status: 500, error: ADMIN_MESSAGES.failed };
  }
}


