import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE, verifyRecoveryToken } from "@/lib/recoveryMarker";
import { passwordErrors } from "@/lib/utils";

/**
 * Password update for the recovery flow.
 *
 * A route handler (not a Server Action) so the submitted password is never
 * serialized into Server Action arguments, which Next.js prints in dev logs.
 * The body is validated, hashed by Supabase Auth's `updateUser`, and confirmed
 * by signing in with the new password before success is reported.
 *
 * The request must carry:
 *   1. a valid Supabase session (SSR cookie, validated with `getUser()`), and
 *   2. the short-lived signed marker set by `src/proxy.ts` only after Supabase
 *      verified an emailed recovery link, bound to the same user id.
 *
 * No password is written to our own tables, and no service-role credential is
 * ever sent to the browser.
 */

type UpdatePasswordResult =
  | { success: true }
  | { success: false; error: string; field: "password" | "form" | "link" };

const LINK_EXPIRED =
  "Your password reset session has expired. Please request a new reset link.";

const GENERIC_FAILURE =
  "We couldn't update your password. Please try again, or request a new reset link.";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

function fail(
  error: string,
  field: "password" | "form" | "link",
  status = 400
) {
  return NextResponse.json({ success: false, error, field }, { status, headers: NO_STORE });
}

function mapUpdateError(message: string, code?: string): UpdatePasswordResult {
  const m = (message ?? "").toLowerCase();

  if (code === "same_password" || m.includes("different from the old")) {
    return {
      success: false,
      field: "password",
      error: "Choose a password different from your current one.",
    };
  }
  if (
    code === "weak_password" ||
    m.includes("password should be at least") ||
    m.includes("weak")
  ) {
    return {
      success: false,
      field: "password",
      error:
        "That password does not meet the security requirements. Use at least 8 characters with a letter and a number.",
    };
  }
  if (
    code === "reauthentication_needed" ||
    code === "session_not_found" ||
    m.includes("session") ||
    m.includes("jwt") ||
    m.includes("token") ||
    m.includes("expired")
  ) {
    return { success: false, field: "link", error: LINK_EXPIRED };
  }
  return { success: false, field: "form", error: GENERIC_FAILURE };
}

export async function POST(request: NextRequest) {
  // Same-origin only. Session cookies are SameSite=Lax; this blocks a
  // cross-site form/fetch from using an existing recovery session. Compare the
  // Origin host with the request Host (rather than nextUrl.origin) so a
  // reverse proxy / custom domain cannot cause false rejections.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!originHost || !host || originHost !== host) {
      return fail("This request was blocked for security reasons.", "form", 403);
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite === "cross-site") {
    return fail("This request was blocked for security reasons.", "form", 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return fail("Invalid request.", "form", 415);
  }

  let body: { password?: unknown; confirmPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", "form", 400);
  }

  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  // Server-side validation (never rely on the client alone).
  const passwordIssues = passwordErrors(password);
  if (passwordIssues.length > 0) {
    return fail(passwordIssues[0], "password");
  }
  if (password !== confirmPassword) {
    return fail("Passwords do not match.", "password");
  }

  const cookieStore = await cookies();
  const marker = await verifyRecoveryToken(cookieStore.get(RECOVERY_COOKIE)?.value);
  if (!marker) {
    return fail(LINK_EXPIRED, "link", 401);
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return fail(LINK_EXPIRED, "link", 401);
  }
  // The recovery link and the session must belong to the same account.
  if (user.id !== marker.userId) {
    return fail(LINK_EXPIRED, "link", 401);
  }
  if (!user.email) {
    return fail(
      "This account has no email address, so its password cannot be reset here.",
      "form"
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    const mapped = mapUpdateError(updateError.message, updateError.code);
    return NextResponse.json(mapped, { status: 400, headers: NO_STORE });
  }

  // Confirm the change really took effect: sign in with the new password
  // against the SAME project/endpoint the login page uses. A throwaway,
  // non-persistent client keeps this away from the browser session.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return fail(
      "Password update could not be confirmed because the server is misconfigured. Please contact support.",
      "form",
      500
    );
  }

  const verifier = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: signIn, error: signInError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password,
  });

  // Discard only this throwaway session; never revoke the customer's sessions
  // on other devices.
  await verifier.auth.signOut({ scope: "local" }).catch(() => undefined);

  if (signInError || !signIn.user || signIn.user.id !== user.id) {
    return fail(
      "The password could not be confirmed with Supabase. Please try again, or request a new reset link.",
      "form",
      502
    );
  }

  // Consume the recovery proof so it cannot be replayed from this tab, and end
  // the recovery session so the customer signs in fresh.
  cookieStore.set(RECOVERY_COOKIE, "", { path: "/", maxAge: 0 });
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
