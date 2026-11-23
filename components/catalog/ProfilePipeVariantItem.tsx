"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
import {correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {correctDraftPrecision, formatMeasuredQuantity, measuredTonFractionDigits, normalizeCartQuantityDraft, quantityTransferHandlers} from "@/lib/cartQuantityInput";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {hasConfirmedProfilePipePrice, MAX_PROFILE_PIPE_PIECES, profilePipeMassPerMeter,
  profilePipeOrder, profilePipeOrderByQuantity, profilePipePricePerTon, profilePipeSize, type ProfilePipeOrderUnit} from "@/lib/profilePipe";
import type {ProductVariant} from "@/types/product";
import type {OrderInputMode} from "@/types/cart";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {CatalogOrderInput} from "./CatalogOrderInput";
import {CatalogVariantLayout, CatalogVariantOrder} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {useOrderDraft} from "./OrderDraftProvider";

const orderUnits = {piece: "шт.", meter: "м", ton: "т"} as const;
const maximumPiecesMessage = `Не более ${MAX_PROFILE_PIPE_PIECES} труб за заказ.`;

export function ProfilePipeVariantItem({variant, view}: {variant: ProductVariant; view: "table" | "card"}) {
  const {addItem, updatePieceOrder, removeItem, lines, hydrated} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const savedLength = line?.pieceOrder?.lengthMeters ?? variant.lengthMeters;
  const savedPieces = line?.pieceOrder?.pieces ?? (line && savedLength ? line.quantity / savedLength : undefined);
  const {draft, setDraft, message, setMessage} = useOrderDraft<{
    quantity: string; length: string; inputUnit: ProfilePipeOrderUnit; settled?: boolean; exactQuantity?: number;
  }, string | undefined>(variant.id, "profile-pipe", undefined);
  const [removed, setRemoved] = useState(false);
  const mass = profilePipeMassPerMeter(variant);
  // Existing cart lines are stored as whole pipes with a specific length.
  const inputUnit = draft?.inputUnit ?? (savedPieces === undefined ? "meter" : "piece");
  const quantityText = draft?.quantity ?? (savedPieces === undefined ? "" : String(savedPieces));
  const lengthText = draft?.length ?? (savedLength === undefined ? "" : String(savedLength));
  const enteringFraction = quantityText === "0,";
  const quantity = draft?.exactQuantity ?? (enteringFraction ? null : parseOrderQuantity(quantityText));
  const length = parseOrderQuantity(lengthText);
  const range = variant.lengthRangeMeters;
  const validLength = variant.lengthMeters ?? (range && length !== null
    && length >= range[0] && length <= range[1] ? length : undefined);
  const order = quantity !== null && quantity > 0 && validLength !== undefined
    ? profilePipeOrderByQuantity(variant, quantity, inputUnit, validLength) : null;
  const confirmedPrice = hasConfirmedProfilePipePrice(variant);
  const pricePerTon = profilePipePricePerTon(variant);
  const saved = !!line && !line.invalidReason && !!order
    && order.pieces === savedPieces && order.lengthMeters === savedLength;
  const shouldRemove = !!line && quantity === 0;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : saved
    ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : line ? "Обновить" : "В корзину";
  const buttonClass = removed ? filterStyles.removedCartButton : shouldRemove ? filterStyles.removeCartButton
    : saved ? filterStyles.savedCartButton : line ? filterStyles.updateCartButton : filterStyles.cartButton;
  const actionSize = view === "card" ? "w-full" : tableStyles.tableAction;
  const priceLabel = pricePerTon !== undefined ? formatUnitPrice(pricePerTon, "за тонну")
    : "По запросу";
  const totalLabel = !confirmedPrice ? priceLabel : !order || order.estimatedTotal === null
    ? range && validLength === undefined ? "Выберите длину" : "Укажите объём"
    : formatCurrency(order.estimatedTotal);
  const piecesError = inputUnit === "piece" && (quantity === null || !Number.isSafeInteger(quantity) || quantity > MAX_PROFILE_PIPE_PIECES);
  const missingMass = inputUnit === "ton" && mass === null;
  const exceedsLimit = inputUnit !== "piece" && quantity !== null && quantity > 0 && validLength !== undefined && !order && !missingMass;
  const quantityError = !!quantityText.trim() && !enteringFraction && !shouldRemove && (piecesError || quantity === null || quantity === 0 || exceedsLimit || missingMass);
  const lengthError = !!range && !!lengthText.trim() && validLength === undefined;
  let validationMessage: string | undefined;
  if (lengthError) validationMessage = `Введите длину от ${formatNumber(range[0])} до ${formatNumber(range[1])} м.`;
  else if (exceedsLimit) validationMessage = maximumPiecesMessage;
  else if (missingMass) validationMessage = "Для расчёта по весу нужна масса одного метра трубы.";
  else if (quantityError) validationMessage = inputUnit === "piece"
    ? `Введите целое количество труб от 1 до ${MAX_PROFILE_PIPE_PIECES}.` : "Введите объём больше нуля.";
  else if (range && quantity !== null && quantity > 0 && validLength === undefined) validationMessage = "Укажите длину одной трубы.";
  const status = validationMessage ?? message;
  const showUnsaved = !!line && !saved && !shouldRemove && !!order;
  const statusId = `profile-pipe-order-status-${view}-${variant.id}`;
  const statusSpacing = view === "table" ? "mx-auto mt-1 max-w-32" : "mt-1";
  const nextDraft = {quantity: quantityText, length: lengthText, inputUnit, settled: draft?.settled, exactQuantity: draft?.exactQuantity};
  const correctedOrder = correctOrderValues().order;

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function correctLengthValue(rawValue: string): {value: string; message?: string} {
    if (variant.lengthMeters !== undefined) return {value: formatCatalogNumber(variant.lengthMeters)};
    if (!range || !parseOrderQuantity(rawValue)) return {value: rawValue};
    const corrected = correctOrderQuantity(rawValue, {minimum: range[0], maximum: range[1], decimalPlaces: 2});
    const value = corrected.value.replace(".", ",");
    return {value, message: corrected.capped || corrected.message ? `Длина трубы скорректирована до ${value} м.` : undefined};
  }

  function correctOrderValues() {
    const nextLength = correctLengthValue(lengthText);
    const correctedLength = parseOrderQuantity(nextLength.value);
    const corrected = quantity !== null && quantity > 0 && correctedLength !== null
      ? profilePipeOrderByQuantity(variant, quantity, inputUnit, correctedLength) : null;
    return {length: nextLength.value, order: corrected, message: nextLength.message};
  }

  function measuredValue(mode: OrderInputMode) {
    const actual = mode === "meter" ? order?.meters : order?.weightTons;
    if (mode === inputUnit && (!draft?.settled || actual == null)) return quantityText;
    return actual == null ? "" : formatMeasuredQuantity(actual, mode);
  }

  function updateMeasuredQuantity(mode: OrderInputMode, value: string) {
    const unitKey = mode === "meter" ? "meters" : "weightTons";
    const minimum = profilePipeOrder(variant, 1, validLength)?.[unitKey] ?? undefined;
    const maximum = profilePipeOrder(variant, MAX_PROFILE_PIPE_PIECES, validLength ?? range?.[1])?.[unitKey] ?? Infinity;
    const normalized = normalizeCartQuantityDraft(value, null, null, {maximum, formatMaximum: bound => formatMeasuredQuantity(bound, mode)});
    if (!normalized.accepted || (value !== "" && !value.trim())) return false;
    const entered = parseOrderQuantity(normalized.value);
    const sameAmount = entered !== null && entered > 0 && entered === parseOrderQuantity(measuredValue(mode));
    if (!normalized.capped && order && sameAmount && (mode !== inputUnit || draft?.settled)) return;
    const correction = normalized.capped ? undefined : correctDraftPrecision(normalized.value, mode === "meter" ? 2 : measuredTonFractionDigits,
      {minimum, maximum}, amount => profilePipeOrderByQuantity(variant, amount, mode, validLength)?.[unitKey] ?? undefined);
    setDraft({quantity: correction?.text ?? normalized.value, length: lengthText, inputUnit: mode,
      exactQuantity: normalized.capped ? maximum : sameAmount && draft?.exactQuantity !== undefined ? draft.exactQuantity : correction?.exactQuantity});
    setMessage(undefined);
  }

  function settleLength() {
    if (!range) return;
    const corrected = correctLengthValue(lengthText);
    if (corrected.value !== lengthText) setDraft({...nextDraft, length: corrected.value});
    if (corrected.message) setMessage(corrected.message);
  }

  function submit() {
    if (!hydrated || removed) return;
    const corrected = correctOrderValues();
    setDraft({...nextDraft, length: corrected.length});
    if (corrected.message) setMessage(corrected.message);
    if (line && shouldRemove) {
      removeItem(variant.id); setDraft(null); setMessage(undefined); setRemoved(true); return;
    }
    const nextOrder = corrected.order;
    if (!confirmedPrice || !nextOrder || nextOrder.estimatedTotal === null) return;
    if (line && !line.invalidReason && nextOrder.pieces === savedPieces && nextOrder.lengthMeters === savedLength) {
      setDraft(null); return;
    }
    if (line) updatePieceOrder(variant.id, nextOrder.pieces, nextOrder.lengthMeters);
    else addItem(variant.id, nextOrder.meters, undefined, {pieces: nextOrder.pieces, lengthMeters: nextOrder.lengthMeters});
    setDraft(null);
    setMessage(undefined);
  }

  const quoteOrder = correctedOrder;
  const quoteLength = quoteOrder?.lengthMeters ?? validLength;
  const quoteBlocked = !quoteOrder && (lengthError || !!quantityText.trim());
  const quoteClassName = `${filterStyles.quoteButton} ${actionSize} px-3`;
  const action = !confirmedPrice && !shouldRemove && !removed ? quoteBlocked
    ? <Button type="button" disabled aria-describedby={statusId} className={quoteClassName}>Запросить цену</Button>
    : <QuoteRequestButton label="Запросить цену"
    order={{product: quoteLength ? `${variant.name}, длина ${formatNumber(quoteLength)} м` : variant.name,
      quantity: quoteOrder?.pieces ?? null,
      unit: "шт.", meters: quoteOrder?.meters ?? null, tons: quoteOrder?.weightTons,
      requested: quoteOrder && quantity !== null
        ? {quantity, unit: orderUnits[inputUnit]} : undefined}}
    className={quoteClassName}/>
    : <Button type="button" onClick={() => submit()}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!correctedOrder || correctedOrder.estimatedTotal === null))}
      className={`${buttonClass} ${actionSize} px-3`}>{label}</Button>;

  const inputClassName = `${filterStyles.field} min-w-0 px-2 text-center tabular-nums ${view === "table" ? "max-w-[6.375rem]" : ""}`;
  const lengthField = range ? <Input type="text" inputMode="decimal"
    aria-label={`Длина одной трубы для ${variant.name}`} value={lengthText}
    aria-invalid={lengthError || undefined}
    aria-describedby={`${statusId}-range ${statusId}`}
    {...quantityTransferHandlers(setMessage)}
    onChange={event => {
      setDraft({...nextDraft, length: event.target.value});
      setMessage(undefined);
    }}
    onBlur={settleLength}
    onKeyDown={event => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    }}
    className={inputClassName}/>
    : null;
  const total = <output data-price={order?.estimatedTotal != null || undefined}
    aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={order && order.estimatedTotal !== null
      ? "font-semibold tabular-nums text-slate-900 dark:text-slate-100" : "text-xs font-normal text-slate-500 dark:text-slate-400"}>{totalLabel}</output>;

  const lengths = variant.lengthRangeMeters?.map(value => formatNumber(value)).join("–")
    ?? (variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters));
  const size = profilePipeSize(variant).replace("×", " × ");
  const thickness = formatNumber(variant.wallThicknessMm!);
  const lengthLabel = lengths === undefined ? "Уточняется" : `${lengths}\u00a0м`;
  const fields = [
    {label: "Размер профиля", value: `${size} мм`},
    {label: "Толщина стенки", value: `${thickness} мм`},
    {label: "Длина по каталогу", value: lengthLabel},
    {label: "Теоретическая масса", value: mass === null ? undefined : `${formatNumber(mass)} кг/м`},
    {label: "Марка стали", value: variant.steelGrade},
    {label: "Стандарт", value: variant.standard},
  ];
  const lengthControl = lengthField && <label className="block text-sm">
    {lengthField}
    <span id={`${statusId}-range`} className="mt-1 block text-xs font-normal tabular-nums text-slate-600 dark:text-slate-400">{lengthLabel}</span>
  </label>;
  function measuredInput(mode: OrderInputMode) {
    const measuredInTons = mode === "ton";
    const label = measuredInTons ? "Вес заказа в тоннах" : "Длина заказа";
    const disabled = measuredInTons && mass === null;
    return <CatalogOrderInput label={`${label} для ${variant.name}`} value={measuredValue(mode)}
      visibleLabel={view === "card" ? `Заказ, ${orderUnits[mode]}` : undefined}
      placeholder={disabled ? "—" : "0"} disabled={disabled}
      invalid={quantityError && mode === inputUnit} statusId={statusId}
      onChange={value => updateMeasuredQuantity(mode, value)}
      onBlur={() => {if (draft && inputUnit === mode && !draft.settled) setDraft({...nextDraft, settled: true});}}/>;
  }

  const cardFields = [
    {label: "Стенка", value: `${thickness}\u00a0мм`},
    {label: "Длина", value: lengthControl ?? lengthLabel},
    {label: "Цена", value: priceLabel},
  ];

  return <CatalogVariantLayout view={view} variant={variant} name={view === "table" ? size : variant.name}
    tableSpecifications={[thickness, lengthControl ?? lengths ?? "—"]}
    cardFields={cardFields}
    specifications={null}
    details={<CatalogPositionDetails productName={variant.name} fields={fields}/>}
    price={priceLabel}
    order={<CatalogVariantOrder view={view} quantity={measuredInput("meter")}
      secondaryQuantity={measuredInput("ton")} action={action} total={total}
      status={<span id={statusId} className={`block text-xs ${statusSpacing} ${quantityError || lengthError
        ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
        role="status" aria-atomic="true">
        {order && <span className="block">{order.pieces} шт.</span>}
        {showUnsaved && <span className="block whitespace-nowrap">Не сохранено</span>}
        {status && <span className="block">{status}</span>}
      </span>}/>}/>;
}
