"use server";

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  isCheckoutPaymentMethodAllowed,
  isValidUtr,
  normalizeUtr,
  requiresOnlinePaymentVerification,
} from "@/lib/paymentMethods";
import type {
  CancelOrderResult,
  PaymentVerificationListResult,
  PaymentVerificationSummary,
  PlaceOrderInput,
  PlaceOrderResult,
  SubmitPaymentVerificationInput,
  SubmitPaymentVerificationResult,
} from "@/lib/orderTypes";

/**
 * Customer order server actions.
 *
 * These are NOT admin operations. They authenticate the caller from the SSR
 * cookie session and delegate to the `create_order` / `cancel_order` Postgres
 * functions, which independently load authoritative prices/stock, derive
 * ownership from `auth.uid()`, compute totals and set status themselves.
 *
 * The browser only supplies product ids, quantities, an address and a payment
 * method label — never a price, total, user id, stock, status or actor.
 */

/** Map internal function messages to safe, non-revealing customer messages. */
function safeOrderError(message: string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("insufficient_stock")) return "Some items in your cart are out of stock.";
  if (m.includes("product_not_found") || m.includes("product_unavailable"))
    return "One of the items is no longer available.";
  if (m.includes("invalid_variant")) return "The selected size or colour is no longer available.";
  if (m.includes("invalid_address")) return "Please provide a complete delivery address.";
  if (m.includes("empty_cart") || m.includes("invalid_item"))
    return "Your cart is invalid. Please review it and try again.";
  if (m.includes("unauthenticated")) return "You must be logged in.";
  if (m.includes("online_payment_verification_required"))
    return "Online payment orders must be submitted with a UTR reference for verification at checkout.";
  if (m.includes("upi_only") || m.includes("method_not_allowed"))
    return "UPI is the only payment method available at checkout.";
  return "Unable to place order. Please try again.";
}

/** Map `submit_payment_verification` messages to safe customer messages. */
function safeVerificationError(message: string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid_utr"))
    return "Enter a valid UTR / transaction reference number (6-30 letters or digits).";
  if (m.includes("duplicate_utr"))
    return "This reference number is already linked to another payment.";
  if (m.includes("already_pending"))
    return "You already have a payment reference awaiting verification. Please wait for it to be reviewed.";
  if (m.includes("not_required"))
    return "Cash on Delivery does not require a UTR number.";
  if (m.includes("upi_only") || m.includes("method_not_allowed"))
    return "UPI is the only payment method available at checkout.";
  if (m.includes("coupon_not_allowed"))
    return "Coupon codes are not accepted at checkout.";
  if (m.includes("blocked"))
    return "Your account is blocked. Please contact support.";
  if (m.includes("could not find the function") || m.includes("schema cache") || m.includes("pgrst202"))
    return "Payment verification is not available yet. Please try again later.";
  return safeOrderError(message);
}

export async function placeOrderSecure(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    if (!input?.items?.length) {
      return { success: false, error: "Your cart is empty." };
    }

    const items = input.items
      .filter((i) => i && i.productId && Number(i.qty) > 0)
      .map((i) => ({
        product_id: i.productId,
        quantity: Math.floor(Number(i.qty)),
        color: i.color ?? null,
        size: i.size ?? null,
      }));

    if (items.length === 0) {
      return { success: false, error: "Your cart is invalid. Please review it and try again." };
    }

    // Checkout is UPI-only: card, net banking and Cash on Delivery were removed
    // from the storefront, so a request naming them must fail here as well. The
    // database applies the same allowlist to every new order (`upi_only`).
    if (!isCheckoutPaymentMethodAllowed(input.paymentMethod)) {
      return {
        success: false,
        error: "UPI is the only payment method available at checkout.",
      };
    }

    // The coupon section was removed from checkout, so no code may be sent —
    // totals must match exactly what the customer saw on the checkout page.
    if (input.coupon && input.coupon.trim()) {
      return { success: false, error: "Coupon codes are not accepted at checkout." };
    }

    // Online payments can ONLY enter the system as a pending payment
    // verification (UTR first, admin approval second). Directly calling this
    // action with an online method — or with a forged payload — must not create
    // a placed order. The database enforces the same rule independently
    // (`online_payment_verification_required` inside create_order's insert
    // guard), so neither layer alone can be bypassed.
    if (requiresOnlinePaymentVerification(input.paymentMethod)) {
      return {
        success: false,
        error:
          "Online payment orders must be submitted with a UTR reference for verification at checkout.",
      };
    }

    const { data, error } = await supabase.rpc("create_order", {
      p_items: items,
      p_shipping: input.shipping,
      p_payment_method: input.paymentMethod,
      p_coupon: input.coupon && input.coupon.trim() ? input.coupon.trim() : null,
    });

    if (error) {
      // Technical detail stays on the server.
      console.error("create_order failed:", error.message);
      return { success: false, error: safeOrderError(error.message) };
    }

    if (!data) {
      return { success: false, error: "Unable to place order. Please try again." };
    }

    return { success: true, orderId: data as string };
  } catch (err) {
    console.error("placeOrderSecure error:", err);
    return { success: false, error: "Unable to place order. Please try again." };
  }
}

