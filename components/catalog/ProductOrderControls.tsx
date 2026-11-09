"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {getQuantityUnit, requiresWholeRozmetQuantity} from "@/lib/variantPresentation";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import {constrainOrderQuantityInput, correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {calculateLineTotal} from "@/lib/orderMeasurement";
import {formatCurrency} from "@/lib/currency";
import {CatalogVariantOrder, CatalogVariantQuantity} from "./CatalogVariantLayout";
import styles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {useOrderDraft} from "./OrderDraftProvider";

export function ProductOrderControls({variant, view, showUnit = true, allowBackorder = false,
  wholeQuantity = requiresWholeRozmetQuantity(variant)}: {
  variant: ProductVariant; view: "table" | "card"; showUnit?: boolean; allowBackorder?: boolean; wholeQuantity?: boolean;
}) {
  const {lines, hydrated, addItem, updateQuantity, removeItem} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const {draft, setDraft, message: correction, setMessage: setCorrection} = useOrderDraft<string>(variant.id, "quantity", "");
  const [removed, setRemoved] = useState(false);
  const value = draft ?? formatCatalogNumber(line?.quantity ?? 1);
  const quantity = parseOrderQuantity(value);
  const needsQuote = variant.price === null || !Number.isFinite(variant.price) || variant.price < 0
    || variant.quoteOnly || variant.priceQualifier === "from";
  const canPurchase = !needsQuote && (allowBackorder || variant.inStock || (variant.imported && variant.availability !== "ON_ORDER"));
  const shouldRemove = !!line && quantity === 0;
  const saved = !!line && !line.invalidReason && quantity === line.quantity;
  const valid = quantity !== null && quantity > 0 && quantity <= 999
    && (!wholeQuantity || Number.isInteger(quantity));
  const total = !variant.quoteOnly && variant.price !== null && (valid || shouldRemove)
    ? calculateLineTotal(quantity, variant.price) : null;
  const quantityUnit = getQuantityUnit(variant);
  const correctedQuantity = parseOrderQuantity(correctQuantityValue(value).value);
  const canSubmitQuantity = correctedQuantity !== null && correctedQuantity > 0 && correctedQuantity <= 999
    && (!wholeQuantity || Number.isInteger(correctedQuantity)) && variant.price !== null
    && calculateLineTotal(correctedQuantity, variant.price) !== null;

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function correctQuantityValue(rawValue: string) {
    const explicitRemoval = !!line && parseOrderQuantity(rawValue) === 0;
    if (!line && parseOrderQuantity(rawValue) === 0) {
      return {value: "1", message: "Для добавления количество заменено на 1."};
    }
    return correctOrderQuantity(rawValue, {whole: wholeQuantity, maximum: 999,
      fallback: line?.quantity ?? 1, ...(wholeQuantity && !explicitRemoval ? {minimum: 1} : {})});
  }

  function submit(rawValue = value) {
    if (!hydrated || removed) return;
    const corrected = correctQuantityValue(rawValue);
    const nextQuantity = parseOrderQuantity(corrected.value);
    setDraft(corrected.value);
    if (corrected.message) setCorrection(corrected.message);
    if (line && parseOrderQuantity(rawValue) === 0) {
      removeItem(variant.id);
      setDraft(null);
      setCorrection("");
      setRemoved(true);
      return;
    }
    if (!canPurchase || nextQuantity === null || nextQuantity <= 0 || nextQuantity > 999
      || (wholeQuantity && !Number.isInteger(nextQuantity)) || variant.price === null
      || calculateLineTotal(nextQuantity, variant.price) === null) return;
    if (line && !line.invalidReason && nextQuantity === line.quantity) {setDraft(null); return;}
    if (line) updateQuantity(variant.id, nextQuantity);
    else addItem(variant.id, nextQuantity);
    setDraft(null);
  }

  function correctQuantity() {
    if (draft === null) return;
    const next = correctQuantityValue(draft);
    if (next.value !== draft) setDraft(next.value);
    if (next.message) setCorrection(next.message);
  }

  const stateClass = removed ? styles.removedCartButton
    : shouldRemove ? styles.removeCartButton
      : saved ? styles.savedCartButton
        : line && canPurchase ? styles.updateCartButton : styles.cartButton;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : !canPurchase ? "Под заказ"
    : saved ? "✓ В корзине" : line ? "Обновить" : "В корзину";
  const actionClass = `${view === "card" ? "w-full" : tableStyles.tableAction} px-3`;
  const quoteQuantity = valid && (draft !== null || line || !needsQuote) ? quantity : null;
  const weightPerMeter = variant.weightPerMeterKg ?? (variant.weight?.unit === "кг/м" ? variant.weight.value : undefined);
  const quoteTons = quoteQuantity === null ? null : variant.unit === "ton" ? quoteQuantity
    : variant.unit === "kg" ? quoteQuantity / 1000
      : variant.unit === "meter" && weightPerMeter !== undefined ? quoteQuantity * weightPerMeter / 1000 : null;
  const action = !canPurchase && !shouldRemove && !removed ? (
    <QuoteRequestButton label={needsQuote ? "Запросить цену" : "Под заказ"}
      order={{product: formatQuoteProductName(variant), quantity: quoteQuantity, unit: getQuantityUnit(variant), tons: quoteTons}}
      className={`${styles.quoteButton} ${actionClass}`}/>
  ) : (
    <Button type="button" onClick={() => submit()}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!canPurchase || !canSubmitQuantity))}
      className={`${stateClass} ${actionClass}`}>{label}</Button>
  );
  const quantityError = draft !== null && value.trim() !== "" && !valid && !shouldRemove;
  const statusId = `quantity-status-${view}-${variant.id}`;
  const quantityInput = <Input type="text" inputMode={wholeQuantity ? "numeric" : "decimal"} value={value}
        aria-label={`Количество ${variant.name}, ${quantityUnit}`}
        aria-invalid={quantityError || undefined}
        aria-describedby={statusId}
        onChange={event => {
          const next = constrainOrderQuantityInput(event.target.value, 999);
          setDraft(next.value);
          setCorrection(next.message ?? "");
        }}
        onBlur={correctQuantity}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`${styles.field} min-w-0 ${showUnit ? "pl-2 pr-10" : "px-2"} text-center tabular-nums focus:placeholder:text-transparent`}
        placeholder="0"/>;
  const input = showUnit ? <CatalogVariantQuantity unit={quantityUnit}>{quantityInput}</CatalogVariantQuantity> : quantityInput;
  const totalOutput = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={total === null ? "text-xs text-slate-500 dark:text-slate-400" : "font-semibold tabular-nums"}>
    {total === null ? variant.price === null || variant.quoteOnly ? "По запросу" : "Укажите количество"
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(total)}`}
  </output>;
  const status = <span id={statusId} aria-live="polite" className={`mt-1 block text-xs ${quantityError
    ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
    {correction || (quantityError ? wholeQuantity ? "Введите целое количество от 1 до 999." : "Введите количество больше 0 и не больше 999."
      : line && !saved ? "Не сохранено" : "")}
  </span>;
  return <CatalogVariantOrder view={view} quantity={input} total={totalOutput} action={action} status={status}/>;
}
