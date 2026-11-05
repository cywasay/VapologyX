import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

// The link in a new customer's confirmation email lands here.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) await createClient(await cookies()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
}
