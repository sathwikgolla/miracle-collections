"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/utils";
import { passwordRecoveryRedirectUrl } from "@/lib/passwordRecovery";

/** Seconds the customer must wait before requesting another email. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Detect Supabase's (or a proxy's) rate-limit style failures so we can show a
 * friendly message instead of the raw error. Everything else falls through to
 * a generic message — we never reveal whether an account exists.
 */
function isRateLimitMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("security purposes") ||
    m.includes("too many requests") ||
    m.includes("429")
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Drives the resend cooldown countdown on the confirmation view.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const send = async (rawEmail: string) => {
    const value = rawEmail.trim();
    if (!isValidEmail(value)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError(null);
    setFormError(null);
    setPending(true);
    try {
      // Sends a secure recovery link through Supabase Auth (custom SMTP via
      // Resend). Supabase returns success even for unknown addresses, so the
      // confirmation below stays neutral and reveals nothing about accounts.
      const { error } = await supabase.auth.resetPasswordForEmail(value, {
        redirectTo: passwordRecoveryRedirectUrl(),
      });
      if (error) {
        if (isRateLimitMessage(error.message)) {
          setFormError(
            "Too many recovery requests. Please wait a minute before trying again."
          );
        } else {
          setFormError("We couldn't send the recovery email right now. Please try again.");
        }
        return;
      }
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setFormError("We couldn't send the recovery email right now. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(email);
  };

  const inputCls =
    "h-12 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-black outline-none transition-colors focus:border-black";
  const labelCls = "mb-1.5 block text-sm font-medium text-black";

  if (sent) {
    return (
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
          <MailCheck size={22} className="text-black" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-black">
          Check your email
        </h1>
        {/* Neutral wording: never confirms whether the account exists. */}
        <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
          If an account exists for <span className="font-bold text-black">{email.trim()}</span>,
          a password recovery link has been sent. It may take a few minutes to arrive —
          please also check your spam folder.
        </p>

        {formError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
            {formError}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void send(email)}
            disabled={pending || cooldown > 0}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white text-sm font-bold text-black transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <Loader2 size={16} className="animate-spin" />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : pending ? "Sending..." : "Resend email"}
          </button>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800"
          >
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold text-black">Forgot password?</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Enter your registered email address and we&apos;ll send you a secure link to set a new
        password.
      </p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="recovery-email" className={labelCls}>
            Email address
          </label>
          <input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            className={inputCls}
          />
          {emailError && (
            <p className="mt-1.5 text-xs text-red-600">{emailError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Sending..." : "Send recovery link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-black hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
