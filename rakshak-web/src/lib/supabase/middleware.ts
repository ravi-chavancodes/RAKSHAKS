import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

function isResponderPath(pathname: string): boolean {
  return pathname === "/responder" || pathname.startsWith("/responder/");
}

function isAdminPath(pathname: string): boolean {
  if (pathname === "/admin/login") {
    return false;
  }
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isUserDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Always validate the session with the Auth server via getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const requiresResponder = isResponderPath(pathname);
  const requiresAdmin = isAdminPath(pathname);
  const requiresUserDashboard = isUserDashboardPath(pathname);

  if (!requiresResponder && !requiresAdmin && !requiresUserDashboard) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = requiresAdmin ? "/admin/login" : "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = "/unauthorized";
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Strict portal isolation:
  // - Admin cannot access the user dashboard (/dashboard)
  // - Non-admin cannot access /admin
  // - Only responder or admin can access /responder
  if (requiresAdmin && profile.role !== "admin") {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = "/unauthorized";
    return NextResponse.redirect(unauthorizedUrl);
  }

  if (requiresUserDashboard && profile.role === "admin") {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = "/unauthorized";
    return NextResponse.redirect(unauthorizedUrl);
  }

  if (requiresResponder && profile.role !== "responder" && profile.role !== "admin") {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = "/unauthorized";
    return NextResponse.redirect(unauthorizedUrl);
  }

  return supabaseResponse;
}
