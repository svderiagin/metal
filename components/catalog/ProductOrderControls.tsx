"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {getQuantityUnit, requiresWholeCatalogQuantity} from "@/lib/variantPresentation";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import {constrainOrderQuantityInput, correctOrderQuantity, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {formatQuantityForInput, productOrderFractionDigits} from "@/lib/cartQuantityInput";
import {calculateLineTotal} from "@/lib/orderMeasurement";
import {formatCurrency} from "@/lib/currency";
import {requiresCatalogPriceQuote, storefrontAvailability} from "@/lib/catalogOffer";
import {CatalogOrderInput} from "./CatalogOrderInput";
import {CatalogVariantOrder, CatalogVariantQuantity} from "./CatalogVariantLayout";
import styles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {orderQuantityHintDuration, useOrderDraft} from "./OrderDraftProvider";

export function ProductOrderControls({variant, view, showUnit = true,
  wholeQuantity = requiresWholeCatalogQuantity(variant)}: {
  variant: ProductVariant; view: "table" | "card"; showUnit?: boolean; wholeQuantity?: boolean;
}) {
  const {lines, hydrated, addItem, updateQuantity, removeItem} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const {draft, setDraft, message: correction, setMessage: setCorrection} = useOrderDraft<string>(variant.id, "quantity", "");
  const [removed, setRemoved] = useState(false);
  const savedValue = formatQuantityForInput(line?.quantity ?? 1);
  const value = draft ?? savedValue;
  const quantity = chosenQuantity(value);
  const needsQuote = requiresCatalogPriceQuote(variant);
  const madeToOrder = storefrontAvailability(variant.availability) === "ON_ORDER";
  const canAdd = madeToOrder || !needsQuote;
  const canPromptForQuantity = !line && value === "";
  const enteringFraction = value === "0,";
  const shouldRemove = !!line && quantity === 0;
  const saved = !!line && !line.invalidReason && quantity === line.quantity;
  const valid = quantity !== null && quantity > 0 && quantity <= 999
    && (!wholeQuantity || Number.isInteger(quantity));
  const total = !variant.quoteOnly && variant.price !== null && (valid || shouldRemove)
    ? calculateLineTotal(quantity, variant.price) : null;
  const quantityUnit = getQuantityUnit(variant);
  const correctedQuantity = parseOrderQuantity(correctQuantityValue(value).value);
  function canSubmitQuantity(quantity: number | null): quantity is number {
    return quantity !== null && quantity > 0 && quantity <= 999
      && (!wholeQuantity || Number.isInteger(quantity))
      && (needsQuote || calculateLineTotal(quantity, variant.price!) !== null);
  }

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function chosenQuantity(rawValue: string) {
    if (rawValue === "0,") return null;
    const parsed = parseOrderQuantity(rawValue);
    return line && parsed === parseOrderQuantity(savedValue) ? line.quantity : parsed;
  }

  function correctQuantityValue(rawValue: string) {
    if (!rawValue.trim() && line) return {value: savedValue};
    const numeric = chosenQuantity(rawValue);
    if (numeric === null || numeric === 0) return {value: rawValue};
    if (numeric === line?.quantity && numeric <= 999 && (!wholeQuantity || Number.isInteger(numeric))) return {value: savedValue};
    const corrected = correctOrderQuantity(rawValue, {whole: wholeQuantity, maximum: 999, decimalPlaces: productOrderFractionDigits(numeric)});
    return {value: corrected.value.replace(".", ","), message: corrected.value === "" ? corrected.message : undefined};
  }

  function submit(rawValue = value) {
    if (!hydrated || removed) return;
    if (canPromptForQuantity) {
      setCorrection("Укажите количество больше нуля.", orderQuantityHintDuration);
      return;
    }
    const rawQuantity = chosenQuantity(rawValue);
    if (rawQuantity === null) return;
    const corrected = correctQuantityValue(rawValue);
    const nextQuantity = chosenQuantity(corrected.value);
    setDraft(corrected.value);
    if (corrected.message) setCorrection(corrected.message);
    if (line && rawQuantity === 0) {
      removeItem(variant.id);
      setDraft(null);
      setCorrection("");
      setRemoved(true);
      return;
    }
    if (!canAdd || !canSubmitQuantity(nextQuantity)) return;
    if (line && !line.invalidReason && nextQuantity === line.quantity) {setDraft(null); return;}
    if (line) updateQuantity(variant.id, nextQuantity);
    else addItem(variant.id, nextQuantity);
    setDraft(null);
    setCorrection("");
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
        : line && canAdd ? styles.updateCartButton : styles.cartButton;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить"
    : saved ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : line ? "Обновить" : madeToOrder ? "Заказать" : "В корзину";
  const actionClass = `${view === "card" ? "w-full" : tableStyles.tableAction} px-3`;
  const quoteQuantity = valid && (draft !== null || line || !needsQuote) ? quantity : null;
  const weightPerMeter = variant.weightPerMeterKg ?? (variant.weight?.unit === "кг/м" ? variant.weight.value : undefined);
  const quoteTons = quoteQuantity === null ? null : variant.unit === "ton" ? quoteQuantity
    : variant.unit === "kg" ? quoteQuantity / 1000
      : variant.unit === "meter" && weightPerMeter !== undefined ? quoteQuantity * weightPerMeter / 1000 : null;
  const statusId = `quantity-status-${view}-${variant.id}`;
  const deliveryId = madeToOrder ? `${statusId}-delivery` : undefined;
  const amountTooSmall = !needsQuote && valid && total === null;
  const quantityError = draft !== null && value !== "" && !enteringFraction && (!valid || amountTooSmall) && !shouldRemove;
  const quoteClassName = `${styles.quoteButton} ${actionClass}`;
  const action = !canAdd && !shouldRemove && !removed ? (
    enteringFraction || (quantityError && !canSubmitQuantity(correctedQuantity))
      ? <Button type="button" className={quoteClassName} disabled>Запросить цену</Button>
      : <QuoteRequestButton label="Запросить цену"
        order={{product: formatQuoteProductName(variant), quantity: quoteQuantity, unit: quantityUnit, tons: quoteTons}}
        className={quoteClassName}/>
  ) : (
    <Button type="button" aria-describedby={deliveryId} onClick={() => submit()}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!canAdd || (!canSubmitQuantity(correctedQuantity) && !canPromptForQuantity)))}
      className={`${stateClass} ${actionClass}`}>{label}</Button>
  );
  const unitInsideField = view === "table" && showUnit;
  const quantityInput = <CatalogOrderInput inputMode={wholeQuantity ? "numeric" : "decimal"} value={value}
    label={`Количество ${variant.name}, ${quantityUnit}`}
    visibleLabel={view === "card" ? `Заказ, ${quantityUnit}` : undefined}
    invalid={quantityError} statusId={statusId}
    onChange={value => {
      setDraft(constrainOrderQuantityInput(value, 999).value);
      setCorrection("");
    }}
    onBlur={correctQuantity}
    className={unitInsideField ? "pl-2 pr-10" : undefined}/>;
  const quantityField = unitInsideField ? <CatalogVariantQuantity unit={quantityUnit}>{quantityInput}</CatalogVariantQuantity> : quantityInput;
  const totalOutput = <output data-price={total !== null || undefined} aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={total === null ? "text-xs text-slate-500 dark:text-slate-400" : "font-semibold tabular-nums"}>
    {total === null ? variant.price === null || variant.quoteOnly ? "По запросу" : "Укажите количество"
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(total)}`}
  </output>;
  const status = <span id={statusId} aria-live="polite" className={`mt-1 block text-xs ${quantityError
    ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
    {wholeQuantity && valid && !removed && <span className="block">{quantity} {quantityUnit}</span>}
    {line && valid && !saved && <span className="block whitespace-nowrap">Не сохранено</span>}
    {amountTooSmall ? "Увеличьте количество. Сумма позиции должна быть больше 0 ₽."
      : correction || (quantityError ? wholeQuantity ? "Введите целое количество от 1 до 999." : "Введите количество больше 0 и не больше 999." : "")}
  </span>;
  return <CatalogVariantOrder view={view} quantity={quantityField} total={totalOutput} action={action} status={status} deliveryId={deliveryId}/>;
}
