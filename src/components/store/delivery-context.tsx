"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_DELIVERY, type DeliveryRules } from "@/lib/orders";

const DeliveryContext = createContext<DeliveryRules>(DEFAULT_DELIVERY);

// The shop's delivery fee and free-delivery limit, read once by the store layout.
export function DeliveryProvider({ rules, children }: { rules: DeliveryRules; children: ReactNode }) {
  return <DeliveryContext.Provider value={rules}>{children}</DeliveryContext.Provider>;
}

export const useDelivery = () => useContext(DeliveryContext);
