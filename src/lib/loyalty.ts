// VapologyX Loyalty Club rules, as the owner set them (2026-11-26). The database checks the same rules
// (supabase/migrations/20261126100000_loyalty_club.sql), so change both together.
export const LOYALTY = {
  name: "VapologyX Loyalty Club",
  spendPerPoint: 100, // 1 point for every Rs 100 paid on full-price items
  pointValue: 1, // 1 point = Rs 1
  minToUse: 1000, // points can be used once a customer has 1,000
  maxShare: 0.2, // points pay at most 20% of a bill
  months: 12, // each batch of points lasts 12 months
};

export type LoyaltyChannel = "shop" | "online";

export const pointsFor = (fullPriceAmount: number) => Math.floor(Math.max(0, fullPriceAmount) / LOYALTY.spendPerPoint);

// How many points a bill may use: none below 1,000 points, otherwise up to 20% of the bill.
export const maxPointsFor = (bill: number, balance: number) => balance < LOYALTY.minToUse ? 0 : Math.min(balance, Math.floor(Math.max(0, bill) * LOYALTY.maxShare));

export const points = (value: number) => `${value.toLocaleString("en-US")} ${value === 1 ? "point" : "points"}`;
