"use client";

import {useEffect, useState} from "react";
import {beamProfile, beamKind} from "@/lib/beam";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {CatalogImage} from "./CatalogImage";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {
  calculateLineTotal, formatDecimal, metersToTons, parseNonNegativeDecimal, tonsToMeters,
} from "@/lib/orderMeasurement";
import type {ProductVariant} from "@/types/product";

export function MeasuredVariantItem({
  variant,
  view,
  kind,
}: {
  variant: ProductVariant;
  kind: "rebar" | "beam";
  view: "table" | "card";
}) {
  const {addItem, updateQuantity, removeItem, lines, hydrated} = useCart();
  const hasMass = variant.weightPerMeterKg !== undefined && variant.weightPerMeterKg > 0;
  const mass = variant.weightPerMeterKg ?? 0;
  const isBeam = kind === "beam";
  const cartLine = lines.find((line) => line.productId === variant.id);
  const savedMeasurement = cartLine?.measurement;
  const [draft, setDraft] = useState<{meters: string; tons: string; inputMode: "meter" | "ton"} | null>(null);
  const inputMode = draft?.inputMode ?? (savedMeasurement?.inputMode ?? "meter");
  const savedMeters = savedMeasurement?.meters ?? (cartLine && hasMass && variant.unit === "ton" ? tonsToMeters(cartLine.quantity, mass) : null);
  const meters = draft?.meters ?? (savedMeters === null ? "" : formatDecimal(savedMeters, 2));
  const tons = draft?.tons ?? (savedMeasurement ? formatDecimal(savedMeasurement.weightTons, 3) : cartLine && variant.unit === "ton" ? formatDecimal(cartLine.quantity, 3) : "");
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
  const parsedMeters = !hasMass ? enteredMeters : inputMode === "meter" ? enteredMeters : enteredTons === null ? null : tonsToMeters(enteredTons, mass);
  const parsedTons = !hasMass ? enteredTons : inputMode === "ton" ? enteredTons : enteredMeters === null ? null : metersToTons(enteredMeters, mass);
  const pricePerTon = variant.pricePerTon;
  const needsQuote = pricePerTon === undefined || variant.quoteOnly || variant.priceQualifier === "from" || (!hasMass && enteredMeters !== null && enteredMeters > 0);
  const canPurchase = !needsQuote && (variant.inStock || (variant.imported && variant.availability === "UNKNOWN"));
  const estimatedTotal = parsedTons === null || pricePerTon === undefined || variant.quoteOnly ? null : calculateLineTotal(parsedTons, pricePerTon);
  const totalLabel = variant.quoteOnly || pricePerTon === undefined ? "По запросу" : estimatedTotal === null ? "Укажите объём" : `${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(estimatedTotal)}`;
  const totalClassName = estimatedTotal === null
    ? "text-xs font-normal text-[color-mix(in_oklab,var(--color-slate-300),var(--color-slate-400))]"
    : "font-semibold tabular-nums text-slate-900";
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
  const status = message || (hasChanges ? "Не сохранено" : "");

  function updateMeters(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    if (!hasMass) {setDraft({inputMode: "meter", meters: value, tons}); setMessage(""); return;}
    const converted = parsed === null ? null : metersToTons(parsed, mass);
    setDraft({inputMode: "meter", meters: value, tons: converted === null ? "" : formatDecimal(converted, 3)});
    setMessage("");
  }

  function updateTons(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    if (!hasMass) {setDraft({inputMode: "ton", tons: value, meters}); setMessage(""); return;}
    const converted = parsed === null ? null : tonsToMeters(parsed, mass);
    setDraft({inputMode: "ton", tons: value, meters: converted === null ? "" : formatDecimal(converted, 2)});
    setMessage("");
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

  if (view === "card") {
    return (
      <article className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{variant.sku}</p>
        <CatalogImage src={variant.imageUrls[0]} name={variant.name}/>
        <h3 className="mt-1 font-bold">{variant.name}</h3>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <VariantDetail label={isBeam ? "Профиль" : "Диаметр"} value={isBeam ? beamProfile(variant) : `${formatNumber(variant.diameterMm ?? 0)} мм`}/>
          <VariantDetail label={isBeam ? "Тип балки" : "Форма"} value={isBeam ? beamKind(variant) : formLabel(variant.form ?? "bar")}/>
          <VariantDetail label={isBeam ? "Сталь / класс" : "Марка стали"} value={variant.steelGrade ?? "—"}/>
          <VariantDetail label="Вес" value={hasMass ? `${formatNumber(mass)} кг/м` : "—"}/>
          <VariantDetail
            label="Длина"
            value={variant.lengthMeters === undefined ? "—" : `${formatNumber(variant.lengthMeters)} м`}
          />
          <VariantDetail label="Цена" value={`${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`}/>
        </dl>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <OrderInput
            label={`Длина заказа для ${variant.name}`}
            visibleLabel="Заказ, м"
            value={meters}
            onChange={updateMeters}
          />
          <OrderInput
            label={`Вес заказа в тоннах для ${variant.name}`}
            visibleLabel="Заказ, т"
            decimalPlaces={3}
            value={tons}
            onChange={updateTons}
          />
        </div>
        <p className="mt-4 flex items-baseline justify-between gap-3 text-sm text-slate-900">
          <span>Сумма:</span>
          <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>
        </p>
        <div className="mt-4">{action}</div>
        <span aria-live="polite" className={`mt-1 block text-xs ${message ? "text-red-700" : "text-slate-500"}`}>{status}</span>
      </article>
    );
  }

  return (
    <tr id={`variant-${variant.id}`} title={variant.name} className="border-t border-slate-200 align-middle">
      <td className="px-2 py-4 font-bold">{isBeam ? beamProfile(variant) : formatNumber(variant.diameterMm ?? 0)}</td>
      <td className="px-2 py-4">{isBeam ? beamKind(variant) : formLabel(variant.form ?? "bar")}</td>
      <td className="px-2 py-4">{variant.steelGrade}</td>
      <td className="px-2 py-4 font-semibold tabular-nums">{`${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`}</td>
      <td className="px-2 py-4">{hasMass ? formatNumber(mass) : "—"}</td>
      <td className="px-2 py-4">{variant.lengthMeters === undefined ? "—" : formatNumber(variant.lengthMeters)}</td>
      <td className="px-2 py-3">
        <OrderInput label={`Длина заказа для ${variant.name}`} value={meters} onChange={updateMeters}/>
      </td>
      <td className="px-2 py-3">
        <OrderInput label={`Вес заказа в тоннах для ${variant.name}`} value={tons} onChange={updateTons} decimalPlaces={3}/>
      </td>
      <td className={`${tableStyles.sumColumn} py-3`}>
        <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>
      </td>
      <td className="px-2 py-3 text-center">
        {action}
        <span aria-live="polite" className={`mx-auto mt-1 block max-w-32 text-xs ${message ? "text-red-700" : "text-slate-500"}`}>{status}</span>
      </td>
    </tr>
  );
}

function OrderInput({
  decimalPlaces = 2,
  label,
  visibleLabel,
  value,
  onChange,
}: {
  label: string;
  decimalPlaces?: number;
  visibleLabel?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {visibleLabel && <span className="mb-1 block">{visibleLabel}</span>}
      <Input aria-label={label} type="number" inputMode="decimal" min={0} step={10 ** -decimalPlaces}
        value={value} onChange={(event) => {
          const next = event.target.value;
          if (next === "" || new RegExp(`^\\d+(?:[.,]\\d{0,${decimalPlaces}})?$`).test(next)) onChange(next);
        }}
        className={`${filterStyles.field} w-full min-w-0 px-2 tabular-nums focus:placeholder:text-transparent ${visibleLabel ? "" : "text-center"}`} placeholder="0"/>
    </label>
  );
}

function VariantDetail({label, value}: {label: string; value: string}) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function formLabel(form: "coil" | "bar") {
  return form === "coil" ? "В бунтах" : "Пруток";
}