/**
 * Submit a UPI/UTR reference for the caller's own order (manual verification).
 *
 * Delegates to the `submit_order_payment` Postgres function, which derives
 * ownership from the session and creates/refreshes the corresponding `payments`
 * row in `pending_verification`. It never marks a payment as paid — only the
 * admin verification path does that.
 */
export async function submitOrderPaymentUtr(
  orderId: string,
  utr: string,
  screenshotUrl?: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!orderId) return { success: false, error: "Order not found." };
    const cleanUtr = (utr ?? "").trim();
    if (!cleanUtr) return { success: false, error: "Enter the UPI/UTR reference number." };

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    // Resolve the order through the caller's OWN RLS-scoped session before
    // touching the RPC. This enforces ownership at the app layer as well, and
    // turns a missing/foreign order into a precise, honest error instead of a
    // confusing downstream failure.
    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_status, payment_method")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return { success: false, error: "Order not found." };
    }
    if (!requiresOnlinePaymentVerification(order.payment_method)) {
      return { success: false, error: "This order does not require an online payment reference." };
    }
    if (order.payment_status === "Verified" || order.payment_status === "Paid") {
      return { success: false, error: "This payment has already been verified." };
    }

    const { data, error } = await supabase.rpc("submit_order_payment", {
      p_order_id: orderId,
      p_utr: cleanUtr,
      p_screenshot_url: screenshotUrl && screenshotUrl.trim() ? screenshotUrl.trim() : null,
    });

    if (error) {
      console.error("submit_order_payment failed:", error.message);
      const m = (error.message ?? "").toLowerCase();
      if (m.includes("invalid_utr")) return { success: false, error: "Enter the UPI/UTR reference number." };
      if (m.includes("duplicate_utr"))
        return { success: false, error: "This reference is already linked to another order." };
      if (m.includes("not_required"))
        return { success: false, error: "This order does not require an online payment reference." };
      if (m.includes("not_owner") || m.includes("order_not_found"))
        return { success: false, error: "Order not found." };
      // The submit_order_payment function has not been deployed to this project
      // yet (migration pending) — say so instead of masking it.
      if (
        m.includes("could not find the function") ||
        m.includes("schema cache") ||
        m.includes("pgrst202")
      ) {
        console.error("submit_order_payment RPC is missing — apply the order-fulfillment migration.");
        return {
          success: false,
          error: "Payment verification is not available yet. Please try again later.",
        };
      }
      return { success: false, error: "Unable to submit payment reference. Please try again." };
    }

    const result = (data ?? {}) as { success?: boolean; error?: string; duplicate?: boolean };
    if (result.success === false) {
      if (result.error === "already_verified")
        return { success: false, error: "This payment has already been verified." };
      return { success: false, error: "Unable to submit payment reference. Please try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("submitOrderPaymentUtr error:", err);
    return { success: false, error: "Unable to submit payment reference. Please try again." };
  }
}

/**
 * Submit an online checkout WITH its UTR reference for admin verification.
 *
 * This is the ONLY way an online-payment order can come into existence: it
 * creates a `payment_verifications` row in `pending` state and does NOT create
 * an order, does NOT mark anything as paid and does NOT clear any confirmation
 * message — the admin's approval (approve_payment_verification) is what
 * places the order, exactly once.
 *
 * Prices, variants, stock, totals, UTR validity and duplicate detection are
 * all re-derived on the server; the browser only supplies identifiers, the
 * address, the method label and the reference string.
 */
