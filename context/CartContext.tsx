"use client";
import {createContext, type ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {CART_STORAGE_KEY} from "@/lib/constants";
import {getProductVariantById} from "@/lib/catalog";
import type {CartItem, CartLine, CartMeasurement, CartPieceOrder} from "@/types/cart";
import {createCartLines, normalizeCartItems, normalizeMeasurement} from "@/lib/cart";
import {isProfilePipeVariant, normalizePieceOrder} from "@/lib/profilePipe";
import {revalidateCartPrice} from "@/lib/cartPricing";
import {isProfileSheetVariant} from "@/lib/profileSheet";

interface CartContextValue {
  items: CartItem[];
  lines: CartLine[];
  hydrated: boolean;
  lineItemCount: number;
  totalAmount: number;
  addItem: (id: string, q?: number, measurement?: CartMeasurement, pieceOrder?: CartPieceOrder) => void;
  updateQuantity: (id: string, q: number) => void;
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
  const addItem = useCallback((
    productId: string,
    quantity = 1,
    measurement?: CartMeasurement,
    pieceOrder?: CartPieceOrder,
  ) => setItems(prev => {
    const product = getProductVariantById(productId);
    if (product && isProfilePipeVariant(product)) {
      const priced = revalidateCartPrice(product, {quantity, pieceOrder, measurement});
      if (priced.invalidReason || !priced.pieceOrder) return prev;
      const next = {productId, quantity, pieceOrder: priced.pieceOrder};
      return prev.some(item => item.productId === productId)
        ? prev.map(item => item.productId === productId ? next : item) : [...prev, next];
    }
    if (pieceOrder) return prev;
    if (!product || product.price === null || product.quoteOnly || product.priceQualifier === "from" || !Number.isFinite(quantity) || quantity <= 0 || (!measurement && quantity > 999)) return prev;
    if (isProfileSheetVariant(product) && (!Number.isInteger(quantity) || measurement)) return prev;
    const safeMeasurement = normalizeMeasurement(measurement);
    if (measurement && !safeMeasurement) return prev;
    if (safeMeasurement) {
      const next = {productId, quantity: safeMeasurement.inputMode === "meter" ? safeMeasurement.meters : safeMeasurement.weightTons, measurement: safeMeasurement};
      return prev.some((item) => item.productId === productId)
        ? prev.map((item) => item.productId === productId ? next : item)
        : [...prev, next];
    }
    const safe = quantity;
    const found = prev.find(i => i.productId === productId);
    return found ? prev.map(i => i.productId === productId ? {
      ...i,
      quantity: Math.min(999, i.quantity + safe)
    } : i) : [...prev, {productId, quantity: safe}]
  }), []);
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const product = getProductVariantById(productId);
    if (product && isProfilePipeVariant(product)) {
      setItems(prev => prev.map(item => {
        if (item.productId !== productId) return item;
        const length = item.pieceOrder?.lengthMeters ?? product.lengthMeters;
        const pieceOrder = length ? normalizePieceOrder({pieces: quantity / length, lengthMeters: length}) : undefined;
        if (!pieceOrder || revalidateCartPrice(product, {quantity, pieceOrder}).invalidReason) return item;
        return {...item, quantity, pieceOrder};
      }));
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 999) return;
    if (product && isProfileSheetVariant(product) && !Number.isInteger(quantity)) return;
    setItems(prev => prev.map(i => i.productId === productId ? {
      ...i,
      quantity,
      ...(i.measurement ? {measurement: {...i.measurement,
        ...(i.measurement.inputMode === "meter" ? {meters: quantity} : {weightTons: quantity})}} : {}),
    } : i))
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
    removeItem,
    clearCart
  }), [items, lines, hydrated, lineItemCount, totalAmount, addItem, updateQuantity, removeItem, clearCart]);
  return <CartContext value={value}>{children}</CartContext>
}

function calculateTotalAmount(lines: CartLine[]): number {
  let total = 0;
  for (const line of lines) total += Math.round(line.estimatedTotal * 100);
  return total / 100;
}
