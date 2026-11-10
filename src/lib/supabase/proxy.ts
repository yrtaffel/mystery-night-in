import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Keeps the sign-in session fresh, and sends signed-out visitors to /signin.
export async function updateSession(request: NextRequest) {
  // Local design previews only (never in production): skip the sign-in check.
  if (process.env.NODE_ENV === "development" && process.env.PREVIEW_NO_AUTH === "1") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;
  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith("/signin") || path.startsWith("/auth") || path.startsWith("/play/") || path.startsWith("/rather/") || path === "/api/keepalive";

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  return response;
}
