import { useEffect, useState, useSyncExternalStore } from "react";
import { MAX_LINE_QUANTITY, PRODUCT_COLUMNS, money, orderLimit, varietyPrice, type Category, type Product, type Variety } from "./products";
import { publicClient } from "@/utils/supabase/public";

// The cart lives in this browser: it survives a reload and follows the visitor between tabs.
// Only what's needed to show a line is kept. Prices and stock are re-checked against the shop whenever the cart or checkout opens.
export type CartItem = Pick<Product, "id" | "slug" | "name" | "category" | "type" | "price" | "image_url" | "color" | "variants" | "stock">;
export type CartLine = { key: string; item: CartItem; variety: Variety | null; quantity: number };
export type AddResult = "added" | "limit" | "sold-out";

const STORAGE_KEY = "vx-cart-v1";
const CATEGORIES: Category[] = ["device", "disposable", "bottle", "coil"];
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let lines: CartLine[] | null = null;

export const cartKey = (productId: string, variety: Variety | null) => variety ? `${productId}:${variety.name}` : productId;
export const lineUnitPrice = (line: CartLine) => varietyPrice(line.item, line.variety);
export const lineName = (line: CartLine) => line.variety ? `${line.item.name} (${line.variety.name})` : line.item.name;
export const cartCount = (all: CartLine[]) => all.reduce((sum, line) => sum + line.quantity, 0);
export const cartSubtotal = (all: CartLine[]) => all.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0);

const isText = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function toVariety(value: unknown): Variety | null {
  const entry = value as { name?: unknown; price?: unknown } | null;
  return entry && isText(entry.name) ? { name: entry.name, price: isNumber(entry.price) ? entry.price : null } : null;
}

// Keeps just the fields a cart line needs, whatever object it is given.
function toItem(product: CartItem): CartItem {
  return { id: product.id, slug: product.slug, name: product.name, category: product.category, type: product.type, price: product.price, image_url: product.image_url, color: product.color, variants: product.variants, stock: product.stock ?? null };
}

// Saved carts come from the browser, so every line is checked before it is trusted.
function toLine(entry: unknown): CartLine | null {
  const raw = entry as { item?: Record<string, unknown>; variety?: unknown; quantity?: unknown } | null;
  const item = raw?.item;
  if (!raw || !item || !isText(item.id) || !isText(item.slug) || !isText(item.name) || !isNumber(item.price)) return null;
  const variety = raw.variety ? toVariety(raw.variety) : null;
  const clean: CartItem = {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: CATEGORIES.find(category => category === item.category) ?? "device",
    type: isText(item.type) ? item.type : "",
    price: item.price,
    image_url: isText(item.image_url) ? item.image_url : null,
    color: isText(item.color) ? item.color : "#e8f78b",
    variants: Array.isArray(item.variants) ? item.variants.flatMap(option => toVariety(option) ?? []) : [],
    stock: isNumber(item.stock) ? item.stock : null,
  };
  const quantity = Number(raw.quantity);
  const limit = orderLimit(clean);
  if (!Number.isInteger(quantity) || quantity < 1 || limit < 1) return null;
  return { key: cartKey(clean.id, variety), item: clean, variety, quantity: Math.min(quantity, limit) };
}

// Stock is counted per product, so the other options of the same product use up part of it.
function limitFor(item: CartItem, all: CartLine[], key: string) {
  const taken = all.filter(line => line.item.id === item.id && line.key !== key).reduce((sum, line) => sum + line.quantity, 0);
  return Math.max(0, Math.min(MAX_LINE_QUANTITY, (item.stock ?? Infinity) - taken));
}

// The most a customer can have of this line, given everything else in the cart.
export const lineLimit = (all: CartLine[], line: CartLine) => limitFor(line.item, all, line.key);

function readStored(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const stored = (parsed as { lines?: unknown } | null)?.lines;
    return Array.isArray(stored) ? stored.flatMap(entry => toLine(entry) ?? []) : [];
  } catch {
    return [];
  }
}

