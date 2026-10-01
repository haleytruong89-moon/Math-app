import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasPublicEnv, publicEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/login"];
const OPEN_PATHS = ["/api/cron"]; // authenticated by CRON_SECRET, not by session

/**
 * Optimistic check only: refresh the Supabase session cookie and send
 * signed-out visitors to /login. Real authorization (role, locked account)
 * happens in the Data Access Layer (src/lib/dal.ts).
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (OPEN_PATHS.some((p) => path.startsWith(p))) return NextResponse.next();
  if (!hasPublicEnv()) return NextResponse.next(); // not configured yet → pages show setup notice

  let response = NextResponse.next({ request });
  const { url, key } = publicEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!signedIn && !isPublic) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
