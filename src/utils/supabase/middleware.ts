import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const CACHE_HEADERS = ["cache-control", "expires", "pragma"];

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });

  // Refreshes an expiring login. Nothing may run between creating the client and this call.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAdmin = claims?.app_metadata?.role === "admin";
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie));
    CACHE_HEADERS.forEach(name => {
      const value = supabaseResponse.headers.get(name);
      if (value) response.headers.set(name, value);
    });
    return response;
  };

  // The dashboard is for admins only. Admin log in, register and forgot password stay open, but an admin who is already in goes straight to the dashboard.
  const inDashboard = ["/admin/dashboard", "/admin/counter"].some(base => pathname === base || pathname.startsWith(`${base}/`));
  if (pathname === "/admin" || pathname === "/admin/") return redirectTo(isAdmin ? "/admin/dashboard" : "/admin/login");
  if (inDashboard && !isAdmin) return redirectTo(claims ? "/" : "/admin/login");
  if (isAdmin && (pathname === "/login" || (pathname.startsWith("/admin/") && !inDashboard))) return redirectTo("/admin/dashboard");

  return supabaseResponse;
};
