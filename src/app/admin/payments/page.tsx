"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Search,
  XCircle,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice, handleImageError } from "@/lib/utils";
import type {
  AdminPayment,
  AdminPaymentVerification,
  PaymentVerificationStatus,
} from "@/lib/adminTypes";
import { PaymentVerifyModal } from "@/components/admin/PaymentVerifyModal";

const REJECTION_REASONS = [
  "UTR not found in merchant bank statement",
  "Incorrect amount received in transaction",
  "Duplicate UTR reference detected on another order",
  "UTR transaction was reversed / failed on bank end",
];

/**
 * The complete delivery address captured with a checkout submission —
 * recipient, contact and every address line. Wrapped (never truncated) so long
 * street addresses stay readable before the admin decides.
 */
function VerificationAddress({
  shipping,
  wide = false,
}: {
  shipping?: AdminPaymentVerification["shipping"] | null;
  wide?: boolean;
}) {
  if (!shipping?.name) {
    return <span className="text-[11px] italic text-neutral-400">Not provided</span>;
  }
  const street = [shipping.line1, shipping.line2, shipping.landmark].filter(Boolean).join(", ");
  const statePin =
    shipping.state && shipping.pincode
      ? `${shipping.state} - ${shipping.pincode}`
      : shipping.state || shipping.pincode || "";
  const locality = [shipping.city, statePin].filter(Boolean).join(", ");

  return (
    <div
      className={`break-words text-[11px] leading-relaxed text-neutral-700 ${
        wide ? "w-full" : "min-w-[170px] max-w-[240px]"
      }`}
    >
      <p className="font-semibold text-black">{shipping.name}</p>
      <p className="font-mono text-neutral-600">{shipping.phone}</p>
      {street && <p className="mt-1">{street}</p>}
      {locality && <p>{locality}</p>}
    </div>
  );
}

