"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cart, cartCount, cartKey, cartSubtotal, useCartLines, type AddResult, type CartLine } from "@/lib/cart-store";
import { MAX_LINE_QUANTITY, type Product, type Variety } from "@/lib/products";

export type Toast = { kind: "added"; key: string } | { kind: "message"; text: string };

type Store = {
  quantityOf: (productId: string) => number;
  add: (product: Product, variety?: Variety | null) => AddResult;
  lines: CartLine[];
  count: number;
  subtotal: number;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  toast: Toast | null;
  cartDialog: RefObject<HTMLDialogElement | null>;
  searchDialog: RefObject<HTMLDialogElement | null>;
  openCart: () => void;
  closeCart: () => void;
  openSearch: () => void;
};
const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside the store layout");
  return store;
}

// What every shop page shares: the saved cart, the "added to cart" note, and the cart and search windows.
export function StoreProvider({ children }: { children: ReactNode }) {
  const lines = useCartLines();
  const [toast, setToast] = useState<Toast | null>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const add = (product: Product, variety: Variety | null = null) => {
    const result = cart.add(product, variety);
    if (result === "added") setToast({ kind: "added", key: cartKey(product.id, variety) });
    else if (result === "sold-out") setToast({ kind: "message", text: `${product.name} is sold out.` });
    else setToast({ kind: "message", text: product.stock !== null && product.stock < MAX_LINE_QUANTITY ? `All ${product.stock} we have of ${product.name} are in your cart.` : `You can order up to ${MAX_LINE_QUANTITY} of ${product.name} at a time.` });
    return result;
  };

  const store: Store = {
    quantityOf: productId => lines.filter(line => line.item.id === productId).reduce((sum, line) => sum + line.quantity, 0),
    add,
    lines,
    count: cartCount(lines),
    subtotal: cartSubtotal(lines),
    setQuantity: cart.setQuantity,
    remove: cart.remove,
    clear: cart.clear,
    toast,
    cartDialog,
    searchDialog,
    openCart: () => { setToast(null); cartDialog.current?.showModal(); },
    closeCart: () => cartDialog.current?.close(),
    openSearch: () => { setToast(null); searchDialog.current?.showModal(); },
  };
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