export async function submitPaymentVerification(
  input: SubmitPaymentVerificationInput
): Promise<SubmitPaymentVerificationResult> {
  try {
    if (!input?.items?.length) {
      return { success: false, error: "Your cart is empty." };
    }
    if (input.acknowledged !== true) {
      return {
        success: false,
        error: "Please confirm that you completed the payment and entered your UTR number.",
      };
    }
    const utr = normalizeUtr(input.utr);
    if (!isValidUtr(utr)) {
      return {
        success: false,
        error: "Enter a valid UTR / transaction reference number (6-30 letters or digits).",
      };
    }
    // UPI only — card / net banking / COD submissions are refused server-side,
    // exactly like the checkout UI that no longer offers them.
    if (!isCheckoutPaymentMethodAllowed(input.paymentMethod)) {
      return {
        success: false,
        error: "UPI is the only payment method available at checkout.",
      };
    }
    // Checkout has no coupon section, so a submitted code would make the stored
    // total disagree with the total the customer acknowledged.
    if (input.coupon && input.coupon.trim()) {
      return { success: false, error: "Coupon codes are not accepted at checkout." };
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const items = input.items
      .filter((i) => i && i.productId && Number(i.qty) > 0)
      .map((i) => ({
        product_id: i.productId,
        quantity: Math.floor(Number(i.qty)),
        color: i.color ?? null,
        size: i.size ?? null,
      }));

    if (items.length === 0) {
      return { success: false, error: "Your cart is invalid. Please review it and try again." };
    }

    const { data, error } = await supabase.rpc("submit_payment_verification", {
      p_items: items,
      p_shipping: input.shipping,
      p_payment_method: input.paymentMethod,
      p_coupon: input.coupon && input.coupon.trim() ? input.coupon.trim() : null,
      p_utr: utr,
    });

    if (error) {
      // Technical detail stays on the server.
      console.error("submit_payment_verification failed:", error.message);
      return { success: false, error: safeVerificationError(error.message) };
    }

    const result = (data ?? {}) as { success?: boolean; verification_id?: string; total?: number };
    if (result.success !== true || !result.verification_id) {
      return { success: false, error: "Unable to submit payment reference. Please try again." };
    }

    return {
      success: true,
      verificationId: result.verification_id,
      total: Number(result.total ?? 0),
    };
  } catch (err) {
    console.error("submitPaymentVerification error:", err);
    return { success: false, error: "Unable to submit payment reference. Please try again." };
  }
}

/**
 * The caller's OWN payment verification submissions (RLS-scoped), newest
 * first — so the customer can see pending / rejected / approved status on the
 * order-tracking pages.
 */
export async function getMyPaymentVerifications(): Promise<PaymentVerificationListResult> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const { data, error } = await supabase
      .from("payment_verifications")
      .select(
        "id, status, utr_number, payment_method, total, submitted_at, order_id, rejection_reason, decided_at, shipping"
      )
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("getMyPaymentVerifications failed:", error.message);
      return { success: false, error: "Unable to load payment verifications." };
    }

    const rows = (data ?? []) as {
      id: string;
      status: PaymentVerificationSummary["status"];
      utr_number: string;
      payment_method: string;
      total: number | string;
      submitted_at: string;
      order_id: string | null;
      rejection_reason: string | null;
      decided_at: string | null;
      shipping: PaymentVerificationSummary["shipping"];
    }[];

    const list: PaymentVerificationSummary[] = rows.map((r) => ({
      id: r.id,
      status: r.status,
      utrNumber: r.utr_number,
      paymentMethod: r.payment_method,
      total: Number(r.total ?? 0),
      submittedAt: r.submitted_at,
      orderId: r.order_id,
      rejectionReason: r.rejection_reason,
      decidedAt: r.decided_at,
      // The exact delivery address submitted at checkout (RLS only ever
      // returns the caller's own rows), so pending/rejected customers keep
      // their delivery details and can retry without re-entering them.
      shipping: r.shipping ?? null,
    }));

    return { success: true, data: list };
  } catch (err) {
    console.error("getMyPaymentVerifications error:", err);
    return { success: false, error: "Unable to load payment verifications." };
  }
}

export async function cancelOrderSecure(orderId: string): Promise<CancelOrderResult> {
  try {
    if (!orderId) {
      return { success: false, error: "Order not found." };
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });

    if (error) {
      const m = (error.message ?? "").toLowerCase();
      if (m.includes("not_cancellable"))
        return { success: false, error: "This order can no longer be cancelled." };
      if (m.includes("not_owner") || m.includes("order_not_found"))
        return { success: false, error: "Order not found." };
      if (m.includes("unauthenticated"))
        return { success: false, error: "You must be logged in." };
      console.error("cancel_order failed:", error.message);
      return { success: false, error: "Unable to cancel order. Please try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("cancelOrderSecure error:", err);
    return { success: false, error: "Unable to cancel order. Please try again." };
  }
}