export default function AdminPaymentsPage() {
  const {
    payments,
    paymentVerifications,
    products,
    exportToCsv,
    settings,
    verifyPayment,
    approvePaymentVerification,
    rejectPaymentVerification,
  } = useAdmin();
  const [activeTab, setActiveTab] = useState<PaymentVerificationStatus | "all">(
    "pending_verification"
  );
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  // Which row is mid-verification, so its buttons disable and cannot double-fire.
  const [busyId, setBusyId] = useState<string | null>(null);
  // Open the modal directly on its rejection drawer when Reject is clicked inline.
  const [autoReject, setAutoReject] = useState(false);

  // ---- Pre-order checkout submissions (UTR entered BEFORE any order exists) ----
  const pendingVerifications = useMemo(
    () => paymentVerifications.filter((v) => v.status === "pending"),
    [paymentVerifications]
  );
  // Approved / rejected submissions stay visible (with their saved delivery
  // address) so every decision can be reviewed without digging through orders.
  const decidedVerifications = useMemo(
    () => paymentVerifications.filter((v) => v.status !== "pending"),
    [paymentVerifications]
  );
  const pendingVerificationsTotal = useMemo(
    () => pendingVerifications.reduce((s, v) => s + v.amount, 0),
    [pendingVerifications]
  );
  // Which submission is mid-decision, so its buttons disable and cannot double-fire.
  const [busyVerificationId, setBusyVerificationId] = useState<string | null>(null);
  const [rejectingVerificationId, setRejectingVerificationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState("");

  const handleApproveVerification = async (v: AdminPaymentVerification) => {
    if (busyVerificationId) return;
    setBusyVerificationId(v.id);
    try {
      await approvePaymentVerification(v.id);
    } finally {
      setBusyVerificationId(null);
    }
  };

  const handleRejectVerification = async (v: AdminPaymentVerification) => {
    if (busyVerificationId) return;
    const reason = rejectReason === "custom" ? customRejectReason.trim() : rejectReason;
    if (!reason) return;
    setBusyVerificationId(v.id);
    try {
      const ok = await rejectPaymentVerification(v.id, reason);
      if (ok) {
        setRejectingVerificationId(null);
        setCustomRejectReason("");
      }
    } finally {
      setBusyVerificationId(null);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchTab = activeTab === "all" || p.status === activeTab;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.orderId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q) ||
        (p.utrNumber ?? "").includes(q);
      return matchTab && matchSearch;
    });
  }, [payments, activeTab, search]);

  const verifiedTotal = useMemo(
    () => payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  // Matches the shared pendingPaymentCount: awaiting UTR + awaiting verification.
  const pendingPayments = useMemo(
    () =>
      payments.filter(
        (p) => p.status === "pending_verification" || p.status === "awaiting_reference"
      ),
    [payments]
  );

  const pendingTotal = useMemo(
    () => pendingPayments.reduce((s, p) => s + p.amount, 0),
    [pendingPayments]
  );

  const duplicateFlagsCount = useMemo(
    () => payments.filter((p) => p.isDuplicateUtr).length,
    [payments]
  );

  // "All Paid" = every payment the team has verified/approved.
  const verifiedCount = useMemo(
    () => payments.filter((p) => p.status === "verified").length,
    [payments]
  );

  const handleExportCsv = () => {
    const data = filteredPayments.map((p) => ({
      Payment_ID: p.id,
      Order_ID: p.orderId,
      Customer: p.customerName,
      Phone: p.customerPhone,
      Amount: p.amount,
      UTR_Number: p.utrNumber,
      Status: p.status,
      Is_Duplicate_UTR: p.isDuplicateUtr ? "YES" : "NO",
      Submitted_At: p.submittedAt,
      Verified_At: p.verifiedAt || "N/A",
      Verified_By: p.verifiedBy || "N/A",
      Rejection_Reason: p.rejectionReason || "N/A",
    }));
    exportToCsv(data, "Miracle_Payments_Reconciliation");
  };

  // Inline ACCEPT — reuses the existing adminVerifyPayment path via AdminContext.
  const handleAccept = async (p: AdminPayment) => {
    if (busyId) return;
    setBusyId(p.id);
    try {
      await verifyPayment(p.orderId, p.id);
    } finally {
      setBusyId(null);
    }
  };

  // Inline REJECT — open the modal on its rejection drawer so a reason is captured.
  const openReject = (p: AdminPayment) => {
    setAutoReject(true);
    setSelectedPayment(p);
  };

  const openDetails = (p: AdminPayment) => {
    setAutoReject(false);
    setSelectedPayment(p);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-black" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
              Merchant QR & UTR Verification Queue
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Manual bank statement verification, duplicate UTR detection and payment reconciliation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4 text-black" />
            <span>Export Reconciliation CSV</span>
          </button>
        </div>
      </div>

      {/* Pre-order checkout submissions — NO order exists until accepted */}
      {pendingVerifications.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-white overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold text-amber-900">
                Checkout submissions awaiting approval ({pendingVerifications.length})
              </h2>
              <p className="text-[11px] text-amber-700 mt-0.5">
                No order exists yet. Accepting places the order exactly once; rejecting places no
                order and restores the customer&apos;s cart.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
              {formatPrice(pendingVerificationsTotal)} pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Delivery Address</th>
                  <th className="p-4">UTR Reference</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pendingVerifications.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/80 transition-colors align-top">
                    <td className="p-4 font-sans text-neutral-600 whitespace-nowrap">
                      <p className="flex items-center gap-1.5 font-semibold text-black">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(v.submittedAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-0.5 text-[11px] font-mono">{v.id}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-black">{v.customerName}</p>
                      <p className="text-neutral-500 font-mono text-[11px]">{v.customerPhone}</p>
                      {v.customerEmail && (
                        <p className="text-neutral-500 text-[11px]">{v.customerEmail}</p>
                      )}
                    </td>

                    <td className="p-4">
                      <VerificationAddress shipping={v.shipping} />
                    </td>

                    <td className="p-4">
                      <span className="inline-block font-mono font-bold text-black text-sm tracking-wide bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                        {v.utrNumber}
                      </span>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {v.paymentMethod}
                        {v.coupon ? ` · Coupon ${v.coupon}` : ""}
                      </p>
                    </td>

                    <td className="p-4">
                      <ul className="space-y-0.5 text-[11px] text-neutral-700">
                        {v.items.slice(0, 4).map((i, idx) => (
                          <li key={`${v.id}-${i.product_id}-${idx}`}>
                            <span className="font-semibold text-black">
                              {products.find((p) => p.id === i.product_id)?.name ?? i.product_id}
                            </span>{" "}
                            × {i.quantity}
                            {i.size ? ` · ${i.size}` : ""}
                            {i.color ? ` · ${i.color}` : ""}
                          </li>
                        ))}
                        {v.items.length > 4 && (
                          <li className="text-neutral-500">+{v.items.length - 4} more</li>
                        )}
                      </ul>
                    </td>

                    <td className="p-4 font-mono font-extrabold text-black text-sm whitespace-nowrap">
                      {formatPrice(v.amount)}
                    </td>

                    <td className="p-4">
                      {rejectingVerificationId === v.id ? (
                        <div className="flex flex-col items-end gap-1.5 min-w-[240px]">
                          <select
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-black focus:border-rose-500 focus:outline-none"
                          >
                            {REJECTION_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                            <option value="custom">Enter custom reason…</option>
                          </select>
                          {rejectReason === "custom" && (
                            <input
                              value={customRejectReason}
                              onChange={(e) => setCustomRejectReason(e.target.value)}
                              placeholder="Rejection reason (required)"
                              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-black focus:border-rose-500 focus:outline-none"
                            />
                          )}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setRejectingVerificationId(null)}
                              disabled={busyVerificationId !== null}
                              className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRejectVerification(v)}
                              disabled={
                                busyVerificationId !== null ||
                                (rejectReason === "custom" && !customRejectReason.trim())
                              }
                              className="rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-3 py-1.5 font-semibold text-white text-xs shadow-xs transition-colors"
                            >
                              {busyVerificationId === v.id ? "Rejecting…" : "Confirm Reject"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleApproveVerification(v)}
                            disabled={busyVerificationId !== null}
                            className="flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-1.5 font-semibold text-white text-xs shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{busyVerificationId === v.id ? "Approving…" : "Accept & Place Order"}</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingVerificationId(v.id);
                              setRejectReason(REJECTION_REASONS[0]);
                              setCustomRejectReason("");
                            }}
                            disabled={busyVerificationId !== null}
                            className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 px-3 py-1.5 font-semibold text-rose-700 text-xs transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decided checkout submissions — approved (order created exactly once)
          and rejected (no order) — each with the delivery address it was
          submitted with. */}
      {decidedVerifications.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
            <h2 className="text-sm font-extrabold text-black">
              Decided checkout submissions ({decidedVerifications.length})
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Approved submissions placed their order exactly once; rejected ones placed no order.
            </p>
          </div>
          <ul className="divide-y divide-neutral-100">
            {decidedVerifications.map((v) => (
              <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold border ${
                        v.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {v.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                    <span className="font-mono font-bold text-black">{v.utrNumber}</span>
                    <span className="text-neutral-500">{formatPrice(v.amount)}</span>
                    {v.status === "approved" && v.orderId && (
                      <span className="font-mono text-neutral-600">Order {v.orderId}</span>
                    )}
                  </p>
                  <VerificationAddress shipping={v.shipping} wide />
                  {v.status === "rejected" && v.rejectionReason && (
                    <p className="text-[11px] text-rose-600">Reason: {v.rejectionReason}</p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-neutral-500">
                  {new Date(v.submittedAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            All Paid
          </p>
          <p className="text-xl font-extrabold text-black mt-1 font-mono">{verifiedCount}</p>
          <span className="text-[10px] text-neutral-500">orders with verified payment</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Pending Queue Value
          </p>
          <p className="text-xl font-extrabold text-amber-700 mt-1 font-mono">{formatPrice(pendingTotal)}</p>
          <span className="text-[10px] text-neutral-500">
            {pendingPayments.length} orders awaiting payment or bank check
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Settled / Verified Amount
          </p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">
            {formatPrice(verifiedTotal)}
          </p>
          <span className="text-[10px] text-neutral-500">Credited to {settings.upiId}</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Duplicate UTR Flags
          </p>
          <p className="text-xl font-extrabold text-rose-700 mt-1 font-mono">
            {duplicateFlagsCount} Intercepted
          </p>
          <span className="text-[10px] text-neutral-500">Prevented double order fulfillment</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "awaiting_reference", label: "Awaiting Payment" },
            { id: "pending_verification", label: "Pending Verification" },
            { id: "verified", label: "Verified & Approved" },
            { id: "rejected", label: "Rejected Payments" },
            { id: "all", label: "All Payments" },
          ].map((tab) => {
            const count =
              tab.id === "all"
                ? payments.length
                : payments.filter((p) => p.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PaymentVerificationStatus | "all")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-black text-white shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search UTR, order ID, customer name..."
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 pl-9 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      {/* Payments Verification Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-4">Order & Time</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Customer UTR Reference</th>
                <th className="p-4">Payable Amount</th>
                <th className="p-4">Proof Screenshot</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-4 font-mono">
                      <p className="font-bold text-black text-sm">#{p.orderId}</p>
                      <p className="text-neutral-500 text-[11px] font-sans mt-0.5">
                        {new Date(p.submittedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </td>

                    <td className="p-4 text-black">
                      <p className="font-semibold text-black">{p.customerName}</p>
                      <p className="text-neutral-500 font-mono text-[11px]">{p.customerPhone}</p>
                    </td>

                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-2">
                        {p.utrNumber ? (
                          <span className="font-bold text-black text-sm tracking-wide bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                            {p.utrNumber}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px] italic">Not submitted yet</span>
                        )}
                        {p.isDuplicateUtr && (
                          <span className="flex items-center gap-1 rounded bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[10px] font-bold border border-rose-200 font-sans">
                            <AlertOctagon className="h-3 w-3" />
                            <span>DUPLICATE</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-mono font-extrabold text-black text-sm">
                      {formatPrice(p.amount)}
                    </td>

                    <td className="p-4">
                      {p.screenshotUrl ? (
                        <div
                          onClick={() => setSelectedPayment(p)}
                          className="flex items-center gap-1.5 text-xs text-black font-semibold hover:underline cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.screenshotUrl}
                            alt="Receipt"
                            onError={handleImageError}
                            className="h-8 w-8 rounded object-cover border border-neutral-200"
                          />
                          <span>View Receipt</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">No image attached</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                          p.status === "verified"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {p.status === "awaiting_reference"
                          ? "Awaiting UTR"
                          : p.status === "pending_verification"
                          ? "Pending Verification"
                          : p.status === "verified"
                          ? `Verified by ${p.verifiedBy || "Staff"}`
                          : "Rejected"}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      {p.status === "awaiting_reference" ? (
                        <span className="text-neutral-400 text-[11px] italic">Awaiting customer UTR</span>
                      ) : p.status === "pending_verification" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAccept(p)}
                            disabled={busyId !== null}
                            className="flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-1.5 font-semibold text-white text-xs shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{busyId === p.id ? "Accepting…" : "Accept"}</span>
                          </button>
                          <button
                            onClick={() => openReject(p)}
                            disabled={busyId !== null}
                            className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 px-3 py-1.5 font-semibold text-rose-700 text-xs transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => openDetails(p)}
                            className="rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 px-3 py-1.5 font-semibold text-black text-xs transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openDetails(p)}
                          className="rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 px-3 py-1 font-semibold text-black text-xs transition-colors"
                        >
                          Audit Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    {activeTab === "pending_verification" &&
                    payments.some((p) => p.status === "awaiting_reference") ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-black">No UTRs awaiting verification</p>
                        <p className="text-xs">
                          {payments.filter((p) => p.status === "awaiting_reference").length} order(s)
                          are waiting for the customer to submit their bank reference. Open the{" "}
                          <button
                            onClick={() => setActiveTab("awaiting_reference")}
                            className="font-semibold text-black underline"
                          >
                            Awaiting Payment
                          </button>{" "}
                          tab. Accept / Reject appear here as soon as a customer submits a UTR.
                        </p>
                      </div>
                    ) : (
                      "No payment records found for the selected filter."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Verify Modal */}
      {selectedPayment && (
        <PaymentVerifyModal
          payment={selectedPayment}
          initialRejecting={autoReject}
          onClose={() => {
            setSelectedPayment(null);
            setAutoReject(false);
          }}
        />
      )}
    </div>
  );
}
