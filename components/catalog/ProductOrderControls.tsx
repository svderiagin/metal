"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
import {getQuantityUnit, requiresWholeCatalogQuantity} from "@/lib/variantPresentation";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import {constrainOrderQuantityInput, correctOrderQuantity, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {formatQuantityForInput, productOrderFractionDigits, quantityTransferHandlers} from "@/lib/cartQuantityInput";
import {calculateLineTotal} from "@/lib/orderMeasurement";
import {formatCurrency} from "@/lib/currency";
import {storefrontAvailability} from "@/lib/catalogOffer";
import {CatalogVariantOrder, CatalogVariantQuantity} from "./CatalogVariantLayout";
import styles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {useOrderDraft} from "./OrderDraftProvider";

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
  const needsQuote = variant.price === null || !Number.isFinite(variant.price) || variant.price < 0
    || variant.quoteOnly || variant.priceQualifier === "from";
  const madeToOrder = storefrontAvailability(variant.availability) === "ON_ORDER";
  const canPurchase = !needsQuote && !madeToOrder;
  const shouldRemove = !madeToOrder && !!line && quantity === 0;
  const saved = !!line && !line.invalidReason && quantity === line.quantity;
  const valid = quantity !== null && quantity > 0 && quantity <= 999
    && (!wholeQuantity || Number.isInteger(quantity));
  const total = !variant.quoteOnly && variant.price !== null && (valid || shouldRemove)
    ? calculateLineTotal(quantity, variant.price) : null;
  const quantityUnit = getQuantityUnit(variant);
  const correctedQuantity = parseOrderQuantity(correctQuantityValue(value).value);
  const canSubmitQuantity = quantity !== null && correctedQuantity !== null && correctedQuantity > 0 && correctedQuantity <= 999
    && (!wholeQuantity || Number.isInteger(correctedQuantity)) && variant.price !== null
    && calculateLineTotal(correctedQuantity, variant.price) !== null;

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function chosenQuantity(rawValue: string) {
    const parsed = parseOrderQuantity(rawValue);
    return line && parsed === parseOrderQuantity(savedValue) ? line.quantity : parsed;
  }

  function correctQuantityValue(rawValue: string) {
    if (!rawValue.trim() && line) return {value: savedValue};
    const numeric = chosenQuantity(rawValue);
    if (numeric === null || numeric === 0) return {value: rawValue};
    if (numeric === line?.quantity && numeric <= 999 && (!wholeQuantity || Number.isInteger(numeric))) return {value: savedValue};
    const corrected = correctOrderQuantity(rawValue, {whole: wholeQuantity, maximum: 999, decimalPlaces: productOrderFractionDigits(numeric)});
    return {...corrected, value: corrected.value.replace(".", ",")};
  }

  function submit(rawValue = value) {
    const rawQuantity = chosenQuantity(rawValue);
    if (!hydrated || removed || madeToOrder || rawQuantity === null) return;
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
    if (!canPurchase || nextQuantity === null || nextQuantity <= 0 || nextQuantity > 999
      || (wholeQuantity && !Number.isInteger(nextQuantity)) || variant.price === null
      || calculateLineTotal(nextQuantity, variant.price) === null) return;
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
        : line && canPurchase ? styles.updateCartButton : styles.cartButton;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : !canPurchase ? "Под заказ"
    : saved ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : line ? "Обновить" : "В корзину";
  const actionClass = `${view === "card" ? "w-full" : tableStyles.tableAction} px-3`;
  const quoteQuantity = valid && (draft !== null || line || !needsQuote) ? quantity : null;
  const weightPerMeter = variant.weightPerMeterKg ?? (variant.weight?.unit === "кг/м" ? variant.weight.value : undefined);
  const quoteTons = quoteQuantity === null ? null : variant.unit === "ton" ? quoteQuantity
    : variant.unit === "kg" ? quoteQuantity / 1000
      : variant.unit === "meter" && weightPerMeter !== undefined ? quoteQuantity * weightPerMeter / 1000 : null;
  const action = madeToOrder || (needsQuote && !shouldRemove && !removed) ? (
    <QuoteRequestButton label={madeToOrder ? "Под заказ" : "Запросить цену"}
      order={{product: formatQuoteProductName(variant), quantity: quoteQuantity, unit: getQuantityUnit(variant), tons: quoteTons}}
      className={`${styles.quoteButton} ${actionClass}`}/>
  ) : (
    <Button type="button" onClick={() => submit()}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!canPurchase || !canSubmitQuantity))}
      className={`${stateClass} ${actionClass}`}>{label}</Button>
  );
  const amountTooSmall = canPurchase && valid && total === null;
  const quantityError = draft !== null && value.trim() !== "" && (!valid || amountTooSmall) && !shouldRemove;
  const statusId = `quantity-status-${view}-${variant.id}`;
  const unitInsideField = view === "table" && showUnit;
  const quantityInput = <Input type="text" inputMode={wholeQuantity ? "numeric" : "decimal"} value={value}
        aria-label={`Количество ${variant.name}, ${quantityUnit}`}
        aria-invalid={quantityError || undefined}
        aria-describedby={statusId}
        {...quantityTransferHandlers(setCorrection)}
        onChange={event => {
          const next = constrainOrderQuantityInput(event.target.value, 999);
          setDraft(next.value);
          setCorrection("");
        }}
        onBlur={correctQuantity}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`${styles.field} min-w-0 ${unitInsideField ? "pl-2 pr-10" : "px-2"} tabular-nums focus:placeholder:text-transparent`}
        placeholder="0"/>;
  const input = unitInsideField ? <CatalogVariantQuantity unit={quantityUnit}>{quantityInput}</CatalogVariantQuantity> : quantityInput;
  const quantityField = view === "card" ? <label className="block text-sm font-semibold">
    <span className="mb-1 block">Заказ, {quantityUnit}</span>{input}
  </label> : input;
  const totalOutput = <output data-price={total !== null || undefined} aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={total === null ? "text-xs text-slate-500 dark:text-slate-400" : "font-semibold tabular-nums"}>
    {total === null ? variant.price === null || variant.quoteOnly ? "По запросу" : "Укажите количество"
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(total)}`}
  </output>;
  const status = <span id={statusId} aria-live="polite" className={`mt-1 block text-xs ${quantityError
    ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
    {wholeQuantity && valid && !removed && <span className="block">{quantity} {quantityUnit}</span>}
    {!madeToOrder && line && !saved && !shouldRemove && <span className="block whitespace-nowrap">Не сохранено</span>}
    {amountTooSmall ? "Увеличьте количество. Сумма позиции должна быть больше 0 ₽."
      : correction || (quantityError ? wholeQuantity ? "Введите целое количество от 1 до 999." : "Введите количество больше 0 и не больше 999." : "")}
  </span>;
  return <CatalogVariantOrder view={view} quantity={quantityField} total={totalOutput} action={action} status={status}/>;
}
