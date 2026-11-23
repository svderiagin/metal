"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
import {constrainOrderQuantityInput, correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {quantityTransferHandlers} from "@/lib/cartQuantityInput";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {hasConfirmedProfilePipePrice, profilePipeOrder, profilePipeSize} from "@/lib/profilePipe";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantSpecifications} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogGuideFigure} from "./CatalogGuideFigure";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {useOrderDraft} from "./OrderDraftProvider";

export function ProfilePipeVariantItem({variant, view}: {variant: ProductVariant; view: "table" | "card"}) {
  const {addItem, updatePieceOrder, removeItem, lines, hydrated} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const savedLength = line?.pieceOrder?.lengthMeters ?? variant.lengthMeters;
  const savedPieces = line?.pieceOrder?.pieces ?? (line && savedLength ? line.quantity / savedLength : undefined);
  const {draft, setDraft, message, setMessage} = useOrderDraft<{
    pieces: string; length: string;
  }, string | undefined>(variant.id, "profile-pipe", undefined);
  const [removed, setRemoved] = useState(false);
  const piecesText = draft?.pieces ?? (savedPieces === undefined ? "" : String(savedPieces));
  const lengthText = draft?.length ?? (savedLength === undefined ? "" : String(savedLength));
  const pieces = parseOrderQuantity(piecesText);
  const length = parseOrderQuantity(lengthText);
  const range = variant.lengthRangeMeters;
  const validPieces = pieces !== null && Number.isSafeInteger(pieces) && pieces > 0 && pieces <= 999 ? pieces : null;
  const validLength = variant.lengthMeters ?? (range && length !== null
    && length >= range[0] && length <= range[1] ? length : undefined);
  const order = validPieces !== null && validLength !== undefined ? profilePipeOrder(variant, validPieces, validLength) : null;
  const confirmedPrice = hasConfirmedProfilePipePrice(variant);
  const saved = !!line && !line.invalidReason && !!order
    && order.pieces === savedPieces && order.lengthMeters === savedLength;
  const shouldRemove = !!line && pieces === 0;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : saved
    ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : line ? "Обновить" : "В корзину";
  const buttonClass = removed ? filterStyles.removedCartButton : shouldRemove ? filterStyles.removeCartButton
    : saved ? filterStyles.savedCartButton : line ? filterStyles.updateCartButton : filterStyles.cartButton;
  const actionSize = view === "card" ? "w-full" : tableStyles.tableAction;
  const priceLabel = confirmedPrice ? formatUnitPrice(variant.price, variant.priceUnit) : "Цена уточняется";
  const totalLabel = !confirmedPrice ? "Цена уточняется" : !order || order.estimatedTotal === null
    ? range && validLength === undefined ? "Выберите длину" : "Укажите количество" : formatCurrency(order.estimatedTotal);
  const piecesError = !!piecesText.trim() && !shouldRemove && validPieces === null;
  const lengthError = !!range && !!lengthText.trim() && validLength === undefined;
  const status = message ?? (piecesError ? "Введите целое количество труб от 1 до 999."
    : lengthError ? `Введите длину от ${formatNumber(range![0])} до ${formatNumber(range![1])} м.`
      : "");
  const statusId = `profile-pipe-order-status-${view}-${variant.id}`;
  const correctedOrder = correctOrderValues().order;

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function correctPiecesValue(rawValue: string) {
    if (!parseOrderQuantity(rawValue)) return {value: rawValue};
    return correctOrderQuantity(rawValue, {whole: true, maximum: 999});
  }

  function correctLengthValue(rawValue: string): {value: string; message?: string} {
    if (variant.lengthMeters !== undefined) return {value: formatCatalogNumber(variant.lengthMeters)};
    if (!range || !parseOrderQuantity(rawValue)) return {value: rawValue};
    const corrected = correctOrderQuantity(rawValue, {minimum: range[0], maximum: range[1], decimalPlaces: 2});
    const value = corrected.value.replace(".", ",");
    return {value, message: corrected.capped || corrected.message ? `Длина трубы скорректирована до ${value} м.` : undefined};
  }

  function correctOrderValues(rawPieces = piecesText, rawLength = lengthText) {
    const nextPieces = correctPiecesValue(rawPieces);
    const nextLength = correctLengthValue(rawLength);
    const correctedPieces = parseOrderQuantity(nextPieces.value);
    const correctedLength = parseOrderQuantity(nextLength.value);
    const corrected = correctedPieces !== null && correctedPieces > 0 && correctedLength !== null
      ? profilePipeOrder(variant, correctedPieces, correctedLength) : null;
    return {pieces: nextPieces.value, length: nextLength.value, order: corrected,
      message: [nextPieces.message, nextLength.message].filter(Boolean).join(" ")};
  }

  function settlePieces() {
    const corrected = correctPiecesValue(piecesText);
    if (corrected.value !== piecesText) setDraft({pieces: corrected.value, length: lengthText});
    if (corrected.message) setMessage(corrected.message);
  }

  function settleLength() {
    if (!range) return;
    const corrected = correctLengthValue(lengthText);
    if (corrected.value !== lengthText) setDraft({pieces: piecesText, length: corrected.value});
    if (corrected.message) setMessage(corrected.message);
  }

  function submit(rawPieces = piecesText, rawLength = lengthText) {
    if (!hydrated || removed) return;
    const corrected = correctOrderValues(rawPieces, rawLength);
    setDraft({pieces: corrected.pieces, length: corrected.length});
    if (corrected.message) setMessage(corrected.message);
    if (line && parseOrderQuantity(rawPieces) === 0) {
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

  const action = !confirmedPrice && !shouldRemove && !removed ? <QuoteRequestButton label="Запросить цену"
    order={{product: validLength ? `${variant.name}, длина ${formatNumber(validLength)} м` : variant.name,
      quantity: validPieces, unit: "шт.", meters: order?.meters ?? null}}
    className={`${filterStyles.quoteButton} ${actionSize} px-3`}/>
    : <Button type="button" onClick={() => submit()}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!correctedOrder || correctedOrder.estimatedTotal === null))}
      className={`${buttonClass} ${actionSize} px-3`}>{label}</Button>;

  const inputClassName = `${filterStyles.field} min-w-0 px-2 text-center tabular-nums ${view === "table" ? "max-w-[6.375rem]" : ""}`;
  const quantityInput = <Input type="text" inputMode="numeric"
    id={`profile-pieces-${view}-${variant.id}`}
    aria-label={`Количество целых труб для ${variant.name}`} value={piecesText}
    aria-invalid={piecesError || undefined}
    aria-describedby={statusId}
    {...quantityTransferHandlers(setMessage)}
    onChange={event => {
      const next = constrainOrderQuantityInput(event.target.value, 999);
      setDraft({pieces: next.value, length: lengthText});
      setMessage(undefined);
    }}
    onBlur={settlePieces}
    onKeyDown={event => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    }} className={inputClassName}/>;
  const lengthField = range ? <Input type="text" inputMode="decimal"
    aria-label={`Длина одной трубы для ${variant.name}`} value={lengthText}
    aria-invalid={lengthError || undefined}
    aria-describedby={`${statusId}-range ${statusId}`}
    {...quantityTransferHandlers(setMessage)}
    onChange={event => {setDraft({pieces: piecesText, length: event.target.value}); setMessage(undefined);}}
    onBlur={settleLength}
    onKeyDown={event => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    }}
    className={inputClassName}/>
    : null;
  const mass = variant.weightConfirmed && variant.weightPerMeterKg !== undefined ? formatNumber(variant.weightPerMeterKg) : undefined;
  const total = <output data-price={order?.estimatedTotal != null || undefined}
    aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={order && order.estimatedTotal !== null
      ? "font-semibold tabular-nums text-slate-900 dark:text-slate-100" : "text-xs font-normal text-slate-500 dark:text-slate-400"}>{totalLabel}</output>;

  const lengths = variant.lengthRangeMeters?.map(value => formatNumber(value)).join("–")
    ?? (variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters));
  const size = profilePipeSize(variant).replace("×", " × ");
  const thickness = formatNumber(variant.wallThicknessMm!);
  const dimensionFields = [
    {label: "Сечение", value: `${size} мм`},
    {label: "Толщина стенки", value: `${thickness} мм`},
  ];
  const lengthLabel = lengths === undefined ? "Уточняется" : `${lengths}\u00a0м`;
  const fields = [
    ...dimensionFields,
    {label: "Длина по каталогу", value: lengthLabel},
    {label: "Теоретическая масса", value: mass ? `${mass} кг/м` : undefined},
    {label: "Марка стали", value: variant.steelGrade},
    {label: "Стандарт", value: variant.standard},
  ];
  const lengthControl = lengthField && <label className="block text-sm">
    {view === "card" && <span className="mb-1 block font-semibold">Длина, м</span>}
    {lengthField}
    {view === "table" && <span id={`${statusId}-range`} className="mt-1 block text-xs tabular-nums text-slate-600 dark:text-slate-400">{lengthLabel}</span>}
  </label>;
  const lengthInOrder = view === "card" && Boolean(range);
  const piecesField = <div>
    {view === "card" && <label htmlFor={`profile-pieces-${view}-${variant.id}`} className="mb-1 block text-sm font-semibold">Заказ, шт.</label>}
    {quantityInput}
    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Заказ, м: <output
      aria-label={`Заказ в метрах для ${variant.name}`} aria-live="polite" className="tabular-nums">{order ? formatNumber(order.meters) : "—"}</output></p>
  </div>;

  return <CatalogVariantLayout view={view} variant={variant} name={view === "table" ? `${size} × ${thickness}` : variant.name}
    tableSpecifications={{cells: <td className="tabular-nums">{lengthControl ?? lengths ?? "—"}</td>}}
    specifications={<div id={range ? `${statusId}-range` : undefined}><CatalogVariantSpecifications items={[{label: "Длина", value: lengthLabel}]}/></div>}
    details={<CatalogPositionDetails title="Характеристики профильной трубы" fields={fields}
      figures={<CatalogGuideFigure diagram={{shape: variant.profileWidthMm === variant.profileHeightMm ? "square" : "rectangle",
        dimensions: dimensionFields.map(({label, value}) => [label, value] as const)}}/>}
      supply={<p>Уточните фактическую длину и марку стали по документам поставки. При заказе по ведомости укажите количество труб каждой длины.</p>}/>}
    price={priceLabel}
    order={<CatalogVariantOrder view={view} quantity={lengthInOrder ? lengthControl : piecesField}
      secondaryQuantity={lengthInOrder ? piecesField : undefined} action={action} total={total}
      status={<span id={statusId} className={`mt-1 block text-xs ${piecesError || lengthError
        ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
        aria-live="polite" aria-atomic="true">
        {!piecesError && validPieces && <span className="block">{validPieces} шт.</span>}
        {line && !saved && !shouldRemove && <span className="block whitespace-nowrap">Не сохранено</span>}
        {status && <span className="block">{status}</span>}
      </span>}/>}/>;
}
