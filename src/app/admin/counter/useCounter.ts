"use client";

import { useState } from "react";
import { SAMPLE_BOTTLES, SAMPLE_ITEMS } from "./sampleData";
import type { Bottle, CounterItem, Pay } from "./types";

export const earnedFrom = (bottle: Bottle) => bottle.entries.reduce((sum, amount) => sum + amount, 0);

// All the counter's state in one place: the sale being rung up, stock, refill bottles and today's totals.
// It is sample data held in memory only, so a reload starts over.
export function useCounter() {
  const [items, setItems] = useState<CounterItem[]>(SAMPLE_ITEMS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pay, setPay] = useState<Pay>("Cash");
  const [bottles, setBottles] = useState<Bottle[]>(SAMPLE_BOTTLES);
  const [salesToday, setSalesToday] = useState({ total: 4500, count: 3 });
  const [refillsToday, setRefillsToday] = useState(700);
  const [note, setNote] = useState("");

  const lines = items.filter(item => cart[item.id]).map(item => ({ item, quantity: cart[item.id] }));
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const refillsAll = bottles.reduce((sum, bottle) => sum + earnedFrom(bottle), 0);

  function add(id: string) {
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    setNote("");
    if ((cart[id] ?? 0) >= item.stock) return;
    setCart(current => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }

  function setQuantity(id: string, quantity: number) {
    setCart(current => {
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(quantity, items.find(entry => entry.id === id)?.stock ?? 0);
      return next;
    });
  }

  function completeSale() {
    if (total === 0) {
      setNote("Tap an item to start a sale.");
      return;
    }
    setItems(current => current.map(item => ({ ...item, stock: item.stock - (cart[item.id] ?? 0) })));
    setSalesToday(current => ({ total: current.total + total, count: current.count + 1 }));
    setNote(`Sale of Rs ${total.toLocaleString("en-US")} saved (${pay}). Stock updated.`);
    setCart({});
  }

  function openBottle(itemId: string) {
    const item = items.find(entry => entry.id === itemId);
    if (!item || item.stock < 1) return;
    setItems(current => current.map(entry => entry.id === itemId ? { ...entry, stock: entry.stock - 1 } : entry));
    setBottles(current => [...current, { id: `r${Date.now()}`, flavor: item.name.replace(/ \d+ml$/, ""), openedOn: "Today", cost: item.price, entries: [], finished: false }]);
  }

  function addRefill(id: string, amount: number) {
    if (!Number.isInteger(amount) || amount < 1) return;
    setBottles(current => current.map(bottle => bottle.id === id ? { ...bottle, entries: [...bottle.entries, amount] } : bottle));
    setRefillsToday(current => current + amount);
  }

  function undoRefill(id: string) {
    const last = bottles.find(bottle => bottle.id === id)?.entries.at(-1);
    if (last === undefined) return;
    setBottles(current => current.map(bottle => bottle.id === id ? { ...bottle, entries: bottle.entries.slice(0, -1) } : bottle));
    setRefillsToday(current => Math.max(0, current - last));
  }

  const finishBottle = (id: string) => setBottles(current => current.map(bottle => bottle.id === id ? { ...bottle, finished: true } : bottle));

  return { items, lines, total, pay, setPay, add, setQuantity, completeSale, clearSale: () => setCart({}), note, bottles, salesToday, refillsToday, refillsAll, openBottle, addRefill, undoRefill, finishBottle };
}

export type Counter = ReturnType<typeof useCounter>;
