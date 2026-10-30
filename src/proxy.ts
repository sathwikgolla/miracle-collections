import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  RECOVERY_COOKIE,
  RECOVERY_COOKIE_MAX_AGE_SECONDS,
  createRecoveryToken,
} from "@/lib/recoveryMarker";

/**
 * Refreshes the Supabase auth session on every navigation.
 *
 * The browser session is cookie-based (`@supabase/ssr`). Access tokens expire,
 * and only the browser client can silently rotate them — so without this a
 * Server Component / Server Action could read an expired session and treat a
 * signed-in user (including the Super Admin) as anonymous. This is the
 * documented Supabase Next.js pattern and is what makes the server-side
 * `/admin` gate and `requireAdmin()` reliably see the real user.
 *
 * It performs NO authorization itself: /admin protection stays in
 * `src/app/admin/layout.tsx` + `requireAdmin()`, both of which re-check
 * `profiles.role` server-side.
 *
 * PASSWORD RECOVERY: this file also verifies the emailed recovery link
 * (`/reset-password?code=...`). Doing the PKCE exchange here — before the app
 * (and therefore before the browser Supabase client) loads — lets us prove
 * server-side that Supabase itself classified the link as a recovery
 * (`redirectType === "recovery"`). The old client-side check accepted any
 * existing session, which could change the wrong account's password. On
 * success we issue a short-lived, signed marker cookie bound to the user id;
 * the reset page and the update action both require it.
 *
 * NOTE: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`.
 * Both a named `proxy` export and a default export are provided.
 */

const RESET_PASSWORD_PATH = "/reset-password";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Completes a recovery link before the reset page renders. Returns null for
 * every request that is not a recovery callback, so normal navigation keeps
 * the plain session-refresh behaviour.
 */
async function handleRecoveryLink(
  request: NextRequest,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<NextResponse | null> {
  if (request.nextUrl.pathname !== RESET_PASSWORD_PATH) return null;

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const flowId = params.get("flow_id");
  const upstreamError =
    params.get("error_description") || params.get("error_code") || params.get("error");

  // No recovery payload: let the page decide (it requires the marker cookie).
  if (!code && !tokenHash && !upstreamError) return null;

  const target = request.nextUrl.clone();
  target.search = "";

  if (upstreamError) {
    // `reason` (not `error`) so our own marker never re-enters this branch and
    // loops the redirect.
    target.searchParams.set("reason", "link_invalid");
    return NextResponse.redirect(target, 303);
  }

  // Collect the cookies Supabase writes during the exchange (session tokens,
  // PKCE verifier cleanup) so they can be attached to the redirect response.
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) =>
          cookiesToSet.push({ name, value, options })
        );
      },
    },
  });

  let verifiedUserId: string | null = null;

  try {
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined
      );
      // `redirectType` is returned at runtime but is missing from the auth-js
      // type for this method; read it through a narrow cast.
      const redirectType = (data as { redirectType?: string | null }).redirectType;
      // Only a recovery code may unlock the reset form. An OAuth/magic-link
      // code establishes a session too, but must never authorize a reset.
      if (!error && data.session?.user?.id && redirectType === "recovery") {
        verifiedUserId = data.session.user.id;
      }
    } else if (tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHash,
      });
      if (!error && data.session?.user?.id) verifiedUserId = data.session.user.id;
    }
  } catch {
    verifiedUserId = null;
  }

  if (!verifiedUserId) {
    // Expired, already used, malformed, or opened in a browser that does not
    // hold the PKCE verifier. Never fall back to an existing session.
    target.searchParams.set("reason", "link_invalid");
    return NextResponse.redirect(target, 303);
  }

  const response = NextResponse.redirect(target, 303);
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );

  const recoveryToken = await createRecoveryToken(verifiedUserId);
  if (recoveryToken) {
    response.cookies.set(RECOVERY_COOKIE, recoveryToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: RECOVERY_COOKIE_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Never take the whole app down over a missing env var — the pages and
  // client modules already fail loudly at their point of use.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  const recoveryResponse = await handleRecoveryLink(
    request,
    supabaseUrl,
    supabaseAnonKey
  );
  if (recoveryResponse) return recoveryResponse;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: this call refreshes the session token when needed. Do not
  // replace it with getSession(), which does not reliably revalidate the token.
  // Fail open: a transient Supabase/network outage must not 500 every route.
  try {
    await supabase.auth.getUser();
  } catch {
    return NextResponse.next({ request });
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Run on all routes except Next.js internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
