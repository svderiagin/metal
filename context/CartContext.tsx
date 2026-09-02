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

export function CartProvider({children}: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          const storedItems = JSON.parse(raw) as CartItem[];
          setItems(normalizeCartItems(storedItems));
        }
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
  const lines = useMemo(() => createCartLines(items), [items]);
  const totalQuantity = useMemo(() => calculateTotalQuantity(items), [items]);
  const totalAmount = useMemo(() => calculateTotalAmount(lines), [lines]);
  const value = useMemo(() => ({
    items,
    lines,
    hydrated,
    totalQuantity,
    totalAmount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  }), [items, lines, hydrated, totalQuantity, totalAmount, addItem, updateQuantity, removeItem, clearCart]);
  return <CartContext value={value}>{children}</CartContext>
}

function normalizeCartItems(items: CartItem[]): CartItem[] {
  const normalizedItems: CartItem[] = [];

  for (const item of items) {
    const productExists = getProductVariantById(item.productId) !== undefined;
    const quantityIsValid = Number.isFinite(item.quantity) && item.quantity > 0;
    if (!productExists || !quantityIsValid) continue;

    const measurement = normalizeMeasurement(item.measurement);
    if (item.measurement && !measurement) continue;

    if (measurement) {
      normalizedItems.push({productId: item.productId, quantity: item.quantity, measurement});
    } else {
      normalizedItems.push({
        productId: item.productId,
        quantity: Math.min(Math.floor(item.quantity), 999),
      });
    }
  }

  return normalizedItems;
}

function createCartLines(items: CartItem[]): CartLine[] {
  const lines: CartLine[] = [];

  for (const item of items) {
    const product = getProductVariantById(item.productId);
    if (!product) continue;

    const category = getCategoryById(product.categoryId);
    const subcategory = getSubcategoryById(product.subcategoryId);
    const productType = getProductTypeById(product.productTypeId);
    const estimatedTotal = item.measurement
      ? item.measurement.estimatedTotal
      : product.price * item.quantity;

    lines.push({
      ...item,
      name: product.name,
      slug: product.slug,
      categorySlug: category?.slug ?? "catalog",
      subcategorySlug: subcategory?.slug ?? "catalog",
      productTypeSlug: productType?.slug ?? "variants",
      sku: product.sku,
      price: product.price,
      priceUnit: product.priceUnit,
      estimatedTotal,
    });
  }

  return lines;
}

function calculateTotalQuantity(items: CartItem[]): number {
  let total = 0;
  for (const item of items) total += item.quantity;
  return total;
}

function calculateTotalAmount(lines: CartLine[]): number {
  let total = 0;
  for (const line of lines) total += line.estimatedTotal;
  return total;
}

function normalizeMeasurement(value: CartMeasurement | undefined) {
  if (!value) return undefined;
  if (value.inputMode !== "meter" && value.inputMode !== "ton") return null;
  const numbers = [value.meters, value.weightTons, value.pricePerTon, value.estimatedTotal];
  if (numbers.some((number) => !Number.isFinite(number) || number < 0)) return null;
  if (value.meters <= 0 || value.weightTons <= 0) return null;
  return value;
}
