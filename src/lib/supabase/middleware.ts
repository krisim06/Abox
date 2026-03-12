import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a middleware-scoped client so auth cookies can be read/refreshed
  // on every request before route logic runs.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() ensures we operate on a validated auth session state.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate creator actions behind authentication.
  const protectedPaths = ["/upload", "/remix"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    // Preserve intended destination so sign-in can return users to their task.
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Prevent signed-in users from visiting auth entry pages again.
  const authPaths = ["/sign-in", "/sign-up"];
  const isAuthPage = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
