import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_DELIVERY, type DeliveryRules } from "./orders";
import { publicClient } from "@/utils/supabase/public";

// The delivery fee and free-delivery limit, cached like the products and cleared by refreshSettings when an admin saves.
export async function getDeliveryRules(): Promise<DeliveryRules> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");
  const { data, error } = await publicClient().from("store_settings").select("delivery_fee, free_delivery_from").eq("id", 1).maybeSingle();
  if (error || !data) return DEFAULT_DELIVERY;
  return { fee: data.delivery_fee, freeFrom: data.free_delivery_from };
}
