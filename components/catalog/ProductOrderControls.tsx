"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {getQuantityUnit, requiresWholeRozmetQuantity} from "@/lib/variantPresentation";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import styles from "./FilterPanel.module.css";

export function ProductOrderControls({variant, view, referenceStyle = false}: {variant: ProductVariant; view: "table" | "card"; referenceStyle?: boolean}) {
  const {lines, hydrated, addItem, updateQuantity, removeItem} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const [draft, setDraft] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const value = draft ?? String(line?.quantity ?? 1);
  const quantity = value.trim() === "" ? NaN : Number(value);
  const needsQuote = variant.price === null || variant.quoteOnly || variant.priceQualifier === "from";
  const canPurchase = !needsQuote && (variant.inStock || (variant.imported && variant.availability !== "ON_ORDER"));
  const shouldRemove = !!line && quantity === 0;
  const saved = !!line && !line.invalidReason && quantity === line.quantity;
  const wholeQuantity = requiresWholeRozmetQuantity(variant);
  const valid = Number.isFinite(quantity) && quantity > 0 && quantity <= 999
    && (!wholeQuantity || Number.isInteger(quantity));

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
  const quoteQuantity = draft !== null || line || !needsQuote ? quantity : null;
  const weightPerMeter = variant.weightPerMeterKg ?? (variant.weight?.unit === "кг/м" ? variant.weight.value : undefined);
  const quoteTons = quoteQuantity === null ? null : variant.unit === "ton" ? quoteQuantity
    : variant.unit === "kg" ? quoteQuantity / 1000
      : variant.unit === "meter" && weightPerMeter !== undefined ? quoteQuantity * weightPerMeter / 1000 : null;
  const action = !canPurchase && !shouldRemove && !removed ? (
    <QuoteRequestButton label={needsQuote ? "Запросить цену" : "Под заказ"}
      order={{product: formatQuoteProductName(variant), quantity: quoteQuantity, unit: getQuantityUnit(variant), tons: quoteTons}}
      className={`${styles.quoteButton} ${actionClass}`}/>
  ) : (
    <Button type="button" onClick={submit}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!canPurchase || !valid))}
      className={`${stateClass} ${actionClass}`}>{label}</Button>
  );
  const quantityInput = <Input type="number" inputMode={wholeQuantity ? "numeric" : "decimal"} min={0} max={999} step={wholeQuantity ? 1 : "any"} value={value}
        onChange={event => setDraft(event.target.value)}
        className={`${styles.field} min-w-0 px-2 ${referenceStyle ? "text-center tabular-nums focus:placeholder:text-transparent" : ""}`}
        placeholder={referenceStyle ? "0" : undefined}/>;
  const input = (
    <label className="flex min-w-0 flex-col items-start gap-1">
      <span className="sr-only">Количество {variant.name}</span>
      {referenceStyle ? quantityInput : <>{quantityInput}<span className="text-xs text-slate-500 dark:text-slate-400">{getQuantityUnit(variant)}</span></>}
    </label>
  );
  return view === "table" ? <>
    <td className="px-2 py-3">{input}</td>
    <td className="px-2 py-3 text-center">{action}</td>
  </> : <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-3">{input}{action}</div>;
}
