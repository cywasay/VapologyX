"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Clears the shop's cached delivery rules after an admin saves them. Checks the verified login like refreshShop.
export async function refreshSettings() {
  const { data } = await createClient(await cookies()).auth.getClaims();
  if (data?.claims?.app_metadata?.role !== "admin") return { ok: false };
  updateTag("settings");
  return { ok: true };
}