// On the server there is no cart, and nothing is remembered between requests.
function current(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  return (lines ??= readStored());
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, lines: next }));
  } catch {}
  listeners.forEach(listener => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  lines = readStored();
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export const cart = {
  lines: current,

  add(product: CartItem, variety: Variety | null = null): AddResult {
    if (product.stock === 0) return "sold-out";
    const key = cartKey(product.id, variety);
    const all = current();
    const existing = all.find(line => line.key === key);
    if ((existing?.quantity ?? 0) >= limitFor(product, all, key)) return "limit";
    const item = toItem(product);
    commit(existing ? all.map(line => line.key === key ? { ...line, item, quantity: line.quantity + 1 } : line) : [...all, { key, item, variety, quantity: 1 }]);
    return "added";
  },

  setQuantity(key: string, quantity: number) {
    const all = current();
    if (!all.some(line => line.key === key)) return;
    if (quantity < 1) commit(all.filter(line => line.key !== key));
    else commit(all.map(line => line.key === key ? { ...line, quantity: Math.min(Math.round(quantity), limitFor(line.item, all, key)) } : line));
  },

  remove(key: string) {
    commit(current().filter(line => line.key !== key));
  },

  clear() {
    commit([]);
  },

  // Brings every line in line with what the shop sells right now. Returns a plain-words note for each change.
  refresh(fresh: Map<string, Product>): string[] {
    const notices: string[] = [];
    const next: CartLine[] = [];
    const taken = new Map<string, number>();
    for (const line of current()) {
      const name = lineName(line);
      const product = fresh.get(line.item.id);
      const variety = line.variety ? product?.variants.find(option => option.name === line.variety?.name) ?? null : null;
      if (!product || (line.variety && !variety)) {
        notices.push(`${name} isn't available any more, so we took it out of your cart.`);
        continue;
      }
      if (product.stock === 0) {
        notices.push(`${name} just sold out, so we took it out of your cart.`);
        continue;
      }
      const item = toItem(product);
      const limit = Math.max(0, Math.min(MAX_LINE_QUANTITY, (item.stock ?? Infinity) - (taken.get(item.id) ?? 0)));
      if (limit === 0) {
        notices.push(`${name} isn't available in that quantity any more, so we took it out of your cart.`);
        continue;
      }
      let quantity = line.quantity;
      if (quantity > limit) {
        quantity = limit;
        notices.push(limit === MAX_LINE_QUANTITY ? `You can order up to ${limit} of ${name} at a time, so we changed the quantity.` : `Only ${limit} of ${name} left, so we changed the quantity.`);
      }
      taken.set(item.id, (taken.get(item.id) ?? 0) + quantity);
      const now = varietyPrice(item, variety);
      if (now !== lineUnitPrice(line)) notices.push(`The price of ${name} is now ${money(now)}.`);
      next.push({ key: line.key, item, variety, quantity });
    }
    if (JSON.stringify(next) !== JSON.stringify(current())) commit(next);
    return notices;
  },
};

export const useCartLines = () => useSyncExternalStore(subscribe, current, () => EMPTY);

// False on the server and while the page hydrates, so anything that depends on the saved cart waits for the browser.
const never = () => () => {};
export const useHydrated = () => useSyncExternalStore(never, () => true, () => false);

export type CartSync = { state: "checking" | "ready" | "failed"; notices: string[]; dismiss: () => void };

// Checks the cart against the live shop once, when a page that shows it opens.
export function useCartSync(): CartSync {
  const [result, setResult] = useState<{ state: CartSync["state"]; notices: string[] }>({ state: "checking", notices: [] });

  useEffect(() => {
    let stale = false;
    const ids = [...new Set(cart.lines().map(line => line.item.id))];
    const request = ids.length === 0
      ? Promise.resolve(new Map<string, Product>())
      : Promise.resolve(publicClient().from("products").select(PRODUCT_COLUMNS).in("id", ids)).then(({ data, error }) => {
        if (error) throw error;
        return new Map(((data ?? []) as unknown as Product[]).map(product => [product.id, product]));
      });
    request.then(
      fresh => { if (!stale) setResult({ state: "ready", notices: cart.refresh(fresh) }); },
      () => { if (!stale) setResult({ state: "failed", notices: [] }); },
    );
    return () => { stale = true; };
  }, []);

  return { ...result, dismiss: () => setResult(current => ({ ...current, notices: [] })) };
}
