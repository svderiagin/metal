"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {correctDraftPrecision, formatMeasuredQuantity, formatRebarOrderTons, measuredTonFractionDigits, normalizeCartQuantityDraft, rebarTonFractionDigits} from "@/lib/cartQuantityInput";
import {MAX_ORDER_TONS} from "@/lib/constants";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {storefrontAvailability} from "@/lib/catalogOffer";
import {hasConfirmedProfilePipePrice, isSquareProfilePipe, MAX_RECTANGULAR_PIPE_PIECES, profilePipeMassPerMeter,
  profilePipeMaximumPieces, profilePipeOrder, profilePipeOrderByQuantity, profilePipePricePerTon, profilePipeSize, type ProfilePipeOrderUnit} from "@/lib/profilePipe";
import type {ProductVariant} from "@/types/product";
import type {OrderInputMode} from "@/types/cart";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {CatalogOrderInput} from "./CatalogOrderInput";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantSpecifications} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {orderQuantityHintDuration, useOrderDraft} from "./OrderDraftProvider";

const orderUnits = {piece: "шт.", meter: "м", ton: "т"} as const;
export function ProfilePipeVariantItem({variant, view}: {variant: ProductVariant; view: "table" | "card"}) {
  const {addItem, updatePieceOrder, removeItem, lines, hydrated} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const savedLength = line?.pieceOrder?.lengthMeters ?? variant.lengthMeters;
  const savedPieces = line?.pieceOrder?.pieces ?? (line && savedLength ? line.quantity / savedLength : undefined);
  const {draft, setDraft, message, setMessage} = useOrderDraft<{
    quantity: string; length: string; inputUnit: ProfilePipeOrderUnit; settled?: boolean; exactQuantity?: number;
  }, string | undefined>(variant.id, "profile-pipe", undefined);
  const [removed, setRemoved] = useState(false);
  const square = isSquareProfilePipe(variant);
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
  const order = resolveOrder(validLength);
  const confirmedPrice = hasConfirmedProfilePipePrice(variant);
  const madeToOrder = storefrontAvailability(variant.availability) === "ON_ORDER";
  const pricePerTon = profilePipePricePerTon(variant);
  const saved = !!line && !line.invalidReason && !!order
    && order.pieces === savedPieces && order.lengthMeters === savedLength;
  const shouldRemove = !!line && quantity === 0;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : saved
    ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : line ? "Обновить" : madeToOrder ? "Заказать" : "В корзину";
  const buttonClass = removed ? filterStyles.removedCartButton : shouldRemove ? filterStyles.removeCartButton
    : saved ? filterStyles.savedCartButton : line ? filterStyles.updateCartButton : filterStyles.cartButton;
  const actionSize = view === "card" ? "w-full" : tableStyles.tableAction;
  const priceLabel = pricePerTon !== undefined ? formatUnitPrice(pricePerTon, "за тонну")
    : "По запросу";
  const totalLabel = !confirmedPrice ? priceLabel : !order || order.estimatedTotal === null
    ? range && validLength === undefined ? "Выберите длину" : "Укажите объём"
    : formatCurrency(order.estimatedTotal);
  const piecesError = inputUnit === "piece" && (quantity === null || !Number.isSafeInteger(quantity)
    || (!square && quantity > MAX_RECTANGULAR_PIPE_PIECES));
  const missingMass = inputUnit === "ton" && mass === null;
  const exceedsLimit = inputUnit !== "piece" && quantity !== null && quantity > 0 && validLength !== undefined && !order && !missingMass;
  const quantityError = !!quantityText.trim() && !enteringFraction && !shouldRemove && (piecesError || quantity === null || quantity === 0 || exceedsLimit || missingMass);
  const lengthError = !!range && !!lengthText.trim() && validLength === undefined;
  let validationMessage: string | undefined;
  if (lengthError) validationMessage = `Введите длину от ${formatNumber(range[0])} до ${formatNumber(range[1])} м.`;
  else if (exceedsLimit) validationMessage = square
    ? `Не удалось рассчитать объём в пределах ${MAX_ORDER_TONS} т.`
    : `Не более ${MAX_RECTANGULAR_PIPE_PIECES} труб за заказ.`;
  else if (missingMass) validationMessage = "Для расчёта по весу нужна масса одного метра трубы.";
  else if (quantityError) validationMessage = inputUnit === "piece"
    ? square ? "Введите целое количество труб." : `Введите целое количество труб от 1 до ${MAX_RECTANGULAR_PIPE_PIECES}.`
    : "Введите объём больше нуля.";
  else if (range && quantity !== null && quantity > 0 && validLength === undefined) validationMessage = "Укажите длину одной трубы.";
  const status = validationMessage ?? message;
  const showUnsaved = !!line && !saved && !shouldRemove && !!order;
  const statusId = `profile-pipe-order-status-${view}-${variant.id}`;
  const deliveryId = madeToOrder ? `${statusId}-delivery` : undefined;
  const statusSpacing = view === "table" ? "mx-auto mt-1 max-w-32" : "mt-1";
  const nextDraft = {quantity: quantityText, length: lengthText, inputUnit, settled: draft?.settled, exactQuantity: draft?.exactQuantity};
  const correctedOrder = correctOrderValues().order;
  const canAddOrder = correctedOrder && (confirmedPrice ? correctedOrder.estimatedTotal !== null : madeToOrder);
  const canPromptForQuantity = quantityText === "";

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
    return {length: nextLength.value, order: resolveOrder(parseOrderQuantity(nextLength.value) ?? undefined), message: nextLength.message};
  }

  function quantityLimit(mode: ProfilePipeOrderUnit, length: number) {
    const pieces = profilePipeMaximumPieces(variant, length);
    if (pieces === null || mode === "piece") return pieces;
    const maximum = profilePipeOrder(variant, pieces, length);
    return (mode === "meter" ? maximum?.meters : maximum?.weightTons) ?? null;
  }

  function resolveOrder(length: number | undefined) {
    if (quantity === null || quantity <= 0 || length === undefined) return null;
    // A different pipe length can change the maximum after an amount was entered.
    const limit = square ? quantityLimit(inputUnit, length) : null;
    return profilePipeOrderByQuantity(variant, limit === null ? quantity : Math.min(quantity, limit), inputUnit, length);
  }

  function displayQuantity(value: number, mode: OrderInputMode) {
    return square && mode === "ton" ? formatRebarOrderTons(value, true) : formatMeasuredQuantity(value, mode);
  }

  function measuredValue(mode: OrderInputMode) {
    const actual = mode === "meter" ? order?.meters : order?.weightTons;
    if (mode === inputUnit && (!draft?.settled || actual == null)) return quantityText;
    return actual == null ? "" : displayQuantity(actual, mode);
  }

  function updateMeasuredQuantity(mode: OrderInputMode, value: string) {
    const unitKey = mode === "meter" ? "meters" : "weightTons";
    const minimum = profilePipeOrder(variant, 1, validLength)?.[unitKey] ?? undefined;
    const limitLength = validLength ?? (square ? undefined : range?.[1]);
    const maximum = limitLength === undefined ? Infinity : quantityLimit(mode, limitLength) ?? Infinity;
    const normalized = normalizeCartQuantityDraft(value, null, null, {maximum, formatMaximum: bound => displayQuantity(bound, mode)});
    const entered = parseOrderQuantity(normalized.value);
    const sameAmount = entered !== null && entered > 0 && entered === parseOrderQuantity(measuredValue(mode));
    if (!normalized.capped && order && sameAmount && (mode !== inputUnit || draft?.settled)) return;
    const precision = mode === "meter" ? 2 : square ? rebarTonFractionDigits : measuredTonFractionDigits;
    const correction = normalized.capped ? undefined : correctDraftPrecision(normalized.value, precision,
      {minimum, maximum}, amount => profilePipeOrderByQuantity(variant, amount, mode, validLength)?.[unitKey] ?? undefined);
    const exact = sameAmount && draft?.exactQuantity !== undefined ? draft.exactQuantity : correction?.exactQuantity;
    setDraft({quantity: correction?.text ?? normalized.value, length: lengthText, inputUnit: mode,
      exactQuantity: normalized.capped ? maximum : exact ?? (square && correction ? entered ?? undefined : undefined)});
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
    if (canPromptForQuantity) {
      setMessage("Укажите длину или вес больше нуля.", orderQuantityHintDuration);
      return;
    }
    const corrected = correctOrderValues();
    setDraft({...nextDraft, length: corrected.length});
    if (corrected.message) setMessage(corrected.message);
    if (line && shouldRemove) {
      removeItem(variant.id); setDraft(null); setMessage(undefined); setRemoved(true); return;
    }
    const nextOrder = corrected.order;
    if (!nextOrder || (confirmedPrice ? nextOrder.estimatedTotal === null : !madeToOrder)) return;
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
  const action = !madeToOrder && !confirmedPrice && !shouldRemove && !removed ? quoteBlocked
    ? <Button type="button" disabled aria-describedby={statusId} className={quoteClassName}>Запросить цену</Button>
    : <QuoteRequestButton label="Запросить цену"
    order={{product: quoteLength ? `${variant.name}, длина ${formatNumber(quoteLength)} м` : variant.name,
      quantity: quoteOrder?.pieces ?? null,
      unit: "шт.", meters: quoteOrder?.meters ?? null, tons: quoteOrder?.weightTons,
      requested: quoteOrder && quantity !== null
        ? {quantity, unit: orderUnits[inputUnit]} : undefined}}
    className={quoteClassName}/>
    : <Button type="button" aria-describedby={square ? [statusId, deliveryId].filter(Boolean).join(" ") : deliveryId} onClick={submit}
      disabled={!hydrated || saved || removed || (!shouldRemove && !canAddOrder && !canPromptForQuantity)}
      className={`${buttonClass} ${actionSize} px-3`}>{label}</Button>;

  const lengthField = range ? <CatalogOrderInput label={`Длина одной трубы для ${variant.name}`} value={lengthText}
    invalid={lengthError} statusId={`${statusId}-range ${statusId}`} placeholder=""
    onChange={value => {
      setDraft({...nextDraft, length: value});
      setMessage(undefined);
    }}
    onBlur={settleLength}
    className={`px-2 text-center ${view === "table" ? "max-w-[6.375rem]" : ""}`}/>
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
    return <CatalogOrderInput mode={mode} label={`${label} для ${variant.name}`} value={measuredValue(mode)}
      visibleLabel={view === "card" ? `Заказ, ${orderUnits[mode]}` : undefined}
      placeholder={disabled ? "—" : "0"} disabled={disabled}
      invalid={quantityError && mode === inputUnit} statusId={statusId}
      onChange={value => updateMeasuredQuantity(mode, value)}
      onBlur={() => {if (draft && inputUnit === mode && !draft.settled) setDraft({...nextDraft, settled: true});}}/>;
  }

  const cardFields = [
    {label: "Стенка", value: `${thickness}\u00a0мм`},
    {label: "Длина", value: lengthControl ?? lengthLabel},
  ];

  return <CatalogVariantLayout view={view} variant={variant} name={view === "table" ? size : variant.name}
    tableSpecifications={[thickness, lengthControl ?? lengths ?? "—"]}
    specifications={<CatalogVariantSpecifications items={cardFields}/>}
    details={<CatalogPositionDetails productName={variant.name} fields={fields}/>}
    price={priceLabel}
    order={<CatalogVariantOrder view={view} quantity={measuredInput("meter")} deliveryId={deliveryId}
      secondaryQuantity={measuredInput("ton")} action={action} total={total}
      status={<span id={statusId} className={`block text-xs ${statusSpacing} ${quantityError || lengthError
        ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
        role="status" aria-atomic="true">
        {order && <span className="block">{order.pieces} шт.</span>}
        {showUnsaved && <span className="block whitespace-nowrap">Не сохранено</span>}
        {status && <span className="block">{status}</span>}
      </span>}/>}/>;
}
