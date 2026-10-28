"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { passwordErrors } from "@/lib/utils";

type View = "checking" | "form" | "done" | "tokenError";

/**
 * Reads the error Supabase appends when a recovery link is expired, invalid,
 * already used, or malformed — from either the query string (PKCE) or the
 * hash fragment (implicit) — so we can explain it in friendly language.
 */
function readTokenError(): string | null {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const raw =
    sp.get("error_description") ||
    hp.get("error_description") ||
    sp.get("error") ||
    hp.get("error");
  if (!raw) return null;
  const m = decodeURIComponent(raw).toLowerCase();
  if (m.includes("otp") || m.includes("expired") || m.includes("invalid") || m.includes("hash")) {
    return "This password reset link is invalid or has expired. Reset links can only be used once and expire after a short time.";
  }
  return "We couldn't verify this password reset link. Please request a new one.";
}

/**
 * Final step of the recovery flow: prove a valid recovery session exists
 * (the emailed link established it), then update the password through
 * Supabase Auth. The password never touches our database or any plaintext
 * store — `updateUser` hashes it inside Supabase Auth.
 */
export function ResetPasswordForm() {
  const [view, setView] = useState<View>("checking");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string[]; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Grace period: the Supabase browser client processes the link's tokens
    // (hash fragment or ?code=) shortly after mount, which fires
    // PASSWORD_RECOVERY on the listener below — don't show an error before
    // that had a chance to run.
    let errorTimer: number | undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (!cancelled) {
          window.clearTimeout(errorTimer);
          setTokenError(null);
          setView("form");
        }
      }
    });

    (async () => {
      try {
        // 1) Already-established session (the browser client auto-detects the
        //    emailed tokens on load — implicit #access_token or PKCE ?code=).
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setView("form");
          return;
        }

        // 2) PKCE fallback: exchange an un-consumed ?code= explicitly.
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!cancelled && !error) {
            setView("form");
            return;
          }
        }

        // 3) Neither worked: surface the link's own error if present, else
        //    wait briefly for a late PASSWORD_RECOVERY before giving up.
        const immediate = readTokenError();
        if (immediate) {
          setTokenError(immediate);
          setView("tokenError");
          return;
        }
        errorTimer = window.setTimeout(() => {
          if (cancelled) return;
          setTokenError(
            "We couldn't verify this password reset link. It may be expired, already used, or opened in a different browser. Please request a new one."
          );
          setView("tokenError");
        }, 1500);
      } catch {
        if (!cancelled) {
          setTokenError("Something went wrong while verifying the link. Please request a new one.");
          setView("tokenError");
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(errorTimer);
      subscription.unsubscribe();
    };
  }, []);

  const validate = () => {
    const e: { password?: string[]; confirm?: string } = {};
    const pw = passwordErrors(password);
    if (pw.length) e.password = pw;
    if (!confirm) e.confirm = "Please confirm your new password";
    else if (confirm !== password) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setFormError(null);
    setPending(true);
    (async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const m = (error.message ?? "").toLowerCase();
        if (m.includes("different from")) {
          setErrors({ password: ["Choose a password different from your current one"] });
        } else if (m.includes("should be at least") || m.includes("at least 6")) {
          setErrors({ password: ["Must be at least 8 characters"] });
        } else if (
          m.includes("jwt") ||
          m.includes("token") ||
          m.includes("session") ||
          m.includes("expired")
        ) {
          setView("tokenError");
          setTokenError(
            "This password reset link is invalid or has expired. Please request a new one."
          );
        } else {
          setFormError("We couldn't update your password. Please try again.");
        }
        return;
      }
      // Drop the consumed tokens from the address bar (single-use links)…
      window.history.replaceState({}, "", "/reset-password");
      setView("done");
    })().finally(() => setPending(false));
  };

  const inputCls =
    "h-12 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-black outline-none transition-colors focus:border-black";
  const labelCls = "mb-1.5 block text-sm font-medium text-black";

  if (view === "checking") {
    return (
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
        <Loader2 size={24} className="mx-auto animate-spin text-black" />
        <p className="mt-4 text-sm text-neutral-600">Verifying your reset link…</p>
      </div>
    );
  }

  if (view === "tokenError") {
    return (
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-black">
          Link not valid
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
          {tokenError}
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/forgot-password"
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800"
          >
            Request a new link
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white text-sm font-bold text-black transition-colors hover:border-black"
          >
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-black">
          Password updated
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
          Your password has been changed successfully. You can now sign in with your new
          password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800"
        >
          Continue to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold text-black">Set a new password</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Choose a strong password you haven&apos;t used before.
      </p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="new-password" className={labelCls}>
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password?.map((e) => (
            <p key={e} className="mt-1.5 text-xs text-red-600">
              {e}
            </p>
          ))}
        </div>

        <div>
          <label htmlFor="confirm-password" className={labelCls}>
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            className={inputCls}
          />
          {errors.confirm && (
            <p className="mt-1.5 text-xs text-red-600">{errors.confirm}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/login" className="font-bold text-black hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
