"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";
import { cn, formatPrice, handleImageError } from "@/lib/utils";
import { isValidUtr, requiresOnlinePaymentVerification } from "@/lib/paymentMethods";
import { submitPaymentVerification } from "@/app/actions/orders";

const DELIVERY_CHARGE = 50;
const FREE_DELIVERY_THRESHOLD = 499;

type PaymentMethod = "upi";
type Step = 0 | 1 | 2;

// UPI is the ONLY payment method offered at checkout. Credit/Debit Card, Net
// Banking and Cash on Delivery were removed here, and the server actions plus
// the database's `upi_only` guards refuse them too, so a manipulated frontend
// request or a direct API call cannot select a removed method.
const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
  { id: "upi", label: "UPI", icon: Smartphone },
];

const EMPTY_ADDRESS: Omit<Address, "id"> = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

function CheckoutInner() {
  const { cart, hydrated, addresses, addAddress, toast, products, clearCart } = useStore();
  const [step, setStep] = useState<Step>(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses[0]?.id ?? null
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<Omit<Address, "id">>(EMPTY_ADDRESS);

  const [payment, setPayment] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);

  // Online payment verification (UTR) — captured BEFORE the final submission.
  // Checking the box is an acknowledgement only, never proof of payment.
  const [utr, setUtr] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitted, setSubmitted] = useState<{
    verificationId: string;
    utr: string;
    total: number;
  } | null>(null);

  const getProductById = (id: string) => products.find((p: any) => p.id === id);
  const items = cart
    .map((item) => ({ item, product: getProductById(item.productId) }))
    .filter((x) => x.product);

  const mrpTotal = items.reduce((s, { item, product }) => s + product!.mrp * item.qty, 0);
  const itemTotal = items.reduce((s, { item, product }) => s + product!.price * item.qty, 0);
  const discount = mrpTotal - itemTotal;
  const deliveryCharge = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  // No coupon section exists any more: the total is items + delivery charge,
  // the same figure the server re-computes for the verification submission, the
  // admin approval quote and the final order.
  const total = Math.max(0, itemTotal + deliveryCharge);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const paymentLabel = PAYMENT_METHODS.find((p) => p.id === payment)!.label;
  // COD is the only method that does not need a UTR / admin verification.
  const onlinePayment = requiresOnlinePaymentVerification(paymentLabel);
  const utrValid = isValidUtr(utr);

  // After an online submission the checkout is complete — show the
  // "awaiting verification" confirmation instead of the (now empty) cart.
  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Clock size={28} className="text-amber-600" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-black sm:text-2xl">
            Payment reference submitted
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            We received UTR <span className="font-mono font-bold text-black">{submitted.utr}</span>{" "}
            for <span className="font-bold text-black">{formatPrice(submitted.total)}</span>. Your
            order has <span className="font-bold text-black">not been placed yet</span> — it will be
            created only after our admin verifies your payment.
          </p>
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            Complete your payment first, then enter your UTR/transaction reference number. Your
            order will be confirmed only after admin verification.
          </p>
          <p className="mt-4 text-xs text-neutral-500">
            Submission reference: <span className="font-mono font-semibold text-black">{submitted.verificationId}</span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/orders">Track Verification Status</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (hydrated && cart.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <ShoppingBag size={28} className="text-neutral-400" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-black">Your cart is empty</h1>
        <p className="mt-1 text-sm text-neutral-500">Add some products before checking out.</p>
        <Button asChild className="mt-6">
          <a href="/products">Go Shopping</a>
        </Button>
      </div>
    );
  }

  const saveAddress = async () => {
    if (
      !addressForm.name.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.line1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      toast("Please complete all required address fields", "error");
      return;
    }
    const saved = await addAddress(addressForm);
    if (saved) {
      setSelectedAddressId(saved.id);
      setShowAddressForm(false);
      setAddressForm(EMPTY_ADDRESS);
      toast("Address added");
    }
  };

  const canPlace =
    step === 2 &&
    Boolean(selectedAddress) &&
    // UPI ID + (for the online flow) a valid UTR and the required
    // acknowledgement checkbox.
    Boolean(upiId.trim()) &&
    (!onlinePayment || (utrValid && acknowledged));

  const placeOrderAction = async () => {
    if (!selectedAddress) {
      setStep(0);
      toast("Please select a delivery address", "error");
      return;
    }

    // ---- Online payment: submit for verification, do NOT place an order ----
    if (onlinePayment) {
      if (!acknowledged) {
        toast(
          "Please confirm that you completed the payment and entered your UTR number",
          "error"
        );
        return;
      }
      if (!utrValid) {
        toast("Enter a valid UTR / transaction reference number", "error");
        return;
      }
      setProcessing(true);
      const result = await submitPaymentVerification({
        items: items.map(({ item, product }) => ({
          productId: product!.id,
          qty: item.qty,
          color: item.color,
          size: item.size,
        })),
        shipping: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          line1: selectedAddress.line1,
          line2: selectedAddress.line2,
          // The "Area / Landmark" field is part of the address the customer
          // entered — it must travel with the submission so the pending record
          // (and, on approval, the order) holds the exact checkout address.
          landmark: selectedAddress.landmark,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        paymentMethod: paymentLabel,
        utr,
        acknowledged: true,
      });
      setProcessing(false);

      if (result.success) {
        setSubmitted({
          verificationId: result.verificationId,
          utr: utr.trim().toUpperCase(),
          total: result.total,
        });
        // The server already cleared the cart as part of the submission.
        void clearCart();
        toast("Payment reference submitted for verification");
      } else {
        toast(result.error, "error");
      }
      return;
    }

    // UPI is the only method left, and it always takes the verification path
    // above — there is no direct "place order" branch any more, so Cash on
    // Delivery (and the removed card/net banking methods) can no longer create
    // an order from this screen.
  };

  const steps: { label: string }[] = [
    { label: "Address" },
    { label: "Order Summary" },
    { label: "Payment" },
  ];

  const input =
    "h-11 w-full rounded-md border border-neutral-300 px-3 text-sm text-black outline-none transition-colors focus:border-black";

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-xl font-extrabold text-black sm:text-2xl">Checkout</h1>

      {/* Steps indicator */}
      <div className="mb-6 flex items-center gap-2 sm:gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {steps.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.label} className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0",
                    done
                      ? "bg-black text-white"
                      : active
                        ? "border-2 border-black text-black"
                        : "border border-neutral-300 text-neutral-400"
                  )}
                >
                  {done ? <Check size={14} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold sm:text-sm whitespace-nowrap",
                    active ? "text-black" : "text-neutral-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && <div className="h-px w-3 sm:w-12 bg-neutral-300 shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Step 0 — Address */}
          {step === 0 && (
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-black">
                <MapPin size={18} /> Delivery Address
              </h2>

              {addresses.length === 0 && !showAddressForm && (
                <p className="mb-4 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                  You have no saved addresses yet.
                </p>
              )}

              <div className="space-y-3">
                {addresses.map((a) => {
                  const active = selectedAddressId === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAddressId(a.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors",
                        active
                          ? "border-black bg-neutral-50"
                          : "border-neutral-200 hover:border-neutral-400"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          active ? "border-black" : "border-neutral-300"
                        )}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-black" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold text-black">{a.name}</span>
                          <span className="text-xs text-neutral-500">{a.phone}</span>
                        </span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-neutral-600">
                          {[a.line1, a.line2, a.landmark, a.city, `${a.state} - ${a.pincode}`]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {showAddressForm ? (
                <div className="mt-4 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-2">
                  <input placeholder="Full Name" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} className={input} />
                  <input placeholder="Mobile Number" inputMode="numeric" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className={input} />
                  <input placeholder="House / Flat" value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} className={input} />
                  <input placeholder="Street" value={addressForm.line2 ?? ""} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} className={input} />
                  <input placeholder="Area / Landmark" value={addressForm.landmark ?? ""} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} className={input} />
                  <input placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className={input} />
                  <input placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className={input} />
                  <input placeholder="PIN Code" inputMode="numeric" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className={input} />
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Button size="sm" onClick={saveAddress}>Save Address</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddressForm(true)}>
                  <Plus size={15} /> Add New Address
                </Button>
              )}

              <Button className="mt-5" onClick={() => setStep(1)} disabled={!selectedAddress}>
                Continue to Order Summary
              </Button>
            </section>
          )}

          {/* Step 1 — Order Summary */}
          {step === 1 && (
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-black">Order Summary</h2>

              <div className="mb-4 rounded-md border border-neutral-200 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-black" />
                    <div>
                      <p className="text-sm font-bold text-black">{selectedAddress?.name}</p>
                      <p className="text-xs leading-relaxed text-neutral-500">
                        {selectedAddress ? formatAddress(selectedAddress) : "No address selected"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(0)}
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-black hover:underline"
                  >
                    <Pencil size={13} /> Change
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map(({ item, product }) => (
                  <div key={item.key} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product!.images[0]} alt={product!.name} onError={handleImageError} className="h-14 w-14 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-black">{product!.name}</p>
                      <p className="text-xs text-neutral-500">
                        Qty {item.qty}
                        {item.size ? ` · ${item.size}` : ""}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                      <p className="text-xs text-neutral-400 line-through">{formatPrice(product!.mrp * item.qty)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-black">{formatPrice(product!.price * item.qty)}</p>
                      <p className="text-xs font-semibold text-green-700">
                        {Math.round(((product!.mrp - product!.price) / product!.mrp) * 100)}% off
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="mt-5" onClick={() => setStep(2)}>
                Continue to Payment
              </Button>
            </section>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-black">Select Payment Method</h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayment(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors",
                      payment === m.id
                        ? "border-black bg-neutral-50 text-black"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                    )}
                  >
                    <m.icon size={18} className={payment === m.id ? "text-black" : "text-neutral-400"} />
                    {m.label}
                    <span
                      className={cn(
                        "ml-auto flex h-4 w-4 items-center justify-center rounded-full border",
                        payment === m.id ? "border-black" : "border-neutral-300"
                      )}
                    >
                      {payment === m.id && <span className="h-2 w-2 rounded-full bg-black" />}
                    </span>
                  </button>
                ))}
              </div>

              {payment === "upi" && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-black">UPI ID</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="username@upi" className={input} />
                    <Button
                      variant="outline"
                      className="shrink-0 w-full sm:w-auto"
                      onClick={() => (upiId.trim() ? toast("UPI verified") : toast("Enter a valid UPI ID", "error"))}
                    >
                      Verify UPI
                    </Button>
                  </div>
                </div>
              )}

              {/* UTR + acknowledgement — required before an ONLINE order can be
                  submitted for verification. The checkbox is an acknowledgement,
                  never proof of payment. */}
              {onlinePayment && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
                    <ShieldCheck size={15} /> Pay first, then submit your UTR
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Complete your payment first, then enter your UTR/transaction reference number.
                    Your order will be confirmed only after admin verification.
                  </p>

                  <label
                    htmlFor="checkout-utr"
                    className="mb-1.5 mt-3 block text-sm font-medium text-black"
                  >
                    UTR / Transaction Reference Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="checkout-utr"
                    value={utr}
                    onChange={(e) =>
                      setUtr(e.target.value.replace(/\s/g, "").toUpperCase().slice(0, 30))
                    }
                    placeholder="e.g. 402912345678"
                    inputMode="text"
                    autoComplete="off"
                    className={input}
                  />
                  {utr.length > 0 && !utrValid && (
                    <p className="mt-1 text-xs text-red-600">
                      Enter a valid UTR/reference number (6-30 letters or digits).
                    </p>
                  )}
                  {!utrValid && utr.length === 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      Your UTR number is required before you can submit this order.
                    </p>
                  )}

                  <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-black"
                    />
                    <span className="text-xs leading-relaxed text-neutral-700">
                      I have completed the payment of{" "}
                      <span className="font-bold text-black">{formatPrice(total)}</span> and entered
                      the correct UTR/reference number above. I understand my order will be placed
                      only after admin verification.
                    </span>
                  </label>
                  {!acknowledged && (
                    <p className="mt-1.5 text-xs text-red-600">
                      This acknowledgement is required before submitting.
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
                <ShieldCheck size={14} className="text-black" /> Demo only — no real payment is processed and no card details are stored.
              </p>
            </section>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="h-fit rounded-lg border border-neutral-200 bg-white p-5 lg:sticky lg:top-40">
          <h2 className="text-base font-bold text-black">Price Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Price ({items.length} items)</span>
              <span className="font-medium text-black">{formatPrice(mrpTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Discount</span>
              <span className="font-medium text-green-700">− {formatPrice(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Delivery charge</span>
              <span className="font-medium text-black">{deliveryCharge === 0 ? "FREE" : formatPrice(deliveryCharge)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-neutral-300 pt-3 text-base font-bold text-black">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {step === 2 && (
            <Button size="lg" fullWidth className="mt-5" onClick={placeOrderAction} disabled={!canPlace || processing}>
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />{" "}
                  {onlinePayment ? "Submitting for verification..." : "Processing payment..."}
                </>
              ) : onlinePayment ? (
                `Submit for Verification · ${formatPrice(total)}`
              ) : (
                `Place Order · ${formatPrice(total)}`
              )}
            </Button>
          )}
          {step === 0 && (
            <Button size="lg" fullWidth className="mt-5" onClick={() => setStep(1)} disabled={!selectedAddress}>
              Continue
            </Button>
          )}
          {step === 1 && (
            <Button size="lg" fullWidth className="mt-5" onClick={() => setStep(2)}>
              Continue to Payment
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function formatAddress(a: Address): string {
  return [a.name, a.line1, a.line2, a.landmark, a.city, a.state + " - " + a.pincode]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutInner />
    </RequireAuth>
  );
}