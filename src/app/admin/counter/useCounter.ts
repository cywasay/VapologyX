"use client";

import { useState } from "react";
import { SAMPLE_BOTTLES, SAMPLE_ITEMS, SAMPLE_SALES } from "./sampleData";
import type { Bottle, CashOut, CounterItem, Pay, Sale } from "./types";

export const earnedFrom = (bottle: Bottle) => bottle.entries.reduce((sum, amount) => sum + amount, 0);

const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// All the counter's state in one place: the sale being rung up, stock, sales made today, refill bottles and the cash drawer.
// It is sample data held in memory only, so a reload starts over.
export function useCounter() {
  const [items, setItems] = useState<CounterItem[]>(SAMPLE_ITEMS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pay, setPay] = useState<Pay>("Cash");
  const [given, setGiven] = useState("");
  const [bottles, setBottles] = useState<Bottle[]>(SAMPLE_BOTTLES);
  const [sales, setSales] = useState<Sale[]>(SAMPLE_SALES);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [refillsToday, setRefillsToday] = useState(700);
  const [opening, setOpening] = useState(5000);
  const [cashOuts, setCashOuts] = useState<CashOut[]>([]);
  const [closed, setClosed] = useState(false);
  const [note, setNote] = useState("");

  const lines = items.filter(item => cart[item.id]).map(item => ({ item, quantity: cart[item.id] }));
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const refillsAll = bottles.reduce((sum, bottle) => sum + earnedFrom(bottle), 0);

  const kept = sales.filter(sale => !sale.voided);
  const salesToday = { total: kept.reduce((sum, sale) => sum + sale.total, 0), count: kept.length };
  const byPay = (method: Pay) => kept.filter(sale => sale.pay === method).reduce((sum, sale) => sum + sale.total, 0);
  const cashOutTotal = cashOuts.reduce((sum, entry) => sum + entry.amount, 0);
  // The cash that should be in the drawer: what it started with, cash sales, refills and cash taken out.
  const expectedCash = opening + byPay("Cash") + refillsToday - cashOutTotal;

  const givenAmount = Number(given.replace(/[,\s]/g, "")) || 0;
  const change = pay === "Cash" && givenAmount > 0 ? givenAmount - total : null;

  function add(id: string) {
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    setNote("");
    if ((cart[id] ?? 0) >= item.stock) return;
    setCart(current => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }

  // A scanner types the barcode into the search box and presses Enter. Returns the item's name, or null when no item has that code.
  function scan(code: string) {
    const item = items.find(entry => entry.code === code.trim());
    if (!item) return null;
    if (item.stock < 1) return `${item.name} is sold out`;
    add(item.id);
    return `Added ${item.name}`;
  }

  function setQuantity(id: string, quantity: number) {
    setCart(current => {
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(quantity, items.find(entry => entry.id === id)?.stock ?? 0);
      return next;
    });
  }

  function clearSale() {
    setCart({});
    setGiven("");
  }

  function completeSale() {
    if (closed) {
      setNote("The day is closed. Sales are switched off.");
      return;
    }
    if (total === 0) {
      setNote("Tap an item to start a sale.");
      return;
    }
    if (pay === "Cash" && givenAmount > 0 && givenAmount < total) {
      setNote("The cash given is less than the total.");
      return;
    }
    const sale: Sale = {
      id: `s-${Date.now()}`,
      number: sales.length + 1,
      time: clock(),
      lines: lines.map(({ item, quantity }) => ({ itemId: item.id, name: item.name, price: item.price, quantity })),
      total,
      pay,
      given: pay === "Cash" && givenAmount > 0 ? givenAmount : null,
      voided: false,
    };
    setItems(current => current.map(item => ({ ...item, stock: item.stock - (cart[item.id] ?? 0) })));
    setSales(current => [...current, sale]);
    setReceipt(sale);
    setNote("");
    clearSale();
  }

  // Cancels a sale made by mistake: the items go back on the shelf and the money leaves today's totals.
  function voidSale(id: string) {
    const sale = sales.find(entry => entry.id === id);
    if (!sale || sale.voided) return;
    setItems(current => current.map(item => {
      const line = sale.lines.find(entry => entry.itemId === item.id);
      return line ? { ...item, stock: item.stock + line.quantity } : item;
    }));
    setSales(current => current.map(entry => entry.id === id ? { ...entry, voided: true } : entry));
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
  const addCashOut = (amount: number, text: string) => { if (Number.isInteger(amount) && amount > 0) setCashOuts(current => [...current, { id: `o${Date.now()}`, amount, note: text.trim() || "Cash out" }]); };

  return {
    items, lines, total, pay, setPay, given, setGiven, change, add, scan, setQuantity, completeSale, clearSale, note,
    sales, salesToday, byPay, voidSale, receipt, closeReceipt: () => setReceipt(null), openReceipt: setReceipt,
    bottles, refillsToday, refillsAll, openBottle, addRefill, undoRefill, finishBottle,
    opening, setOpening, cashOuts, addCashOut, removeCashOut: (id: string) => setCashOuts(current => current.filter(entry => entry.id !== id)), cashOutTotal, expectedCash,
    closed, closeDay: () => setClosed(true),
  };
}

export type Counter = ReturnType<typeof useCounter>;
