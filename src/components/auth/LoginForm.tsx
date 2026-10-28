"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { isValidIdentifier } from "@/lib/utils";
import { loginAction } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { toast, refreshAuth } = useStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>({});
  const [pending, startTransition] = useTransition();

  const validate = () => {
    const e: typeof errors = {};
    if (!identifier.trim()) e.identifier = "Email or mobile number is required";
    else if (!isValidIdentifier(identifier)) e.identifier = "Enter a valid email or 10-digit mobile number";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    // Sign-in runs as a Server Action so the password check, the role lookup
    // and the redirect all use the real session cookie in one server request.
    // On success the action redirects (admin → /admin, customer → `next`); we
    // only fall through here on failure.
    startTransition(async () => {
      const result = await loginAction(identifier, password, next);
      if (result && !result.success) {
        setErrors({ form: result.error });
        return;
      }
      // The session cookie is set. Reload the (persisted) provider's session
      // state so the navbar/account UI updates immediately, then navigate to
      // the server-resolved destination. `router.refresh()` drops the cached
      // server components so server-rendered routes (e.g. product detail)
      // re-render for the new session. No manual refresh required.
      await refreshAuth();
      toast("Logged in successfully");
      router.replace(result.destination || "/");
      router.refresh();
    });
  };

  const inputCls =
    "h-12 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-black outline-none transition-colors focus:border-black";
  const labelCls = "mb-1.5 block text-sm font-medium text-black";

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold text-black">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-500">Login to your account</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {errors.form && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
            {errors.form}
          </div>
        )}

        <div>
          <label htmlFor="identifier" className={labelCls}>
            Email or Mobile number
          </label>
          <input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or 9876543210"
            className={inputCls}
            autoComplete="username"
          />
          {errors.identifier && (
            <p className="mt-1.5 text-xs text-red-600">{errors.identifier}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className={labelCls}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-neutral-600 hover:text-black"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={inputCls}
              autoComplete="current-password"
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
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded accent-black"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="font-bold text-black hover:underline"
        >
          Create Account
        </Link>
      </p>
    </div>
  );
}