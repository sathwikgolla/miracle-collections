"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";
import { isValidUtr, UTR_INVALID_MESSAGE } from "@/lib/paymentMethods";

/**
 * Lets a customer submit the UPI/UTR reference for their own pending order.
 *
 * The submitted reference is validated server-side (ownership + duplicate
 * detection) and creates the `payments` row in `pending_verification`. It never
 * marks the payment paid — only an admin can do that.
 */
export function UtrPaymentForm({ orderId }: { orderId: string }) {
  const { submitUtr } = useStore();
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Strict 12-digit format, re-checked on the server as well — the disabled
  // button is only a convenience, never the actual guard.
  const valid = isValidUtr(utr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    const ok = await submitUtr(orderId, utr.trim());
    setSubmitting(false);
    if (ok) setUtr("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <ShieldCheck size={16} /> Complete the payment
      </h2>
      <p className="mt-1 text-xs text-amber-800">
        Paid via UPI? Enter the bank UTR / reference number from your payment app. Our team
        verifies it against the merchant account.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={utr}
          onChange={(e) => setUtr(e.target.value.slice(0, 30))}
          placeholder="e.g. 402912345678"
          inputMode="numeric"
          aria-invalid={utr.length > 0 && !valid}
          className="h-10 min-w-[220px] flex-1 rounded-md border border-amber-300 bg-white px-3 text-sm text-black outline-none focus:border-black"
        />
        <Button type="submit" disabled={submitting || !valid}>
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Submitting…
            </>
          ) : (
            "Submit UTR"
          )}
        </Button>
      </div>
      {utr.length > 0 && !valid && (
        <p className="mt-2 text-xs text-red-600">{UTR_INVALID_MESSAGE}</p>
      )}
    </form>
  );
}
