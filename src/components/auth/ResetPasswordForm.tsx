"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { passwordErrors } from "@/lib/utils";

type View = "form" | "done" | "tokenError";

type UpdatePasswordResult =
  | { success: true }
  | { success: false; error: string; field: "password" | "form" | "link" };

/**
 * Final step of the recovery flow.
 *
 * Whether this form is allowed to render at all is decided on the server
 * (`/reset-password` page + `src/proxy.ts`): the emailed Supabase recovery
 * code must have been verified server-side and be bound to the signed-in
 * account. This component never treats a pre-existing session as proof of a
 * recovery, which is what previously allowed the wrong account to be updated.
 *
 * The update itself runs in the `/api/auth/update-password` route handler,
 * which validates the password, calls Supabase Auth's `updateUser`, and
 * confirms the new password by signing in with it before reporting success.
 */
export function ResetPasswordForm({ initialError = null }: { initialError?: string | null }) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialError ? "tokenError" : "form");
  const [tokenError, setTokenError] = useState<string | null>(initialError);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string[]; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // After a confirmed update, send the customer to login so they sign in with
  // the password that was just proven to work.
  useEffect(() => {
    if (view !== "done") return;
    const timer = window.setTimeout(() => router.replace("/login?reset=success"), 2200);
    return () => window.clearTimeout(timer);
  }, [view, router]);

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
    startTransition(async () => {
      try {
        // Route handler (not a Server Action) so the password is never written
        // into Server Action arguments/dev logs.
        const response = await fetch("/api/auth/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ password, confirmPassword: confirm }),
        });

        const result = (await response.json().catch(() => null)) as
          | UpdatePasswordResult
          | null;

        if (!result) {
          setFormError(
            "We couldn't reach the server. Check your connection and try again."
          );
          return;
        }

        if (!result.success) {
          if (result.field === "link") {
            setTokenError(result.error);
            setView("tokenError");
          } else if (result.field === "password") {
            setErrors({ password: [result.error] });
          } else {
            setFormError(result.error);
          }
          return;
        }

        setPassword("");
        setConfirm("");
        setView("done");
      } catch {
        setFormError(
          "We couldn't reach the server. Check your connection and try again."
        );
      }
    });
  };

  const inputCls =
    "h-12 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-black outline-none transition-colors focus:border-black";
  const labelCls = "mb-1.5 block text-sm font-medium text-black";

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
          password. Taking you to the login page…
        </p>
        <Link
          href="/login?reset=success"
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
