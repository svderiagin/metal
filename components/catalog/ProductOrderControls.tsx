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
import {correctDraftPrecision, formatQuantityForInput, productOrderFractionDigits} from "@/lib/cartQuantityInput";
import {calculateLineTotal, getSimpleOrderQuantityOptions} from "@/lib/orderMeasurement";
import {MAX_ORDER_PIECES} from "@/lib/constants";
import {sheetsForOrderTons, sheetTonDecimals, sheetOrderTons} from "@/lib/sheetOrder";
import {formatCurrency} from "@/lib/currency";
import {requiresCatalogPriceQuote, storefrontAvailability} from "@/lib/catalogOffer";
import {CatalogOrderInput} from "./CatalogOrderInput";
import {CatalogVariantOrder, CatalogVariantQuantity} from "./CatalogVariantLayout";
import styles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {orderQuantityHintDuration, useOrderDraft} from "./OrderDraftProvider";

type QuantityDraft = string | {text: string; exactTons?: number};

export function ProductOrderControls({variant, view, showUnit = true, startEmpty = false, orderBySheet = false, quantityColSpan,
  wholeQuantity = orderBySheet || requiresWholeCatalogQuantity(variant)}: {
  orderBySheet?: boolean;
  quantityColSpan?: 1 | 2;
  variant: ProductVariant; view: "table" | "card"; showUnit?: boolean; wholeQuantity?: boolean; startEmpty?: boolean;
}) {
  const {lines, hydrated, addItem, updateQuantity, removeItem} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const {draft, setDraft, message: correction, setMessage: setCorrection} = useOrderDraft<QuantityDraft>(variant.id, "quantity", "");
  const [removed, setRemoved] = useState(false);
  const sheetOrder = orderBySheet ? variant.sheetOrder : undefined;
  const quantityPerSheet = sheetOrder?.quantityPerSheet ?? 1;
  const maximum = sheetOrder ? MAX_ORDER_PIECES : getSimpleOrderQuantityOptions(variant).maximum;
  const savedQuantity = line ? line.quantity / quantityPerSheet : undefined;
  const savedValue = savedQuantity !== undefined ? formatQuantityForInput(savedQuantity) : startEmpty ? "" : "1";
  const massDraft = typeof draft === "string" ? null : draft;
  const enteredTons = massDraft ? massDraft.exactTons ?? parseCompleteQuantity(massDraft.text) : null;
  const value = sheetOrder && massDraft
    ? enteredTons === null ? "" : String(sheetsForOrderTons(sheetOrder, enteredTons))
    : typeof draft === "string" ? draft : savedValue;
  const enteredQuantity = chosenQuantity(value);
  const corrected = correctQuantityValue(value);
  const correctedQuantity = chosenQuantity(corrected.value);
  const quantity = wholeQuantity && enteredQuantity !== null ? correctedQuantity : enteredQuantity;
  const needsQuote = requiresCatalogPriceQuote(variant);
  const madeToOrder = storefrontAvailability(variant.availability) === "ON_ORDER";
  const canAdd = madeToOrder || !needsQuote;
  const canPromptForQuantity = !line && (value === "" || (startEmpty && quantity === 0));
  const enteringFraction = (massDraft?.text ?? value) === "0,";
  const shouldRemove = !!line && quantity === 0;
  const saved = !!line && !line.invalidReason && quantity === savedQuantity;
  const valid = quantity !== null && quantity > 0 && quantity <= maximum
    && acceptsQuantity(quantity);
  const total = !variant.quoteOnly && variant.price !== null && (valid || shouldRemove)
    ? calculateLineTotal(pricingQuantity(quantity), variant.price) : null;
  const quantityUnit = sheetOrder ? "шт." : getQuantityUnit(variant);
  const orderTons = sheetOrder && quantity !== null ? sheetOrderTons(sheetOrder, quantity) : null;

  function acceptsQuantity(amount: number) {
    // A legacy area-priced cart line can retain its original area until edited.
    return !wholeQuantity || Number.isInteger(amount) || !!sheetOrder && amount === savedQuantity;
  }

  function pricingQuantity(amount: number) {
    return line && amount === savedQuantity ? line.quantity : amount * quantityPerSheet;
  }

  function canSubmitQuantity(quantity: number | null): quantity is number {
    return quantity !== null && quantity > 0 && quantity <= maximum
      && acceptsQuantity(quantity)
      && (needsQuote || calculateLineTotal(pricingQuantity(quantity), variant.price!) !== null);
  }

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function chosenQuantity(rawValue: string) {
    const parsed = parseCompleteQuantity(rawValue);
    return savedQuantity !== undefined && parsed === parseOrderQuantity(savedValue) ? savedQuantity : parsed;
  }

  function correctQuantityValue(rawValue: string) {
    if (line && (rawValue === "" || rawValue === "0,")) return {value: savedValue};
    const numeric = chosenQuantity(rawValue);
    if (numeric === null || (numeric === 0 && (!wholeQuantity || !rawValue.includes(",")))) return {value: rawValue};
    if (numeric === savedQuantity && numeric <= maximum && acceptsQuantity(numeric)) return {value: savedValue};
    const corrected = correctOrderQuantity(rawValue, {
      whole: wholeQuantity, minimum: wholeQuantity ? 1 : undefined, maximum, decimalPlaces: productOrderFractionDigits(numeric),
    });
    return {value: corrected.value.replace(".", ","), message: corrected.value === "" ? corrected.message : undefined};
  }

  function submit() {
    if (!hydrated || removed) return;
    if (canPromptForQuantity) {
      setCorrection("Укажите количество больше нуля.", orderQuantityHintDuration);
      return;
    }
    if (enteredQuantity === null) return;
    setDraft(corrected.value);
    if (corrected.message) setCorrection(corrected.message);
    if (shouldRemove) {
      removeItem(variant.id);
      setDraft(null);
      setCorrection("");
      setRemoved(true);
      return;
    }
    if (!canAdd || !canSubmitQuantity(correctedQuantity)) return;
    if (line && !line.invalidReason && correctedQuantity === savedQuantity) {setDraft(null); return;}
    if (line) updateQuantity(variant.id, pricingQuantity(correctedQuantity));
    else addItem(variant.id, pricingQuantity(correctedQuantity));
    setDraft(null);
    setCorrection("");
  }

  function correctQuantity() {
    if (typeof draft !== "string") return;
    const next = correctQuantityValue(draft);
    if (next.value !== draft) setDraft(next.value);
    if (next.message) setCorrection(next.message);
  }

  function changeTons(text: string) {
    if (!sheetOrder) return;
    const minimum = sheetOrderTons(sheetOrder, 1);
    const maximum = sheetOrderTons(sheetOrder, MAX_ORDER_PIECES);
    const constrained = constrainOrderQuantityInput(text, maximum, formatSheetTons);
    const shown = massDraft?.text ?? (orderTons === null ? "" : formatSheetTons(orderTons));
    const parsed = parseCompleteQuantity(constrained.value);
    const sameDisplay = parsed !== null && parsed > 0 && parsed === parseCompleteQuantity(shown);
    const exactTons = sameDisplay ? (massDraft ? massDraft.exactTons : orderTons ?? undefined) : undefined;
    const correction = correctDraftPrecision(constrained.value, sheetTonDecimals, {minimum, maximum},
      tons => sheetOrderTons(sheetOrder, sheetsForOrderTons(sheetOrder, tons)));
    setDraft({text: correction?.text ?? constrained.value,
      exactTons: exactTons ?? (constrained.capped ? maximum : correction?.exactQuantity)});
    setCorrection("");
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
  const quoteTons = quoteQuantity === null ? null : sheetOrder ? orderTons : variant.unit === "ton" ? quoteQuantity
    : variant.unit === "kg" ? quoteQuantity / 1000
      : variant.unit === "meter" && weightPerMeter !== undefined ? quoteQuantity * weightPerMeter / 1000 : null;
  const statusId = `quantity-status-${view}-${variant.id}`;
  const deliveryId = madeToOrder ? `${statusId}-delivery` : undefined;
  const amountTooSmall = !needsQuote && valid && total === null;
  const quantityError = draft !== null && !canPromptForQuantity && value !== "" && !enteringFraction
    && (!valid || amountTooSmall) && !shouldRemove;
  const quoteClassName = `${styles.quoteButton} ${actionClass}`;
  const action = !canAdd && !shouldRemove && !removed ? (
    enteringFraction || (quantityError && !canSubmitQuantity(correctedQuantity))
      ? <Button type="button" className={quoteClassName} disabled>Запросить цену</Button>
      : <QuoteRequestButton label="Запросить цену"
        order={{product: formatQuoteProductName(variant), quantity: quoteQuantity, unit: quantityUnit, tons: quoteTons}}
        className={quoteClassName}/>
  ) : (
    <Button type="button" aria-describedby={deliveryId} onClick={submit}
      disabled={!hydrated || saved || removed
        || (!shouldRemove && (!canAdd || (!canPromptForQuantity && (enteringFraction || !canSubmitQuantity(correctedQuantity)))))}
      className={`${stateClass} ${actionClass}`}>{label}</Button>
  );
  const unitInsideField = view === "table" && showUnit && !sheetOrder;
  const quantityInput = <CatalogOrderInput inputMode={wholeQuantity ? "numeric" : "decimal"} value={value}
    mode={sheetOrder ? "meter" : undefined}
    label={`Количество ${variant.name}, ${quantityUnit}`}
    visibleLabel={view === "card" ? `Заказ, ${quantityUnit}` : undefined}
    invalid={quantityError && !massDraft} statusId={statusId}
    onChange={value => {
      setDraft(constrainOrderQuantityInput(value, maximum).value);
      setCorrection("");
    }}
    onBlur={correctQuantity}
    className={unitInsideField ? "pl-2 pr-10" : undefined}/>;
  const quantityField = unitInsideField ? <CatalogVariantQuantity unit={quantityUnit}>{quantityInput}</CatalogVariantQuantity> : quantityInput;
  const massField = sheetOrder && <CatalogOrderInput mode="ton" value={massDraft?.text ?? (orderTons === null ? "" : formatSheetTons(orderTons))}
    label={`Масса ${variant.name}, т`} visibleLabel={view === "card" ? "Заказ, т" : undefined}
    invalid={quantityError && !!massDraft} statusId={statusId} onChange={changeTons} onBlur={() => {
      if (massDraft) setDraft(enteredTons === null ? line ? null : "" : value);
    }}/>;
  const totalOutput = <output data-price={total !== null || undefined}
    data-long-value={!!sheetOrder && total !== null && total >= 1_000_000_000 || undefined}
    aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={total === null ? "text-xs text-slate-500 dark:text-slate-400" : "font-semibold tabular-nums"}>
    {total === null ? variant.price === null || variant.quoteOnly ? "По запросу" : "Укажите количество"
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(total)}`}
  </output>;
  const status = <span id={statusId} aria-live="polite" className={`mt-1 block text-xs ${quantityError
    ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
    {wholeQuantity && valid && !removed && <span className="block">{quantity} {quantityUnit}</span>}
    {line && valid && !saved && <span className="block whitespace-nowrap">Не сохранено</span>}
    {amountTooSmall ? "Увеличьте количество. Сумма позиции должна быть больше 0 ₽."
      : correction || (quantityError ? wholeQuantity ? `Введите целое количество от 1 до ${maximum}.` : `Введите количество больше 0 и не больше ${maximum}.` : "")}
  </span>;
  return <CatalogVariantOrder view={view} quantity={quantityField} secondaryQuantity={massField} quantityColSpan={quantityColSpan}
    total={totalOutput} action={action} status={status} deliveryId={deliveryId}/>;
}

function parseCompleteQuantity(value: string) {
  return value === "0," ? null : parseOrderQuantity(value);
}

function formatSheetTons(value: number) {
  return formatQuantityForInput(value, false, sheetTonDecimals);
}
