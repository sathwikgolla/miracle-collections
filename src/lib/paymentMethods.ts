/**
 * Canonical payment-method rules — ONE source of truth for the app.
 *
 * The database owns the identical rule as `public.payment_method_key(text)` and
 * `public.order_requires_online_payment(text)`, and uses it inside the
 * order-creation trigger. This module is the read-only mirror the browser needs
 * for UI decisions (e.g. whether to show the UTR form), because the client
 * cannot call a Postgres function for a render-time check.
 *
 * If you change one, change the other — they are intentionally kept identical.
 * Nothing here may hardcode a single online method like 'upi_qr'.
 */

export type PaymentMethodKey = "cod" | "upi" | "card" | "netbanking" | "unknown" | string;

/**
 * Normalise a free-text payment-method label ("Cash on Delivery", "UPI",
 * "Credit / Debit Card", "Net Banking", ...) into a stable key. Unknown methods
 * fall through to their lower-cased label so new methods keep working without a
 * code change.
 */
export function paymentMethodKey(method?: string | null): PaymentMethodKey {
  const m = (method ?? "").trim().toLowerCase();
  if (!m) return "unknown";
  if (m === "cod" || m === "cash_on_delivery" || m.includes("cash on delivery")) return "cod";
  if (m.includes("upi")) return "upi";
  if (m.includes("card")) return "card";
  if (m.includes("netbanking") || (m.includes("net") && m.includes("bank"))) return "netbanking";
  return m;
}

/** True for Cash on Delivery only — the method that needs no online verification. */
export function isCodPayment(method?: string | null): boolean {
  return paymentMethodKey(method) === "cod";
}

/**
 * Whether an order must sit in the online payment-verification queue.
 *
 * COD never does. A blank/unknown method does not either — we never create an
 * unverifiable placeholder row. Every other (online) method does, and the row
 * records the ACTUAL method key rather than a hardcoded one.
 */
export function requiresOnlinePaymentVerification(method?: string | null): boolean {
  const key = paymentMethodKey(method);
  return key !== "cod" && key !== "unknown";
}

/**
 * The checkout currently offers exactly ONE payment method: UPI (card, net
 * banking and Cash on Delivery were removed from the storefront).
 *
 * This is the server-side allowlist enforced by placeOrderSecure() and
 * submitPaymentVerification(), so a manipulated client that re-selects a
 * removed method — in the UI or by calling the actions directly — is rejected.
 * The database enforces the same rule for new orders (`upi_only`) and the
 * checkout UI renders exactly these methods.
 */
export const CHECKOUT_PAYMENT_METHOD_KEYS: readonly string[] = ["upi"];

/** Whether a payment-method label may be used for a NEW checkout order/submission. */
export function isCheckoutPaymentMethodAllowed(method?: string | null): boolean {
  return CHECKOUT_PAYMENT_METHOD_KEYS.includes(paymentMethodKey(method));
}

/**
 * Normalise a customer-submitted UTR / transaction reference for storage and
 * comparison: trims, strips inner whitespace and upper-cases.
 */
export function normalizeUtr(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Whether a submitted reference is structurally valid: 6-30 alphanumeric
 * characters (dashes allowed). This is a FORMAT check only — it never proves a
 * payment happened; only the admin's verification does that.
 */
export function isValidUtr(value?: string | null): boolean {
  return /^[A-Za-z0-9-]{6,30}$/.test(normalizeUtr(value));
}

/** Friendly, customer-facing label for an order/payment status value. */
export function paymentStatusLabel(status?: string | null): string {
  switch (status) {
    case "Paid":
    case "Verified":
      return "Payment Successful";
    case "Pending Verification":
      return "Payment Under Verification";
    case "Failed":
      return "Payment Rejected";
    case "Refunded":
      return "Payment Refunded";
    case "Pending":
      return "Payment Pending";
    default:
      return status || "Payment Pending";
  }
}
