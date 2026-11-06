"use client";

import {useEffect, useState} from "react";
import {beamProfile, beamKind} from "@/lib/beam";
import {vgpSize, vgpSeries, wholeVgpOrder} from "@/lib/vgp";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantQuantity, CatalogVariantSpecifications} from "./CatalogVariantLayout";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {ProfilePipeVariantItem} from "./ProfilePipeVariantItem";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {
  calculateLineTotal, formatDecimal, metersToTons, parseNonNegativeDecimal, tonsToMeters,
} from "@/lib/orderMeasurement";
import type {ProductVariant} from "@/types/product";

export function MeasuredVariantItem({
  variant, view, kind,
}: {variant: ProductVariant; view: "table" | "card"; kind: "rebar" | "beam" | "vgp" | "profile"}) {
  return kind === "profile" ? <ProfilePipeVariantItem variant={variant} view={view}/>
    : <TonnageMeasuredVariantItem variant={variant} view={view} kind={kind}/>;
}

function TonnageMeasuredVariantItem({
  variant,
  view,
  kind,
}: {
  variant: ProductVariant;
  kind: "rebar" | "beam" | "vgp";
  view: "table" | "card";
}) {
  const {addItem, updateQuantity, removeItem, lines, hydrated} = useCart();
  const hasMass = variant.weightPerMeterKg !== undefined && variant.weightPerMeterKg > 0;
  const mass = variant.weightPerMeterKg ?? 0;
  const isBeam = kind === "beam";
  const isVgp = kind === "vgp";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cartLine = lines.find((line) => line.productId === variant.id);
  const savedMeasurement = cartLine?.measurement;
  const [draft, setDraft] = useState<{meters: string; tons: string; inputMode: "meter" | "ton"} | null>(null);
  const inputMode = draft?.inputMode ?? (savedMeasurement?.inputMode ?? "meter");
  const savedMeters = savedMeasurement?.meters ?? (cartLine && hasMass && variant.unit === "ton" ? tonsToMeters(cartLine.quantity, mass) : null);
  const meters = draft?.meters ?? (savedMeters === null ? "" : formatDecimal(savedMeters, 2));
  const tons = draft?.tons ?? (savedMeasurement ? formatDecimal(savedMeasurement.weightTons, isVgp ? 6 : 3) : cartLine && variant.unit === "ton" ? formatDecimal(cartLine.quantity, isVgp ? 6 : 3) : "");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  // Calculate from the edited field, preserving precision before display rounding.
  const enteredMeters = draft === null && cartLine ? savedMeters : parseNonNegativeDecimal(meters);
  const enteredTons = draft === null && savedMeasurement ? savedMeasurement.weightTons : draft === null && cartLine && variant.unit === "ton" ? cartLine.quantity : parseNonNegativeDecimal(tons);
  const pipeQuantity = inputMode === "meter" ? enteredMeters : enteredTons;
  const pipeOrder = isVgp && pipeQuantity !== null ? wholeVgpOrder(variant, pipeQuantity, inputMode) : null;
  const parsedMeters = isVgp ? pipeOrder?.meters ?? null : !hasMass ? enteredMeters : inputMode === "meter" ? enteredMeters : enteredTons === null ? null : tonsToMeters(enteredTons, mass);
  const parsedTons = isVgp ? pipeOrder?.weightTons ?? null : !hasMass ? enteredTons : inputMode === "ton" ? enteredTons : enteredMeters === null ? null : metersToTons(enteredMeters, mass);
  const pricePerTon = variant.pricePerTon;
  const needsQuote = pricePerTon === undefined || variant.quoteOnly || variant.priceQualifier === "from" || (!hasMass && enteredMeters !== null && enteredMeters > 0);
  const canPurchase = !needsQuote && (variant.inStock || (variant.imported && variant.availability === "UNKNOWN"));
  const estimatedTotal = parsedTons === null || pricePerTon === undefined || variant.quoteOnly ? null : calculateLineTotal(parsedTons, pricePerTon);
  const totalLabel = variant.quoteOnly || pricePerTon === undefined ? "По запросу" : estimatedTotal === null ? "Укажите объём" : `${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(estimatedTotal)}`;
  const totalClassName = estimatedTotal === null
    ? "text-xs font-normal text-slate-500 dark:text-slate-400"
    : "font-semibold tabular-nums text-slate-900 dark:text-slate-100";
  const enteredQuantity = draft === null && cartLine && !savedMeasurement ? enteredTons : inputMode === "meter" ? enteredMeters : enteredTons;
  const isSaved = !!cartLine && !cartLine.invalidReason && parsedTons !== null && parsedTons > 0
    && enteredQuantity !== 0
    && Math.abs(parsedTons - (savedMeasurement?.weightTons ?? cartLine.quantity)) <= Math.max(1, savedMeasurement?.weightTons ?? cartLine.quantity) * 1e-9
    && (hasMass || !(enteredMeters && enteredMeters > 0));
  const hasChanges = !!cartLine && !isSaved;
  const shouldRemove = !!cartLine && enteredQuantity === 0;
  const buttonLabel = removed ? "Удалено" : !canPurchase ? "Под заказ" : shouldRemove ? "Удалить" : isSaved ? "✓ В корзине" : hasChanges ? "Обновить" : "В корзину";
  const buttonClassName = removed ? filterStyles.removedCartButton
    : shouldRemove ? filterStyles.removeCartButton
      : isSaved ? filterStyles.savedCartButton
        : hasChanges && canPurchase ? filterStyles.updateCartButton
          : filterStyles.cartButton;
  const status = message || (hasChanges ? "Не сохранено" : isVgp && pipeOrder && pipeOrder.pieces > 0 ? `${pipeOrder.pieces} шт. · ${formatNumber(pipeOrder.meters)} м` : "");

  function updateMeters(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    if (!hasMass) {setDraft({inputMode: "meter", meters: value, tons}); setMessage(""); return;}
    const converted = parsed === null ? null : isVgp ? wholeVgpOrder(variant, parsed, "meter")?.weightTons ?? null : metersToTons(parsed, mass);
    setDraft({inputMode: "meter", meters: value, tons: converted === null ? "" : formatDecimal(converted, isVgp ? 6 : 3)});
    setMessage("");
  }

  function updateTons(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    if (!hasMass) {setDraft({inputMode: "ton", tons: value, meters}); setMessage(""); return;}
    const converted = parsed === null ? null : isVgp ? wholeVgpOrder(variant, parsed, "ton")?.meters ?? null : tonsToMeters(parsed, mass);
    setDraft({inputMode: "ton", tons: value, meters: converted === null ? "" : formatDecimal(converted, 2)});
    setMessage("");
  }

  function settlePipeOrder() {
    if (isVgp && pipeOrder) setDraft({inputMode, meters: formatDecimal(pipeOrder.meters, 2), tons: formatDecimal(pipeOrder.weightTons, 6)});
  }

  function addToCart() {
    if (!hydrated || isSaved || removed) return;
    if (shouldRemove) {
      removeItem(variant.id);
      setDraft(null);
      setMessage("");
      setRemoved(true);
      return;
    }
    if (!parsedTons || (hasMass && !parsedMeters)) {
      setMessage("Укажите длину или вес больше нуля.");
      return;
    }
    if (!canPurchase || estimatedTotal === null || pricePerTon === undefined) return;
    if (!hasMass && parsedTons > 999) {setMessage("Укажите вес не более 999 т."); return;}
    if (!hasMass) {
      if (cartLine) updateQuantity(variant.id, parsedTons);
      else addItem(variant.id, parsedTons);
    } else {
      addItem(
        variant.id,
        inputMode === "meter" ? parsedMeters! : parsedTons,
        {
          inputMode,
          meters: parsedMeters!,
          weightTons: parsedTons,
          pricePerTon,
          estimatedTotal,
        },
      );
    }
    setDraft(null);
    setMessage("");
  }

  const actionSizeClassName = view === "card" ? "w-full" : tableStyles.tableAction;
  const action = !canPurchase && !shouldRemove && !removed ? (
    <QuoteRequestButton label={needsQuote ? "Запросить цену" : "Под заказ"}
      order={{product: formatQuoteProductName(variant), meters: parsedMeters, tons: parsedTons}}
      className={`${filterStyles.quoteButton} ${actionSizeClassName} px-3`}/>
  ) : (
    <Button type="button" disabled={!hydrated || isSaved || removed || (!canPurchase && !shouldRemove)} onClick={addToCart}
      className={`${buttonClassName} ${actionSizeClassName} whitespace-nowrap px-3`}>
      {shouldRemove ? "Удалить" : buttonLabel}
    </Button>
  );

  const details = <div className="space-y-2 text-left text-sm font-normal text-slate-600 dark:text-slate-300">
    <p className="font-bold text-slate-900 dark:text-slate-100">{variant.name}</p>
    <p>{variant.availability === "UNKNOWN" ? "Наличие уточняется" : variant.availability === "IN_STOCK" ? "В наличии" : "Под заказ"}</p>
    <p>{variant.shortDescription}</p>
    <p>{variant.description}</p>
  </div>;

  const specifications = <CatalogVariantSpecifications items={[
    {label: isVgp ? "Ду × стенка, мм" : isBeam ? "Профиль" : "Диаметр", value: isVgp ? vgpSize(variant)
      : isBeam ? beamProfile(variant) : `${formatNumber(variant.diameterMm ?? 0)} мм`},
    {label: isVgp ? "Серия" : isBeam ? "Тип балки" : "Форма", value: isVgp ? vgpSeries(variant)
      : isBeam ? beamKind(variant) : formLabel(variant.form ?? "bar")},
    {label: isVgp ? "Наружный Ø, мм" : isBeam ? "Сталь / класс" : "Марка стали",
      value: isVgp ? formatNumber(variant.diameterMm ?? 0) : variant.steelGrade ?? "—"},
    {label: "Теоретическая масса", value: hasMass ? `${formatNumber(mass)} кг/м` : "—"},
    {label: "Длина", value: variant.lengthMeters === undefined ? "—" : `${formatNumber(variant.lengthMeters)} м`},
  ]}/>;
  const moreDetails = view === "card"
    ? <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-red-700 dark:text-slate-300 dark:focus-visible:outline-red-300">Подробнее о товаре</summary>
      <div className="mt-3">{details}</div></details>
    : <button type="button" aria-expanded={detailsOpen} aria-controls={`vgp-details-${variant.id}`}
      aria-label={`Подробности: ${variant.name}`} onClick={() => setDetailsOpen(!detailsOpen)}
      className="mt-2 cursor-pointer rounded-sm text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700 dark:text-slate-300 dark:decoration-slate-500 dark:hover:text-red-400 dark:focus-visible:outline-red-300">Подробнее о товаре</button>;
  const quantity = <div className="grid gap-2">
    <OrderInput label={`Длина заказа для ${variant.name}`} unit="м" value={meters} onChange={updateMeters}
      step={isVgp ? variant.lengthMeters : undefined} onBlur={settlePipeOrder}/>
    <OrderInput label={`Вес заказа в тоннах для ${variant.name}`} unit="т" value={tons} onChange={updateTons}
      decimalPlaces={isVgp ? 6 : 3} onBlur={settlePipeOrder}/>
  </div>;
  const total = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>;
  const orderStatus = <span aria-live="polite" className={`block text-xs ${message ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>{status}</span>;

  return <>
    <CatalogVariantLayout view={view} variant={variant} specifications={<>{specifications}{isVgp && moreDetails}</>}
      price={`${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`}
      order={<CatalogVariantOrder view={view} quantity={quantity} action={action} total={total} status={orderStatus}/>}/>
    {isVgp && view === "table" && <tr id={`vgp-details-${variant.id}`} hidden={!detailsOpen}
      className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><td colSpan={6} className="p-4">{details}</td></tr>}
  </>;
}

function OrderInput({
  decimalPlaces = 2,
  label,
  unit,
  value,
  onChange,
  onBlur,
  step,
}: {
  label: string;
  decimalPlaces?: number;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  step?: number;
}) {
  return (
    <CatalogVariantQuantity unit={unit}>
      <Input aria-label={label} type="number" inputMode="decimal" min={0} step={step ?? 10 ** -decimalPlaces} onBlur={onBlur}
        value={value} onChange={(event) => {
          const next = event.target.value;
          if (next === "" || new RegExp(`^\\d+(?:[.,]\\d{0,${decimalPlaces}})?$`).test(next)) onChange(next);
        }}
        className={`${filterStyles.field} w-full min-w-0 pr-5 pl-2 text-center tabular-nums focus:placeholder:text-transparent`} placeholder="0"/>
    </CatalogVariantQuantity>
  );
}

function formLabel(form: "coil" | "bar") {
  return form === "coil" ? "В бунтах" : "Пруток";
}

