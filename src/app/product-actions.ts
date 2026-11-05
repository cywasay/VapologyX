"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "../utils/supabase/server";

// Clears the shop's product cache after an admin saves. Anyone can call a server action,
// so it checks the verified login. The changes themselves are protected by the database rules.
export async function refreshShop() {
  const { data } = await createClient(await cookies()).auth.getClaims();
  if (data?.claims?.app_metadata?.role !== "admin") return { ok: false };
  updateTag("products");
  return { ok: true };
}
