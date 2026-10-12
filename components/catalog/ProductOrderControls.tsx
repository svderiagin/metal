"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button, ButtonLink} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {getQuantityUnit} from "@/lib/variantPresentation";
import type {ProductVariant} from "@/types/product";
import styles from "./FilterPanel.module.css";

export function ProductOrderControls({variant, view}: {variant: ProductVariant; view: "table" | "card"}) {
  const {lines, hydrated, addItem, updateQuantity, removeItem} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const [draft, setDraft] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const value = draft ?? String(line?.quantity ?? 1);
  const quantity = value.trim() === "" ? NaN : Number(value);
  const needsQuote = variant.price === null || variant.quoteOnly || variant.priceQualifier === "from";
  const canPurchase = !needsQuote && (variant.inStock || variant.imported);
  const shouldRemove = !!line && quantity === 0;
  const saved = !!line && !line.invalidReason && quantity === line.quantity;
  const valid = Number.isFinite(quantity) && quantity > 0 && quantity <= 999;

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function submit() {
    if (!hydrated || saved || removed) return;
    if (shouldRemove) {
      removeItem(variant.id);
      setDraft(null);
      setRemoved(true);
      return;
    }
    if (!canPurchase || !valid) return;
    if (line) updateQuantity(variant.id, quantity);
    else addItem(variant.id, quantity);
    setDraft(null);
  }

  const stateClass = removed ? styles.removedCartButton
    : shouldRemove ? styles.removeCartButton
      : saved ? styles.savedCartButton
        : line && canPurchase ? styles.updateCartButton : styles.cartButton;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : !canPurchase ? "Под заказ"
    : saved ? "✓ В корзине" : line ? "Обновить" : "В корзину";
  const actionClass = `${styles.orderAction} ${view === "card" ? styles.orderActionCard : ""} px-3`;
  const action = needsQuote && !shouldRemove ? (
    <ButtonLink href={`/?product=${encodeURIComponent(variant.name)}#request`}
      className={`${styles.quoteButton} ${actionClass}`}>Запросить цену</ButtonLink>
  ) : (
    <Button type="button" onClick={submit}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!canPurchase || !valid))}
      className={`${stateClass} ${actionClass}`}>{label}</Button>
  );
  const input = (
    <label className="flex min-w-0 flex-col items-start gap-1">
      <span className="sr-only">Количество {variant.name}</span>
      <Input type="number" min={0} max={999} step="any" value={value}
        onChange={event => setDraft(event.target.value)}
        className={`${styles.field} min-w-0 px-2`}/>
      <span className="text-xs text-slate-500">{getQuantityUnit(variant)}</span>
    </label>
  );
  return view === "table" ? <>
    <td className="px-2 py-3">{input}</td>
    <td className="px-2 py-3 text-center">{action}</td>
  </> : <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-3">{input}{action}</div>;
}
