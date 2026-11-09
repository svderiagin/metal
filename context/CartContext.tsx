"use client";
import {createContext, type ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {CART_STORAGE_KEY} from "@/lib/constants";
import {getProductVariantById} from "@/lib/cartCatalog";
import type {CartItem, CartLine, CartMeasurement, CartPieceOrder, OrderInputMode} from "@/types/cart";
import {createCartLines, normalizeCartItems} from "@/lib/cart";
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

export function CartProvider({children}: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          setItems(normalizeCartItems(JSON.parse(raw)));
        }
      } catch {
      } finally {
        setHydrated(true)
      }
    }, 0);
    return () => window.clearTimeout(timer)
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));}
    catch { /* The cart remains usable in memory when browser storage is blocked or full. */ }
  }, [items, hydrated]);
  const addItem = useCallback((productId: string, quantity = 1, measurement?: CartMeasurement, pieceOrder?: CartPieceOrder) => {
    setItems(previous => addCartItem(previous, getProductVariantById(productId), quantity, measurement, pieceOrder));
  }, []);
  const updateQuantity = useCallback((productId: string, quantity: number, mode?: OrderInputMode) => {
    setItems(previous => updateCartItem(previous, getProductVariantById(productId), quantity, mode));
  }, []);
  const updatePieceOrder = useCallback((productId: string, pieces: number, lengthMeters: number) => {
    setItems(previous => updateCartPieceOrder(previous, getProductVariantById(productId), pieces, lengthMeters));
  }, []);
  const removeItem = useCallback((productId: string) => setItems(prev => prev.filter(i => i.productId !== productId)), []);
  const clearCart = useCallback(() => setItems([]), []);
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

function calculateTotalAmount(lines: CartLine[]): number {
  let total = 0;
  for (const line of lines) total += Math.round(line.estimatedTotal * 100);
  return total / 100;
}
