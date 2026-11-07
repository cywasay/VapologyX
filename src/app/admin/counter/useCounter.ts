"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { counterApi, type Closing, type CounterState, type Reply } from "./counterApi";
import type { Bottle, CashOut, CounterItem, Expense, ExpenseKind, Pay, Sale } from "./types";

export const earnedFrom = (bottle: Bottle) => bottle.entries.reduce((sum, amount) => sum + amount, 0);

const swap = (bottles: Bottle[], next: Bottle) => bottles.map(bottle => bottle.id === next.id ? next : bottle);

// All the counter's state in one place: the sale being rung up, stock, today's sales, refill bottles and the cash drawer.
// The database holds the truth. Each action is saved first, and the screen changes only once the database has accepted it.
export function useCounter() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [items, setItems] = useState<CounterItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pay, setPay] = useState<Pay>("Cash");
  const [given, setGiven] = useState("");
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [refillsToday, setRefillsToday] = useState(0);
  const [refillsAll, setRefillsAll] = useState(0);
  const [opening, setOpening] = useState(0);
  const [cashOuts, setCashOuts] = useState<CashOut[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closed, setClosed] = useState(false);
  const [closing, setClosing] = useState<Closing | null>(null);
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);

  const apply = useCallback((state: CounterState) => {
    setItems(state.items);
    setSales(state.sales);
    setBottles(state.bottles);
    setRefillsToday(state.refillsToday);
    setRefillsAll(state.refillsAll);
    setOpening(state.opening);
    setCashOuts(state.cashOuts);
    setExpenses(state.expenses);
    setClosed(state.closed);
    setClosing(state.closing);
  }, []);

  const load = useCallback(async () => {
    const reply = await counterApi.state();
    if (!reply.ok) return setStatus("failed");
    apply(reply.data);
    setStatus("ready");
  }, [apply]);

  // Reloads the figures quietly, without the full-screen loader or an error screen.
  const refresh = useCallback(async () => {
    const reply = await counterApi.state();
    if (reply.ok) apply(reply.data);
  }, [apply]);

  useEffect(() => {
    let stale = false;
    counterApi.state().then(reply => {
      if (stale) return;
      if (!reply.ok) return setStatus("failed");
      apply(reply.data);
      setStatus("ready");
    });
    return () => { stale = true; };
  }, [apply]);

  // Runs one saved action at a time, so a double tap can't ring up the same thing twice.
  async function run<T>(action: () => Promise<Reply<T>>, onDone: (data: T) => void, onError?: (message: string) => void) {
    if (working.current) return false;
    working.current = true;
    setBusy(true);
    setProblem("");
    const reply = await action();
    working.current = false;
    setBusy(false);
    if (!reply.ok) {
      (onError ?? setProblem)(reply.error);
      refresh();
      return false;
    }
    onDone(reply.data);
    return true;
  }

  const lines = items.filter(item => cart[item.id]).map(item => ({ item, quantity: cart[item.id] }));
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

  const kept = sales.filter(sale => !sale.voided);
  const salesToday = { total: kept.reduce((sum, sale) => sum + sale.total, 0), count: kept.length };
  const byPay = (method: Pay) => kept.filter(sale => sale.pay === method).reduce((sum, sale) => sum + sale.total, 0);
  const cashOutTotal = cashOuts.reduce((sum, entry) => sum + entry.amount, 0);
  const expensesTotal = expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const drawerExpensesTotal = expenses.filter(entry => entry.fromDrawer).reduce((sum, entry) => sum + entry.amount, 0);
  // The cash that should be in the drawer: what it started with, cash sales and refills, less cash taken out and expenses paid from the till.
  const expectedCash = opening + byPay("Cash") + refillsToday - cashOutTotal - drawerExpensesTotal;

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
    const item = items.find(entry => entry.code !== "" && entry.code === code.trim());
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

  async function completeSale() {
    if (closed) return setNote("The day is closed. Sales are switched off.");
    if (total === 0) return setNote("Tap an item to start a sale.");
    if (pay === "Cash" && givenAmount > 0 && givenAmount < total) return setNote("The cash given is less than the total.");
    const bought = lines.map(({ item, quantity }) => ({ productId: item.id, quantity }));
    await run(
      () => counterApi.sell(pay, pay === "Cash" && givenAmount > 0 ? givenAmount : null, bought),
      sale => {
        setItems(current => current.map(item => ({ ...item, stock: item.stock - (cart[item.id] ?? 0) })));
        setSales(current => [...current, sale]);
        setReceipt(sale);
        setNote("");
        clearSale();
      },
      setNote,
    );
  }

  // Cancels a sale made by mistake: the items go back on the shelf and the money leaves today's totals.
  async function voidSale(id: string) {
    await run(() => counterApi.voidSale(id), voided => {
      setItems(current => current.map(item => {
        const line = voided.lines.find(entry => entry.itemId === item.id);
        return line ? { ...item, stock: item.stock + line.quantity } : item;
      }));
      setSales(current => current.map(entry => entry.id === id ? voided : entry));
    });
  }

  async function openBottle(itemId: string) {
    await run(() => counterApi.openBottle(itemId), bottle => {
      setItems(current => current.map(entry => entry.id === itemId ? { ...entry, stock: entry.stock - 1 } : entry));
      setBottles(current => [...current, bottle]);
    });
  }

  async function addRefill(id: string, amount: number) {
    if (!Number.isInteger(amount) || amount < 1) return;
    await run(() => counterApi.addRefill(id, amount), bottle => {
      setBottles(current => swap(current, bottle));
      setRefillsToday(current => current + amount);
      setRefillsAll(current => current + amount);
    });
  }

  async function undoRefill(id: string) {
    const last = bottles.find(bottle => bottle.id === id)?.entries.at(-1);
    if (last === undefined) return;
    await run(() => counterApi.undoRefill(id), bottle => {
      setBottles(current => swap(current, bottle));
      setRefillsToday(current => Math.max(0, current - last));
      setRefillsAll(current => Math.max(0, current - last));
    });
  }

  const finishBottle = (id: string) => run(() => counterApi.finishBottle(id), bottle => setBottles(current => swap(current, bottle)));

  // The opening cash is typed freely, then saved once the field is left.
  // This doesn't take the "one action at a time" lock, so it never swallows the tap that made the field lose focus.
  const saveOpening = () => { counterApi.setOpening(opening).then(reply => { if (!reply.ok) setProblem(reply.error); }); };

  async function addCashOut(amount: number, text: string) {
    if (!Number.isInteger(amount) || amount < 1) return;
    await run(() => counterApi.addCashOut(amount, text), entry => setCashOuts(current => [...current, entry]));
  }

  async function addExpense(kind: ExpenseKind, amount: number, text: string, fromDrawer: boolean) {
    if (!Number.isInteger(amount) || amount < 1) return false;
    return run(() => counterApi.addExpense(kind, amount, text, fromDrawer), entry => setExpenses(current => [...current, entry]));
  }

  const removeExpense = (id: string) => run(() => counterApi.removeExpense(id), () => setExpenses(current => current.filter(entry => entry.id !== id)));

  const removeCashOut = (id: string) => run(() => counterApi.removeCashOut(id), () => setCashOuts(current => current.filter(entry => entry.id !== id)));

  // Saves the opening cash again first, so the closing sum always uses the figure on screen.
  const closeDay = (counted: number) => run(async () => {
    const saved = await counterApi.setOpening(opening);
    return saved.ok ? counterApi.closeDay(counted) : saved;
  }, result => {
    setClosing(result);
    setClosed(true);
  });

  return {
    status, reload: load, refresh, problem, dismissProblem: () => setProblem(""), busy,
    items, lines, total, pay, setPay, given, setGiven, change, add, scan, setQuantity, completeSale, clearSale, note,
    sales, salesToday, byPay, voidSale, receipt, closeReceipt: () => setReceipt(null), openReceipt: setReceipt,
    bottles, refillsToday, refillsAll, openBottle, addRefill, undoRefill, finishBottle,
    opening, setOpening, saveOpening, cashOuts, addCashOut, removeCashOut, cashOutTotal, expenses, expensesTotal, drawerExpensesTotal, addExpense, removeExpense, expectedCash,
    closed, closing, closeDay,
  };
}

export type Counter = ReturnType<typeof useCounter>;
