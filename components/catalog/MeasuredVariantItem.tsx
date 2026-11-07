"use client";

import {useEffect, useState, type ReactNode} from "react";
import {beamProfile, beamKind} from "@/lib/beam";
import {vgpSize, vgpSeries, wholeVgpOrder} from "@/lib/vgp";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantSpecifications} from "./CatalogVariantLayout";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {ProfilePipeVariantItem} from "./ProfilePipeVariantItem";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {calculateLineTotal, formatDecimal, metersToTons, tonsToMeters} from "@/lib/orderMeasurement";
import {correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import type {OrderInputMode} from "@/types/cart";
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
  const isRebar = kind === "rebar";
  const isVgp = kind === "vgp";
  const tonDigits = isVgp ? 6 : 3;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cartLine = lines.find((line) => line.productId === variant.id);
  const savedMeasurement = cartLine?.measurement;
  const [draft, setDraft] = useState<{meters: string; tons: string; inputMode: OrderInputMode; exactQuantity?: number} | null>(null);
  const inputMode = draft?.inputMode ?? (savedMeasurement?.inputMode ?? "meter");
  const savedMeters = savedMeasurement?.meters ?? (cartLine && hasMass && variant.unit === "ton" ? tonsToMeters(cartLine.quantity, mass) : null);
  const savedTons = savedMeasurement?.weightTons ?? (cartLine && variant.unit === "ton" ? cartLine.quantity : null);
  const meters = draft?.meters ?? formatMeasuredQuantity(savedMeters, 2);
  const tons = draft?.tons ?? formatMeasuredQuantity(savedTons, tonDigits);
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  // Calculate from the edited field, preserving precision before display rounding.
  const enteredMeters = draft === null ? savedMeters : readQuantity(meters, "meter");
  const enteredTons = draft === null ? savedTons : readQuantity(tons, "ton");
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
  const activeValue = inputMode === "meter" ? meters : tons;
  const cannotCalculate = enteredQuantity !== null && enteredQuantity > 0 &&
    ((hasMass && (!parsedMeters || !parsedTons)) || (pricePerTon !== undefined && !variant.quoteOnly && parsedTons !== null && estimatedTotal === null));
  const invalidDraft = draft !== null && activeValue.trim() !== "" && (enteredQuantity === null || cannotCalculate);
  const buttonLabel = removed ? "Удалено" : !canPurchase ? "Под заказ" : shouldRemove ? "Удалить" : isSaved ? "✓ В корзине" : hasChanges ? "Обновить" : "В корзину";
  const buttonClassName = removed ? filterStyles.removedCartButton
    : shouldRemove ? filterStyles.removeCartButton
      : isSaved ? filterStyles.savedCartButton
        : hasChanges && canPurchase ? filterStyles.updateCartButton
          : filterStyles.cartButton;
  const status = message || (invalidDraft ? "Проверьте введённое значение."
    : hasChanges ? "Не сохранено" : isVgp && pipeOrder && pipeOrder.pieces > 0 ? `${pipeOrder.pieces} шт. · ${formatNumber(pipeOrder.meters)} м` : "");

  function quantityOptions(mode: OrderInputMode) {
    return {
      maximum: mode === "ton" && !hasMass ? 999 : undefined,
      decimalPlaces: isVgp ? undefined : mode === "meter" ? 2 : tonDigits,
    };
  }

  function readQuantity(value: string, mode: OrderInputMode) {
    if (draft?.inputMode === mode && draft.exactQuantity !== undefined) return draft.exactQuantity;
    return correctOrderQuantity(value, quantityOptions(mode)).message ? null : parseOrderQuantity(value);
  }

  function updateQuantityField(mode: OrderInputMode, value: string) {
    const parsed = correctOrderQuantity(value, quantityOptions(mode)).message ? null : parseOrderQuantity(value);
    const whole = isVgp && parsed !== null ? wholeVgpOrder(variant, parsed, mode) : null;
    if (mode === "meter") {
      const converted = parsed === null ? null : isVgp ? whole?.weightTons ?? null : metersToTons(parsed, mass);
      setDraft({inputMode: mode, meters: value, tons: hasMass ? formatMeasuredQuantity(converted, tonDigits) : tons});
    } else {
      const converted = parsed === null ? null : isVgp ? whole?.meters ?? null : tonsToMeters(parsed, mass);
      setDraft({inputMode: mode, tons: value, meters: hasMass ? formatMeasuredQuantity(converted, 2) : meters});
    }
    setMessage("");
  }

  function settleQuantity(mode: OrderInputMode) {
    if (draft?.inputMode !== mode || draft.exactQuantity !== undefined) return;
    const next = correctOrderQuantity(activeValue, quantityOptions(mode));
    if (cannotCalculate) {
      updateQuantityField(mode, "");
      setMessage("Значение очищено. Не удалось рассчитать объём.");
    } else if (isVgp && pipeOrder) {
      // Keep the exact whole-pipe volume as the source even when the input display rounds it.
      const exactQuantity = mode === "meter" ? pipeOrder.meters : pipeOrder.weightTons;
      setDraft({inputMode: mode, meters: formatMeasuredQuantity(pipeOrder.meters, 2),
        tons: formatMeasuredQuantity(pipeOrder.weightTons, tonDigits), exactQuantity});
      if (exactQuantity > (enteredQuantity ?? 0) && Math.abs(exactQuantity - (enteredQuantity ?? 0)) > exactQuantity * 1e-9) {
        setMessage(`Объём округлён вверх до целых труб · ${pipeOrder.pieces} шт.`);
      }
    } else if (next.value !== activeValue) {
      updateQuantityField(mode, next.value);
      if (next.message) setMessage(next.message);
    }
  }

  function addToCart() {
    if (!hydrated || isSaved || removed || invalidDraft) return;
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
      order={{product: formatQuoteProductName(variant), meters: invalidDraft ? null : parsedMeters, tons: invalidDraft ? null : parsedTons}}
      className={`${filterStyles.quoteButton} ${actionSizeClassName} px-3`}/>
  ) : (
    <Button type="button" disabled={!hydrated || isSaved || removed || invalidDraft || (!canPurchase && !shouldRemove)} onClick={addToCart}
      className={`${buttonClassName} ${actionSizeClassName} whitespace-nowrap px-3`}>
      {shouldRemove ? "Удалить" : buttonLabel}
    </Button>
  );

  const showOrderLabels = view === "card";
  const statusId = `measured-order-status-${view}-${variant.id}`;
  const meterInput = <OrderInput label={`Длина заказа для ${variant.name}`}
    visibleLabel={showOrderLabels ? "Заказ, м" : undefined} value={meters} invalid={invalidDraft && inputMode === "meter"} statusId={statusId}
    onChange={value => updateQuantityField("meter", value)} onBlur={() => settleQuantity("meter")}/>;
  const tonInput = <OrderInput label={`Вес заказа в тоннах для ${variant.name}`}
    visibleLabel={showOrderLabels ? "Заказ, т" : undefined} value={tons} invalid={invalidDraft && inputMode === "ton"} statusId={statusId}
    onChange={value => updateQuantityField("ton", value)} onBlur={() => settleQuantity("ton")}/>;
  const price = `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`;
  const total = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>;
  const statusColor = invalidDraft ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400";
  const statusSpacing = view === "table" ? "mx-auto mt-1 max-w-32" : "mt-1";
  const orderStatus = <span id={statusId} aria-live="polite" className={`block text-xs ${statusSpacing} ${statusColor}`}>{status}</span>;
  const order = <CatalogVariantOrder view={view} quantity={meterInput} secondaryQuantity={tonInput}
    action={action} total={total} status={orderStatus}/>;

  if (isRebar) return <RebarVariantLayout view={view} variant={variant} price={price} order={order}/>;

  const details = <div className="space-y-2 text-left text-sm font-normal text-slate-600 dark:text-slate-300">
    <p className="font-bold text-slate-900 dark:text-slate-100">{variant.name}</p>
    <p>{variant.availability === "UNKNOWN" ? "Наличие уточняется" : variant.availability === "IN_STOCK" ? "В наличии" : "Под заказ"}</p>
    <p>{variant.shortDescription}</p>
    <p>{variant.description}</p>
  </div>;

  const specifications = <CatalogVariantSpecifications items={[
    {label: isVgp ? "Ду × стенка, мм" : "Профиль", value: isVgp ? vgpSize(variant) : beamProfile(variant)},
    {label: isVgp ? "Серия" : "Тип балки", value: isVgp ? vgpSeries(variant) : beamKind(variant)},
    {label: isVgp ? "Наружный Ø, мм" : "Сталь / класс",
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
  return <>
    <CatalogVariantLayout view={view} variant={variant} specifications={<>{specifications}{isVgp && moreDetails}</>}
      price={price} order={order}/>
    {isVgp && view === "table" && <tr id={`vgp-details-${variant.id}`} hidden={!detailsOpen}
      className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><td colSpan={8} className="p-4">{details}</td></tr>}
  </>;
}

function RebarVariantLayout({view, variant, price, order}: {
  view: "table" | "card";
  variant: ProductVariant;
  price: string;
  order: ReactNode;
}) {
  const diameter = formatNumber(variant.diameterMm ?? 0);
  const form = formLabel(variant.form ?? "bar");
  const mass = variant.weightPerMeterKg;
  const length = variant.lengthMeters;

  if (view === "card") return (
    <article id={`variant-mobile-${variant.id}`} className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mt-1 font-bold">{variant.name}</h3>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {[
          ["Диаметр", `${diameter} мм`],
          ["Форма", form],
          ["Марка стали", variant.steelGrade ?? "—"],
          ["Вес", mass !== undefined && mass > 0 ? `${formatNumber(mass)} кг/м` : "—"],
          ["Длина", length === undefined ? "—" : `${formatNumber(length)} м`],
          ["Цена", price],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {order}
    </article>
  );

  return (
    <tr id={`variant-${variant.id}`} title={variant.name} className="align-middle border-t border-slate-200 dark:border-slate-700">
      <td className="font-bold">{diameter}</td>
      <td>{form}</td>
      <td>{variant.steelGrade}</td>
      <td className="font-semibold tabular-nums">{price}</td>
      <td>{mass !== undefined && mass > 0 ? formatNumber(mass) : "—"}</td>
      <td>{length === undefined ? "—" : formatNumber(length)}</td>
      {order}
    </tr>
  );
}

function OrderInput({
  label,
  visibleLabel,
  value,
  onChange,
  onBlur,
  invalid,
  statusId,
}: {
  label: string;
  visibleLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid: boolean;
  statusId: string;
}) {
  const alignment = visibleLabel ? "px-2" : "px-2 text-center";
  const input = <Input aria-label={label} aria-invalid={invalid || undefined} aria-describedby={statusId} type="text" inputMode="decimal" onBlur={onBlur}
    value={value} onChange={event => onChange(event.target.value)}
    className={`${filterStyles.field} w-full min-w-0 ${alignment} tabular-nums focus:placeholder:text-transparent`} placeholder="0"/>;
  return (
    <label className="block text-sm font-semibold">
      {visibleLabel && <span className="mb-1 block">{visibleLabel}</span>}
      {input}
    </label>
  );
}

function formatMeasuredQuantity(value: number | null, decimalPlaces: number) {
  if (value === null) return "";
  if (value >= 1e21) return formatCatalogNumber(value);
  const formatted = formatDecimal(value, decimalPlaces);
  return value > 0 && Number(formatted) === 0 ? formatCatalogNumber(value) : formatted;
}

function formLabel(form: "coil" | "bar") {
  return form === "coil" ? "В бунтах" : "Пруток";
}

