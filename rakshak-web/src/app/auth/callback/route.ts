import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function sanitizeNextPath(rawNext: string | null): string | null {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return null;
  }
  return rawNext;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const portal = searchParams.get("portal") === "admin" ? "admin" : "user";
  const explicitNext = sanitizeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  let authSuccess = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authSuccess = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    authSuccess = !error;
  }

  if (!authSuccess) {
    const failPath = portal === "admin" ? "/admin/login" : "/login";
    return NextResponse.redirect(`${origin}${failPath}?error=auth_callback_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const failPath = portal === "admin" ? "/admin/login" : "/login";
    return NextResponse.redirect(`${origin}${failPath}?error=auth_callback_failed`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "reporter";

  // Strict portal isolation: admin cannot log into user portal and vice versa
  if (portal === "admin" && role !== "admin") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=portal_mismatch`);
  }

  if (portal === "user" && role === "admin") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=portal_mismatch`);
  }

  if (explicitNext) {
    return NextResponse.redirect(`${origin}${explicitNext}`);
  }

  if (role === "admin") {
    return NextResponse.redirect(`${origin}/admin`);
  }

  if (role === "responder") {
    return NextResponse.redirect(`${origin}/responder`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
