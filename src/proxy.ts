import type { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only pages that use logins. The storefront stays static and never sends login cookies.
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
