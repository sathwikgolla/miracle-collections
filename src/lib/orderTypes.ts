/**
 * Shared types for the customer checkout/cancellation server actions.
 *
 * These live outside the `'use server'` module because every export of a
 * `'use server'` file must be an async function.
 */

export interface PlaceOrderLineInput {
  productId: string;
  qty: number;
  color?: string;
  size?: string;
}

export interface PlaceOrderShippingInput {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  /** "Area / Landmark" from the checkout address form (optional). */
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PlaceOrderInput {
  items: PlaceOrderLineInput[];
  shipping: PlaceOrderShippingInput;
  paymentMethod: string;
  coupon?: string;
}

export type PlaceOrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export type CancelOrderResult =
  | { success: true }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Checkout payment verification (online payments, UTR collected BEFORE the
// order exists)
// ---------------------------------------------------------------------------

/** Lifecycle of a pending-payment submission. A pending row is NOT an order. */
export type PaymentVerificationState = "pending" | "approved" | "rejected";

export interface SubmitPaymentVerificationInput extends PlaceOrderInput {
  /** UTR / bank transaction reference captured at checkout. */
  utr: string;
  /**
   * The customer's checkout acknowledgement checkbox. Required by the server
   * action as a form-completeness signal — it is NOT proof of payment and the
   * order still cannot exist until an admin approves the UTR.
   */
  acknowledged: boolean;
}

export type SubmitPaymentVerificationResult =
  | { success: true; verificationId: string; total: number }
  | { success: false; error: string };

/**
 * The delivery address snapshot saved with a submission at checkout. This is
 * the authoritative address for that checkout — never a profile address, which
 * may change later.
 */
export interface PaymentVerificationShipping {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
}

/** Customer-visible summary of their own payment verification submissions. */
export interface PaymentVerificationSummary {
  id: string;
  status: PaymentVerificationState;
  utrNumber: string;
  paymentMethod: string;
  total: number;
  submittedAt: string;
  orderId?: string | null;
  rejectionReason?: string | null;
  decidedAt?: string | null;
  /** Complete checkout delivery address (present on rows from checkout). */
  shipping?: PaymentVerificationShipping | null;
}

export type PaymentVerificationListResult =
  | { success: true; data: PaymentVerificationSummary[] }
  | { success: false; error: string };
