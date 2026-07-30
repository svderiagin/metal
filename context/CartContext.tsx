"use client";
import {createContext, type ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {CART_STORAGE_KEY} from "@/lib/constants";
import {
  getCategoryById,
  getProductTypeById,
  getProductVariantById,
  getSubcategoryById,
} from "@/lib/catalog";
import type {CartItem, CartLine, CartMeasurement} from "@/types/cart";

interface CartContextValue {
  items: CartItem[];
  lines: CartLine[];
  hydrated: boolean;
  totalQuantity: number;
  totalAmount: number;
  addItem: (id: string, q?: number, measurement?: CartMeasurement) => void;
  updateQuantity: (id: string, q: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
const normalize = (items: CartItem[]) => items.flatMap((item) => {
  if (!getProductVariantById(item.productId) || !Number.isFinite(item.quantity) || item.quantity <= 0) return [];
  const measurement = normalizeMeasurement(item.measurement);
  if (item.measurement && !measurement) return [];
  return [{
    productId: item.productId,
    quantity: measurement ? item.quantity : Math.min(Math.floor(item.quantity), 999),
    ...(measurement ? {measurement} : {}),
  }];
});

export function CartProvider({children}: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) setItems(normalize(JSON.parse(raw) as CartItem[]));
      } catch {
      } finally {
        setHydrated(true)
      }
    }, 0);
    return () => window.clearTimeout(timer)
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated]);
  const addItem = useCallback((
    productId: string,
    quantity = 1,
    measurement?: CartMeasurement,
  ) => setItems(prev => {
    const safeMeasurement = normalizeMeasurement(measurement);
    if (measurement && !safeMeasurement) return prev;
    if (safeMeasurement) {
      const next = {productId, quantity, measurement: safeMeasurement};
      return prev.some((item) => item.productId === productId)
        ? prev.map((item) => item.productId === productId ? next : item)
        : [...prev, next];
    }
    const safe = Math.max(1, Math.min(999, Math.floor(quantity)));
    const found = prev.find(i => i.productId === productId);
    return found ? prev.map(i => i.productId === productId ? {
      ...i,
      quantity: Math.min(999, i.quantity + safe)
    } : i) : [...prev, {productId, quantity: safe}]
  }), []);
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) return;
    setItems(prev => prev.map(i => i.productId === productId ? {
      ...i,
      quantity: Math.min(999, Math.floor(quantity))
    } : i))
  }, []);
  const removeItem = useCallback((productId: string) => setItems(prev => prev.filter(i => i.productId !== productId)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const lines = useMemo(() => items.flatMap(item => {
    const p = getProductVariantById(item.productId);
    if (!p) return [];
    const c = getCategoryById(p.categoryId);
    const s = getSubcategoryById(p.subcategoryId);
    const productType = getProductTypeById(p.productTypeId);
    return [{
      ...item,
      name: p.name,
      slug: p.slug,
      categorySlug: c?.slug ?? "catalog",
      subcategorySlug: s?.slug ?? "catalog",
      productTypeSlug: productType?.slug ?? "variants",
      sku: p.sku,
      price: p.price,
      priceUnit: p.priceUnit,
      estimatedTotal: item.measurement?.estimatedTotal ?? p.price * item.quantity,
    }]
  }), [items]);
  const value = useMemo(() => ({
    items,
    lines,
    hydrated,
    totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
    totalAmount: lines.reduce((s, i) => s + i.estimatedTotal, 0),
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  }), [items, lines, hydrated, addItem, updateQuantity, removeItem, clearCart]);
  return <CartContext value={value}>{children}</CartContext>
}

function normalizeMeasurement(value: CartMeasurement | undefined) {
  if (!value) return undefined;
  if (value.inputMode !== "meter" && value.inputMode !== "ton") return null;
  const numbers = [value.meters, value.weightTons, value.pricePerTon, value.estimatedTotal];
  if (numbers.some((number) => !Number.isFinite(number) || number < 0)) return null;
  if (value.meters <= 0 || value.weightTons <= 0) return null;
  return value;
}
