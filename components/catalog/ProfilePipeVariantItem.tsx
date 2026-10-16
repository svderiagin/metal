"use client";

import {useEffect, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {formatCurrency} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {hasConfirmedProfilePipePrice, profilePipeOrder, profilePipeSize} from "@/lib/profilePipe";
import type {ProductVariant} from "@/types/product";
import {QuoteRequestButton} from "./QuoteRequestButton";
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
  const priceLabel = confirmedPrice ? formatCurrency(variant.price!) : "Цена уточняется";
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
    onChange={event => changePieces(event.target.value)} className={`${filterStyles.field} min-w-0 px-2 text-center tabular-nums`}/>;
  const lengthField = variant.lengthRangeMeters ? <Input type="number" min={variant.lengthRangeMeters[0]}
    max={variant.lengthRangeMeters[1]} step="any" inputMode="decimal"
    aria-label={`Длина одной трубы для ${variant.name}`} value={lengthText}
    placeholder={`${variant.lengthRangeMeters[0]}–${variant.lengthRangeMeters[1]}`}
    onChange={event => setDraft({pieces: piecesText, length: event.target.value})}
    className={`${filterStyles.field} min-w-0 px-2 text-center tabular-nums`}/>
    : variant.lengthMeters === undefined ? "Уточняется" : formatNumber(variant.lengthMeters);
  const mass = variant.weightConfirmed && variant.weightPerMeterKg !== undefined ? formatNumber(variant.weightPerMeterKg) : "—";
  const metersLabel = order && order.pieces > 0 ? formatNumber(order.meters) : "—";
  const total = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={order?.estimatedTotal !== null && order?.estimatedTotal !== undefined && order.pieces > 0
      ? "font-semibold tabular-nums text-slate-900" : "text-xs font-normal text-slate-500"}>{totalLabel}</output>;

  if (view === "card") return <article id={`variant-mobile-${variant.id}`} className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs text-slate-500">{variant.sku}</p>
    <h3 className="mt-1 font-bold">{variant.name}</h3>
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <Detail label="Размер, мм" value={profilePipeSize(variant)}/>
      <Detail label="Стенка, мм" value={formatNumber(variant.wallThicknessMm!)}/>
      <Detail label="Цена, ₽/м" value={priceLabel}/>
      <Detail label="Масса, кг/м" value={mass}/>
      <div><dt className="mb-1 text-slate-500">Длина, м</dt><dd>{lengthField}</dd></div>
      <div><dt className="mb-1 text-slate-500">Кол-во, шт</dt><dd>{quantityInput}</dd></div>
      <Detail label="Заказ, м" value={metersLabel}/>
    </dl>
    <p className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm"><span>Сумма:</span>{total}</p>
    <div className="mt-4">{action}</div>
  </article>;

  return <tr id={`variant-${variant.id}`} title={`${variant.name} · ${variant.sku}`} className="border-t border-slate-200 align-middle">
    <td className="px-2 py-4 font-bold tabular-nums">{profilePipeSize(variant)}</td>
    <td className="px-2 py-4 tabular-nums">{formatNumber(variant.wallThicknessMm!)}</td>
    <td className={`px-2 py-4 tabular-nums ${confirmedPrice ? "font-semibold" : "text-xs text-slate-500"}`}>{priceLabel}</td>
    <td className="px-2 py-4 tabular-nums">{mass}</td>
    <td className="px-2 py-3 tabular-nums">{lengthField}</td>
    <td className="px-2 py-3">{quantityInput}</td>
    <td className="px-2 py-4 tabular-nums"><output aria-label={`Заказ в метрах для ${variant.name}`} aria-live="polite">{metersLabel}</output></td>
    <td className={`${tableStyles.sumColumn} py-3`}>{total}</td>
    <td className="px-2 py-3 text-center">{action}</td>
  </tr>;
}

function Detail({label, value}: {label: string; value: string}) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-800">{value}</dd></div>;
}
