"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {hasConfirmedProfilePipePrice, profilePipeOrder, profilePipeSize} from "@/lib/profilePipe";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantQuantity, CatalogVariantSpecifications} from "./CatalogVariantLayout";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";

export function ProfilePipeVariantItem({variant, view}: {variant: ProductVariant; view: "table" | "card"}) {
  const {addItem, removeItem, lines, hydrated} = useCart();
  const line = lines.find(item => item.productId === variant.id);
  const savedLength = line?.pieceOrder?.lengthMeters ?? variant.lengthMeters;
  const savedPieces = line?.pieceOrder?.pieces ?? (line && savedLength ? line.quantity / savedLength : undefined);
  const [draft, setDraft] = useState<{pieces: string; length: string} | null>(null);
  const [removed, setRemoved] = useState(false);
  const piecesText = draft?.pieces ?? (savedPieces === undefined ? "" : String(savedPieces));
  const lengthText = draft?.length ?? (savedLength === undefined ? "" : String(savedLength));
  const pieces = piecesText === "" ? null : Number(piecesText);
  const length = lengthText === "" ? undefined : Number(lengthText.replace(",", "."));
  const order = pieces === null ? null : profilePipeOrder(variant, pieces, length);
  const validLength = variant.lengthMeters ?? (variant.lengthRangeMeters && length !== undefined && Number.isFinite(length)
    && length >= variant.lengthRangeMeters[0] && length <= variant.lengthRangeMeters[1] ? length : undefined);
  const confirmedPrice = hasConfirmedProfilePipePrice(variant);
  const saved = !!line && !line.invalidReason && !!order && order.pieces > 0
    && order.pieces === savedPieces && order.lengthMeters === savedLength;
  const shouldRemove = !!line && pieces === 0;
  const label = removed ? "Удалено" : shouldRemove ? "Удалить" : saved ? "✓ В корзине" : line ? "Обновить" : "В корзину";
  const buttonClass = removed ? filterStyles.removedCartButton : shouldRemove ? filterStyles.removeCartButton
    : saved ? filterStyles.savedCartButton : line ? filterStyles.updateCartButton : filterStyles.cartButton;
  const actionSize = view === "card" ? "w-full" : tableStyles.tableAction;
  const priceLabel = confirmedPrice ? formatUnitPrice(variant.price, variant.priceUnit) : "Цена уточняется";
  const totalLabel = !confirmedPrice ? "Цена уточняется" : order?.estimatedTotal === null || !order || order.pieces <= 0
    ? variant.lengthRangeMeters && length === undefined ? "Выберите длину" : "Укажите количество" : formatCurrency(order.estimatedTotal);

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  function changePieces(value: string) {
    if (value !== "" && !/^\d+$/u.test(value)) return;
    setDraft({pieces: value, length: lengthText});
  }

  function submit() {
    if (!hydrated || saved || removed) return;
    if (shouldRemove) {removeItem(variant.id); setDraft(null); setRemoved(true); return;}
    if (!confirmedPrice || !order || order.pieces <= 0 || order.estimatedTotal === null) return;
    addItem(variant.id, order.meters, undefined, {pieces: order.pieces, lengthMeters: order.lengthMeters});
    setDraft(null);
  }

  const action = !confirmedPrice && !shouldRemove && !removed ? <QuoteRequestButton label="Запросить цену"
    order={{product: validLength ? `${variant.name}, длина ${formatNumber(validLength)} м` : variant.name,
      quantity: order?.pieces ?? (pieces !== null && Number.isSafeInteger(pieces) && pieces > 0 && pieces <= 999 ? pieces : null),
      unit: "шт.", meters: order?.pieces ? order.meters : null}}
    className={`${filterStyles.quoteButton} ${actionSize} px-3`}/>
    : <Button type="button" onClick={submit}
      disabled={!hydrated || saved || removed || (!shouldRemove && (!order || order.pieces <= 0 || order.estimatedTotal === null))}
      className={`${buttonClass} ${actionSize} px-3`}>{label}</Button>;

  const quantityInput = <Input type="number" inputMode="numeric" min={0} max={999} step={1}
    aria-label={`Количество целых труб для ${variant.name}`} value={piecesText}
    onChange={event => changePieces(event.target.value)} className={`${filterStyles.field} min-w-0 px-7 text-center tabular-nums`}/>;
  const lengthField = variant.lengthRangeMeters ? <Input type="number" min={variant.lengthRangeMeters[0]}
    max={variant.lengthRangeMeters[1]} step="any" inputMode="decimal"
    aria-label={`Длина одной трубы для ${variant.name}`} value={lengthText}
    placeholder={`${variant.lengthRangeMeters[0]}–${variant.lengthRangeMeters[1]}`}
    onChange={event => setDraft({pieces: piecesText, length: event.target.value})}
    className={`${filterStyles.field} min-w-0 px-2 text-center tabular-nums`}/>
    : null;
  const mass = variant.weightConfirmed && variant.weightPerMeterKg !== undefined ? formatNumber(variant.weightPerMeterKg) : "—";
  const metersLabel = order && order.pieces > 0 ? formatNumber(order.meters) : "—";
  const total = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={order?.estimatedTotal !== null && order?.estimatedTotal !== undefined && order.pieces > 0
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
    order={<CatalogVariantOrder view={view} quantity={quantity} action={action} total={total}/>}/>;
}
