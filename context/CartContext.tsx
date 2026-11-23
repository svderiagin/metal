"use client";
import {createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {CART_STORAGE_KEY} from "@/lib/constants";
import {getProductVariantById} from "@/lib/cartCatalog";
import {resolveCatalogProductId} from "@/lib/catalogIdentity";
import type {CartItem, CartLine, CartMeasurement, CartPieceOrder, OrderInputMode} from "@/types/cart";
import {createCartLines, normalizeCartItems, resolveStoredCartItem} from "@/lib/cart";
import {addCartItem, updateCartItem, updateCartPieceOrder} from "@/lib/cartMutations";

interface CartContextValue {
  items: CartItem[];
  lines: CartLine[];
  hydrated: boolean;
  lineItemCount: number;
  totalAmount: number;
  addItem: (id: string, q?: number, measurement?: CartMeasurement, pieceOrder?: CartPieceOrder) => void;
  updateQuantity: (id: string, q: number, mode?: OrderInputMode) => void;
  updatePieceOrder: (id: string, pieces: number, lengthMeters: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

const itemKeyPrefix = `${CART_STORAGE_KEY}:item:`;
const removedKeyPrefix = `${CART_STORAGE_KEY}:removed:`;

export function CartProvider({children}: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const currentItems = useRef<CartItem[]>([]);
  const storageUnavailable = useRef(false);

  const readCurrentItems = useCallback(() => {
    if (!storageUnavailable.current) {
      try { return readStoredCart(); }
      catch { storageUnavailable.current = true; }
    }
    return currentItems.current;
  }, []);
  const publishItems = useCallback((next: CartItem[]) => {
    currentItems.current = next;
    setItems(next);
  }, []);
  useEffect(() => {
    function syncCart(event: StorageEvent) {
      if (event.key === null || event.key === CART_STORAGE_KEY
        || event.key.startsWith(itemKeyPrefix) || event.key.startsWith(removedKeyPrefix)) {
        publishItems(readCurrentItems());
      }
    }
    window.addEventListener("storage", syncCart);
    const timer = window.setTimeout(() => {
      publishItems(readCurrentItems());
      setHydrated(true);
    }, 0);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.clearTimeout(timer);
    };
  }, [publishItems, readCurrentItems]);

  const changeCart = useCallback((mutate: (current: CartItem[]) => CartItem[]) => {
    // Read again even if the storage event from another tab has not arrived yet.
    const current = readCurrentItems();
    const next = mutate(current);
    if (next !== current && !storageUnavailable.current) {
      try {
        writeStoredChanges(current, next);
        const saved = readStoredCart();
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(saved));
        publishItems(saved);
        return;
      } catch { storageUnavailable.current = true; }
    }
    publishItems(next);
  }, [publishItems, readCurrentItems]);

  const addItem = useCallback((productId: string, quantity = 1, measurement?: CartMeasurement, pieceOrder?: CartPieceOrder) => {
    // A repeated click or another tab may already have added this row.
    changeCart(previous => previous.some(item => item.productId === productId) ? previous
      : addCartItem(previous, getProductVariantById(productId), quantity, measurement, pieceOrder));
  }, [changeCart]);
  const updateQuantity = useCallback((productId: string, quantity: number, mode?: OrderInputMode) => {
    changeCart(previous => updateCartItem(previous, getProductVariantById(productId), quantity, mode));
  }, [changeCart]);
  const updatePieceOrder = useCallback((productId: string, pieces: number, lengthMeters: number) => {
    changeCart(previous => updateCartPieceOrder(previous, getProductVariantById(productId), pieces, lengthMeters));
  }, [changeCart]);
  const removeItem = useCallback((productId: string) => {
    changeCart(previous => previous.filter(item => item.productId !== productId));
  }, [changeCart]);
  const clearCart = useCallback(() => changeCart(() => []), [changeCart]);
  const lines = useMemo(() => createCartLines(items), [items]);
  const lineItemCount = lines.length;
  const totalAmount = useMemo(() => calculateTotalAmount(lines), [lines]);
  const value = useMemo(() => ({
    items,
    lines,
    hydrated,
    lineItemCount,
    totalAmount,
    addItem,
    updateQuantity,
    updatePieceOrder,
    removeItem,
    clearCart
  }), [items, lines, hydrated, lineItemCount, totalAmount, addItem, updateQuantity, updatePieceOrder, removeItem, clearCart]);
  return <CartContext value={value}>{children}</CartContext>
}

function readStoredCart(): CartItem[] {
  const snapshot = normalizeCartItems(parseStoredJson(localStorage.getItem(CART_STORAGE_KEY)));
  const legacyUpdates: unknown[] = [];
  const updates: unknown[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(itemKeyPrefix)) continue;
    const id = key.slice(itemKeyPrefix.length);
    const value = parseStoredJson(localStorage.getItem(key));
    if (resolveCatalogProductId(id) === id) updates.push(value);
    else legacyUpdates.push(value);
  }
  // A change in another tab can overwrite a legacy snapshot. Per-product updates take precedence,
  // and a removal stays effective even if a previously started update writes that product later.
  const items = [...snapshot, ...normalizeCartItems(legacyUpdates), ...normalizeCartItems(updates)]
    .filter(item => localStorage.getItem(removedKeyPrefix + item.productId) === null)
    .map(resolveStoredCartItem);
  return normalizeCartItems(items).filter(item => localStorage.getItem(removedKeyPrefix + item.productId) === null);
}

function parseStoredJson(raw: string | null): unknown {
  try { return raw === null ? null : JSON.parse(raw); }
  catch { return null; }
}

function writeStoredChanges(current: CartItem[], next: CartItem[]) {
  const previous = new Map(current.map(item => [item.productId, item]));
  for (const item of next) {
    const saved = previous.get(item.productId);
    previous.delete(item.productId);
    if (item === saved) continue;
    localStorage.setItem(itemKeyPrefix + item.productId, JSON.stringify(item));
    if (!saved) localStorage.removeItem(removedKeyPrefix + item.productId);
  }
  for (const id of previous.keys()) {
    localStorage.setItem(removedKeyPrefix + id, "1");
    localStorage.removeItem(itemKeyPrefix + id);
  }
}

function calculateTotalAmount(lines: CartLine[]): number {
  let total = 0;
  for (const line of lines) total += Math.round(line.estimatedTotal * 100);
  return total / 100;
}
