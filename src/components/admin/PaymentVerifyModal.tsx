"use client";

import { useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import type { AdminPayment } from "@/lib/adminTypes";
import { useAdmin } from "@/context/AdminContext";
import { formatPrice } from "@/lib/utils";

interface PaymentVerifyModalProps {
  payment: AdminPayment | null;
  onClose: () => void;
  /** Open directly on the rejection drawer (used by the inline Reject button). */
  initialRejecting?: boolean;
}

export function PaymentVerifyModal({
  payment,
  onClose,
  initialRejecting = false,
}: PaymentVerifyModalProps) {
  const { verifyPayment, rejectPayment, settings } = useAdmin();
  const [rejecting, setRejecting] = useState(initialRejecting);
  const [rejectionReason, setRejectionReason] = useState("UTR not found in merchant bank statement");
  const [customReason, setCustomReason] = useState("");
  const [imageExpanded, setImageExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!payment) return null;

  // Only a payment awaiting verification can be accepted or rejected; a payment
  // that is already verified/rejected is shown read-only.
  const canDecide = payment.status === "pending_verification";

  const handleApprove = async () => {
    if (processing) return;
    setProcessing(true);
    const ok = await verifyPayment(payment.orderId, payment.id);
    setProcessing(false);
    if (ok) onClose();
  };

  const handleReject = async () => {
    if (processing) return;
    const finalReason = rejectionReason === "custom" ? customReason : rejectionReason;
    if (!finalReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setProcessing(true);
    const ok = await rejectPayment(payment.orderId, payment.id, finalReason);
    setProcessing(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-black">UTR Payment Verification Queue</h2>
              <p className="text-xs text-neutral-500">Order #{payment.orderId} • Merchant UPI Settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Duplicate UTR Flag Alert */}
          {payment.isDuplicateUtr && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <AlertOctagon className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">
                  CRITICAL: Duplicate UTR Reference Flagged
                </p>
                <p className="text-xs text-rose-700 mt-1">
                  This exact UTR number (<strong>{payment.utrNumber}</strong>) was already submitted on
                  order <strong>#{payment.duplicateOrderId}</strong>. Verify against your merchant bank statement
                  before approving.
                </p>
              </div>
            </div>
          )}

          {/* Payment Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <div>
                <p className="text-xs text-neutral-500 font-medium">Customer Submitted UTR</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-base font-bold text-black bg-white px-2.5 py-1 rounded-md border border-neutral-300 tracking-wider">
                    {payment.utrNumber}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    ({payment.utrNumber?.length ?? 0} Digits)
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-neutral-500 font-medium">Exact Payable Amount</p>
                <p className="text-xl font-extrabold text-black font-mono mt-0.5">{formatPrice(payment.amount)}</p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 font-medium">Submitted At</p>
                <div className="flex items-center gap-1.5 text-xs text-neutral-700 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{new Date(payment.submittedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <div>
                <p className="text-xs text-neutral-500 font-medium">Customer Name</p>
                <div className="flex items-center gap-1.5 text-black font-semibold mt-0.5">
                  <User className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{payment.customerName}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-neutral-500 font-medium">Customer Phone</p>
                <div className="flex items-center gap-1.5 text-black font-mono text-xs mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{payment.customerPhone}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-neutral-500 font-medium">Target Merchant UPI ID</p>
                <p className="text-xs text-black font-mono font-semibold mt-0.5">{settings.upiId}</p>
              </div>
            </div>
          </div>

          {/* Payment Proof Screenshot */}
          {payment.screenshotUrl ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700">
                  Payment Proof Screenshot (Uploaded by Customer)
                </span>
                <button
                  onClick={() => setImageExpanded(!imageExpanded)}
                  className="text-xs text-black font-semibold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>{imageExpanded ? "Collapse" : "Expand Image"}</span>
                </button>
              </div>
              <div
                className={`overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all ${
                  imageExpanded ? "max-h-96" : "max-h-48"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={payment.screenshotUrl}
                  alt="Payment screenshot receipt"
                  className="w-full object-cover cursor-pointer hover:opacity-95"
                  onClick={() => setImageExpanded(!imageExpanded)}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span>No optional screenshot attached. Verify via bank statement statement check.</span>
            </div>
          )}

          {/* Rejection Form Drawer */}
          {rejecting && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-3 animate-slide-up">
              <p className="font-bold text-rose-900 text-xs uppercase tracking-wider">
                Specify Rejection Reason (Notified to Customer)
              </p>

              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-rose-500 focus:outline-none"
              >
                <option value="UTR not found in merchant bank statement">
                  UTR not found in merchant bank statement
                </option>
                <option value="Incorrect amount received in transaction">
                  Incorrect amount received in transaction
                </option>
                <option value="Duplicate UTR reference detected on another order">
                  Duplicate UTR reference detected on another order
                </option>
                <option value="UTR transaction was reversed / failed on bank end">
                  UTR transaction was reversed / failed on bank end
                </option>
                <option value="custom">Enter custom reason...</option>
              </select>

              {rejectionReason === "custom" && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Explain why this payment cannot be approved..."
                  className="w-full rounded-md border border-neutral-300 bg-white p-2 text-xs text-black focus:border-rose-500 focus:outline-none"
                />
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejecting(false)}
                  className="px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60 text-xs font-semibold text-white shadow-xs"
                >
                  {processing ? "Processing…" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 sm:px-6 py-4">
          <div className="text-xs text-neutral-500">
            Status:{" "}
            <span className="font-bold capitalize text-amber-700">
              {payment.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {!canDecide ? (
              <span className="text-xs font-semibold text-neutral-500">
                {payment.status === "verified"
                  ? "Payment already verified"
                  : payment.status === "rejected"
                  ? "Payment already rejected"
                  : "No action required"}
              </span>
            ) : (
              <>
                {!rejecting && (
                  <button
                    onClick={() => setRejecting(true)}
                    disabled={processing}
                    className="flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Payment</span>
                  </button>
                )}

                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex items-center gap-1.5 rounded-md bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{processing ? "Processing…" : "Verify & Approve Payment"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
