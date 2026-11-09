"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {hasConfirmedProfilePipePrice, profilePipeOrder, profilePipeSize} from "@/lib/profilePipe";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantQuantity, CatalogVariantSpecifications} from "./CatalogVariantLayout";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {useOrderDraft} from "./OrderDraftProvider";

export function ProfilePipeVariantItem({variant, view}: {variant: ProductVariant; view: "table" | "card"}) {
  const {addItem, removeItem, lines, hydrated} = useCart();
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
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : saved ? "✓ В корзине" : line ? "Обновить" : "В корзину";
  const buttonClass = removed ? filterStyles.removedCartButton : shouldRemove ? filterStyles.removeCartButton
    : saved ? filterStyles.savedCartButton : line ? filterStyles.updateCartButton : filterStyles.cartButton;
  const actionSize = view === "card" ? "w-full" : tableStyles.tableAction;
  const priceLabel = confirmedPrice ? formatUnitPrice(variant.price, variant.priceUnit) : "Цена уточняется";
  const totalLabel = !confirmedPrice ? "Цена уточняется" : !order || order.estimatedTotal === null
    ? range && validLength === undefined ? "Выберите длину" : "Укажите количество" : formatCurrency(order.estimatedTotal);
  const status = message ?? (line && !saved ? "Не сохранено" : "");
  const statusId = `profile-pipe-order-status-${view}-${variant.id}`;

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function settlePieces() {
    if (!draft) return;
    const corrected = correctOrderQuantity(piecesText, {whole: true, maximum: 999});
    if (corrected.value !== piecesText) setDraft({...draft, pieces: corrected.value});
    if (corrected.message) setMessage(corrected.message);
  }

  function settleLength() {
    if (!draft || !range || !lengthText.trim()) return;
    if (length === null) {
      setDraft({...draft, length: ""});
      setMessage("Некорректная длина очищена.");
      return;
    }
    const adjusted = Math.max(range[0], Math.min(range[1], length));
    if (adjusted !== length) setMessage(`Длина скорректирована до ${formatNumber(adjusted)} м.`);
    const normalized = formatCatalogNumber(adjusted);
    if (normalized !== lengthText) setDraft({...draft, length: normalized});
  }

  function submit() {
    if (!hydrated || saved || removed) return;
    if (shouldRemove) {removeItem(variant.id); setDraft(null); setMessage(undefined); setRemoved(true); return;}
    if (!confirmedPrice || !order || order.estimatedTotal === null) return;
    addItem(variant.id, order.meters, undefined, {pieces: order.pieces, lengthMeters: order.lengthMeters});
    setDraft(null);
    setMessage(undefined);
  }

  const action = !confirmedPrice && !shouldRemove && !removed ? <QuoteRequestButton label="Запросить цену"
    order={{product: validLength ? `${variant.name}, длина ${formatNumber(validLength)} м` : variant.name,
      quantity: validPieces, unit: "шт.", meters: order?.meters ?? null}}
    className={`${filterStyles.quoteButton} ${actionSize} px-3`}/>
    : <Button type="button" onClick={submit}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!order || order.estimatedTotal === null))}
      className={`${buttonClass} ${actionSize} px-3`}>{label}</Button>;

  const quantityInput = <Input type="text" inputMode="numeric"
    aria-label={`Количество целых труб для ${variant.name}`} value={piecesText}
    aria-invalid={!!piecesText.trim() && !shouldRemove && validPieces === null}
    aria-describedby={status ? statusId : undefined}
    onChange={event => {setDraft({pieces: event.target.value, length: lengthText}); setMessage(undefined);}}
    onBlur={settlePieces} className={`${filterStyles.field} min-w-0 px-7 text-center tabular-nums`}/>;
  const lengthField = range ? <Input type="text" inputMode="decimal"
    aria-label={`Длина одной трубы для ${variant.name}`} value={lengthText}
    aria-invalid={!!lengthText.trim() && validLength === undefined}
    aria-describedby={status ? statusId : undefined}
    placeholder={`${range[0]}–${range[1]}`}
    onChange={event => {setDraft({pieces: piecesText, length: event.target.value}); setMessage(undefined);}}
    onBlur={settleLength}
    className={`${filterStyles.field} min-w-0 px-2 text-center tabular-nums`}/>
    : null;
  const mass = variant.weightConfirmed && variant.weightPerMeterKg !== undefined ? formatNumber(variant.weightPerMeterKg) : "—";
  const metersLabel = order ? formatNumber(order.meters) : "—";
  const total = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={order && order.estimatedTotal !== null
      ? "font-semibold tabular-nums text-slate-900 dark:text-slate-100" : "text-xs font-normal text-slate-500 dark:text-slate-400"}>{totalLabel}</output>;

  const lengths = variant.lengthRangeMeters?.map(value => formatNumber(value)).join("–")
    ?? (variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters));
  const specifications = <CatalogVariantSpecifications items={[
    {label: "Размер, мм", value: profilePipeSize(variant)},
    {label: "Стенка, мм", value: formatNumber(variant.wallThicknessMm!)},
    {label: "Теоретическая масса", value: mass === "—" ? mass : `${mass} кг/м`},
    {label: "Длина", value: lengths === undefined ? "Уточняется" : `${lengths} м`},
  ]}/>;
  const quantity = <div className="grid gap-2">
    {lengthField && <label className="block text-xs font-semibold">
      <span className="mb-1 block">Длина трубы, м</span>{lengthField}
    </label>}
    <CatalogVariantQuantity unit="шт.">{quantityInput}</CatalogVariantQuantity>
    <p className="text-xs text-slate-600 dark:text-slate-400">
      Заказ, м: <output aria-label={`Заказ в метрах для ${variant.name}`} aria-live="polite" className="tabular-nums">{metersLabel}</output>
    </p>
  </div>;

  return <CatalogVariantLayout view={view} variant={variant} specifications={specifications} price={priceLabel}
    order={<CatalogVariantOrder view={view} quantity={quantity} action={action} total={total}
      status={<span id={statusId} className={status ? "mt-1 block text-xs text-slate-500 dark:text-slate-400" : "sr-only"}
        aria-live="polite" aria-atomic="true">{status}</span>}/>}/>;
}
