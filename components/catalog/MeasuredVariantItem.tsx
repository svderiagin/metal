"use client";

import {useEffect, useState, type ReactNode} from "react";
import {beamProfile, beamKind, beamReferenceMassKg, beamStandardLabel} from "@/lib/beam";
import {vgpSize} from "@/lib/vgp";
import {wholePipeOrder} from "@/lib/wholePipeOrder";
import {isWholePipeVariant} from "@/lib/pipeFamily";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantSpecifications, VgpVariantDetails} from "./CatalogVariantLayout";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
import {ProfilePipeVariantItem} from "./ProfilePipeVariantItem";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {calculateLineTotal, calculateMeasuredLineTotal, getMeasurementQuantityOptions, metersToTons, tonsToMeters} from "@/lib/orderMeasurement";
import {constrainOrderQuantityInput, correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {formatMeasuredQuantity, quantityTransferHandlers} from "@/lib/cartQuantityInput";
import type {OrderInputMode} from "@/types/cart";
import type {ProductVariant} from "@/types/product";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {useOrderDraft} from "./OrderDraftProvider";
import {DetailsSummary} from "@/components/ui/DetailsSummary";

type OrderFeedback = {kind: "correction" | "error"; text: string};
const enterQuantityMessage = "Укажите длину или вес больше нуля.";

export function MeasuredVariantItem({
  variant, view, kind, name,
}: {variant: ProductVariant; view: "table" | "card"; kind: "rebar" | "beam" | "vgp" | "pipe" | "profile"; name?: string}) {
  return kind === "profile" ? <ProfilePipeVariantItem variant={variant} view={view}/>
    : <TonnageMeasuredVariantItem variant={variant} view={view} kind={kind} name={name}/>;
}

function TonnageMeasuredVariantItem({
  variant,
  view,
  kind,
  name,
}: {
  variant: ProductVariant;
  name?: string;
  kind: "rebar" | "beam" | "vgp" | "pipe";
  view: "table" | "card";
}) {
  const {addItem, updateQuantity, removeItem, lines, hydrated} = useCart();
  const hasMass = !isDemonstrationProduct(variant) && variant.weightPerMeterKg !== undefined && variant.weightPerMeterKg > 0;
  const mass = variant.weightPerMeterKg ?? 0;
  const referenceMass = beamReferenceMassKg(variant);
  const isRebar = kind === "rebar";
  const isVgp = kind === "vgp";
  const isOrdinaryVgp = isVgp && variant.subcategoryId === "cat-trk-sub-1";
  const isPipe = isVgp || kind === "pipe";
  const wholePipe = isWholePipeVariant(variant);
  const roundToWholePipes = wholePipe && hasMass && Number.isFinite(variant.lengthMeters) && (variant.lengthMeters ?? 0) > 0;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cartLine = lines.find((line) => line.productId === variant.id);
  const savedMeasurement = cartLine?.measurement;
  const {draft, setDraft, message, setMessage} = useOrderDraft<{
    meters: string; tons: string; inputMode: OrderInputMode; exactQuantity?: number;
  }, OrderFeedback | null>(variant.id, `measured-${kind}`, null);
  const inputMode = draft?.inputMode ?? (savedMeasurement?.inputMode ?? "meter");
  const savedMeters = savedMeasurement?.meters ?? (cartLine && hasMass && variant.unit === "ton" ? tonsToMeters(cartLine.quantity, mass) : null);
  const savedTons = savedMeasurement?.weightTons ?? (cartLine && variant.unit === "ton" ? cartLine.quantity : null);
  const meters = draft?.meters ?? displayQuantity(savedMeters, "meter");
  const tons = draft?.tons ?? displayQuantity(savedTons, "ton");
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
  const pipeOrder = roundToWholePipes && pipeQuantity !== null ? wholePipeOrder(variant, pipeQuantity, inputMode) : null;
  const parsedMeters = roundToWholePipes ? pipeOrder?.meters ?? null : !hasMass ? enteredMeters : inputMode === "meter" ? enteredMeters : enteredTons === null ? null : tonsToMeters(enteredTons, mass);
  const parsedTons = roundToWholePipes ? pipeOrder?.weightTons ?? null : !hasMass ? enteredTons : inputMode === "ton" ? enteredTons : enteredMeters === null ? null : metersToTons(enteredMeters, mass);
  // A reference conversion is displayed in the opposite field. The cart and
  // quote still receive only the quantity entered for this supplier's offer.
  const referenceTons = referenceMass !== undefined && parsedMeters !== null ? metersToTons(parsedMeters, referenceMass) : null;
  const referenceMeters = referenceMass !== undefined && parsedTons !== null ? tonsToMeters(parsedTons, referenceMass) : null;
  const pricePerTon = variant.pricePerTon;
  const needsQuote = pricePerTon === undefined || variant.quoteOnly || variant.priceQualifier === "from"
    || (wholePipe && !roundToWholePipes) || (!hasMass && enteredMeters !== null && enteredMeters > 0);
  const canPurchase = !needsQuote && (variant.inStock || (variant.imported && variant.availability === "UNKNOWN"));
  const estimatedTotal = variant.quoteOnly ? null
    : referenceMass !== undefined && parsedMeters !== null && pricePerTon !== undefined ? calculateMeasuredLineTotal(parsedMeters, referenceMass, pricePerTon)
    : estimateTotal(parsedMeters, parsedTons);
  const missingBeamMass = kind === "beam" && !hasMass && referenceMass === undefined;
  const needsMassForLength = missingBeamMass && parsedMeters !== null && parsedMeters > 0;
  const totalLabel = needsMassForLength ? "Для расчёта нужна масса 1 м"
    : variant.quoteOnly || pricePerTon === undefined ? "По запросу" : estimatedTotal === null ? "Укажите объём" : `${referenceTons !== null ? "≈ " : ""}${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(estimatedTotal)}`;
  const totalClassName = estimatedTotal === null
    ? "text-xs font-normal text-slate-500 dark:text-slate-400"
    : "font-semibold tabular-nums text-slate-900 dark:text-slate-100";
  const enteredQuantity = draft === null && cartLine && !savedMeasurement ? enteredTons : inputMode === "meter" ? enteredMeters : enteredTons;
  const isSaved = !!cartLine && !cartLine.invalidReason && parsedTons !== null && parsedTons > 0 && savedTons !== null
    && enteredQuantity !== 0
    && (savedMeasurement?.inputMode === inputMode ? parsedTons === savedTons
      : Math.abs(parsedTons - savedTons) <= Math.max(1, savedTons) * Number.EPSILON * 32)
    && estimatedTotal === cartLine.estimatedTotal
    && (hasMass || !(enteredMeters && enteredMeters > 0));
  const hasChanges = !!cartLine && !isSaved;
  const shouldRemove = !!cartLine && enteredQuantity === 0;
  const activeValue = inputMode === "meter" ? meters : tons;
  const usableDraft = draft === null || shouldRemove || (draft.exactQuantity ?? parseOrderQuantity(activeValue) ?? 0) > 0;
  const cannotCalculate = enteredQuantity !== null && enteredQuantity > 0 &&
    ((hasMass && (!parsedMeters || !parsedTons)) || (pricePerTon !== undefined && !variant.quoteOnly && parsedTons !== null && estimatedTotal === null));
  const invalidDraft = draft !== null && activeValue.trim() !== ""
    && (enteredQuantity === null || (enteredQuantity === 0 && !shouldRemove) || cannotCalculate);
  const buttonLabel = removed ? "Удалено" : !canPurchase ? "Под заказ" : shouldRemove ? "Удалить" : isSaved
    ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : hasChanges ? "Обновить" : "В корзину";
  const buttonClassName = removed ? filterStyles.removedCartButton
    : shouldRemove ? filterStyles.removeCartButton
      : isSaved ? filterStyles.savedCartButton
        : hasChanges && canPurchase ? filterStyles.updateCartButton
          : filterStyles.cartButton;
  let feedbackText = message?.text;
  if (!feedbackText) {
    if (invalidDraft) feedbackText = "Проверьте введённое значение.";
    else if (hasChanges && !shouldRemove) feedbackText = activeValue.trim() ? "Не сохранено" : enterQuantityMessage;
  }
  const pieceCount = !invalidDraft && pipeOrder && pipeOrder.pieces > 0 ? `${pipeOrder.pieces} шт.` : "";
  const status = [pieceCount, feedbackText].filter(Boolean).join(" · ");

  function showError(text: string) {
    setMessage({kind: "error", text});
  }

  function estimateTotal(orderMeters: number | null, orderTons: number | null) {
    if (orderTons === null || pricePerTon === undefined) return null;
    return orderMeters !== null && hasMass && (inputMode === "meter" || roundToWholePipes)
      ? calculateMeasuredLineTotal(orderMeters, mass, pricePerTon)
      : calculateLineTotal(orderTons, pricePerTon);
  }

  function quantityOptions(mode: OrderInputMode) {
    if (referenceMass !== undefined && mode === "meter") {
      return getMeasurementQuantityOptions({...variant, weightPerMeterKg: referenceMass}, mode);
    }
    return getMeasurementQuantityOptions(variant, mode);
  }

  function readQuantity(value: string, mode: OrderInputMode) {
    if (draft?.inputMode === mode && draft.exactQuantity !== undefined) return draft.exactQuantity;
    return validQuantity(value, mode);
  }

  function validQuantity(value: string, mode: OrderInputMode) {
    const corrected = correctOrderQuantity(value, {...quantityOptions(mode), minimum: 0});
    return corrected.capped || corrected.message ? null : parseOrderQuantity(value);
  }

  function updateQuantityField(mode: OrderInputMode, value: string) {
    const options = quantityOptions(mode);
    const constrained = constrainOrderQuantityInput(value, options.maximum, bound => formatMeasuredQuantity(bound, mode));
    value = constrained.value;
    const entered = parseOrderQuantity(value);
    const previousValue = mode === "meter" ? meters : tons;
    const previousExact = mode === "meter" ? parsedMeters : parsedTons;
    const sameDisplayedQuantity = entered !== null && entered === parseOrderQuantity(previousValue);
    if (!sameDisplayedQuantity || constrained.capped || message?.kind === "error") setMessage(null);
    if (!constrained.capped && sameDisplayedQuantity && mode !== inputMode && previousExact !== null) {
      // Reformatting the converted field must keep the original pricing basis.
      setDraft({inputMode, meters: mode === "meter" ? value : meters, tons: mode === "ton" ? value : tons,
        exactQuantity: (inputMode === "meter" ? parsedMeters : parsedTons) ?? undefined});
      return;
    }
    // Editing the formatting of a converted value preserves the original physical quantity.
    const exactQuantity = constrained.capped ? options.maximum
      : sameDisplayedQuantity ? previousExact ?? undefined : undefined;
    const parsed = exactQuantity ?? validQuantity(value, mode);
    const whole = roundToWholePipes && parsed !== null ? wholePipeOrder(variant, parsed, mode) : null;
    if (mode === "meter") {
      const converted = parsed === null ? null : roundToWholePipes ? whole?.weightTons ?? null : metersToTons(parsed, mass);
      setDraft({inputMode: mode, meters: value, tons: hasMass ? displayQuantity(converted, "ton") : "", exactQuantity});
    } else {
      const converted = parsed === null ? null : roundToWholePipes ? whole?.meters ?? null : tonsToMeters(parsed, mass);
      setDraft({inputMode: mode, tons: value, meters: hasMass ? displayQuantity(converted, "meter") : "", exactQuantity});
    }
  }

  function resolvedOrder(mode: OrderInputMode) {
    const options = quantityOptions(mode);
    const raw = mode === "meter" ? meters : tons;
    const exact = draft?.inputMode === mode ? draft.exactQuantity : undefined;
    const entered = exact ?? parseOrderQuantity(raw);
    if (entered === null || (entered === 0 && !cartLine)) return null;
    const corrected = correctOrderQuantity(exact === undefined ? raw : formatCatalogNumber(exact), {
      ...options,
      minimum: entered === 0 ? 0 : options.minimum,
      decimalPlaces: exact === undefined ? options.decimalPlaces : undefined,
      formatFeedback: quantity => formatMeasuredQuantity(quantity, mode, true),
    });
    const quantity = parseOrderQuantity(corrected.value);
    if (quantity === null) return null;
    const whole = roundToWholePipes ? wholePipeOrder(variant, quantity, mode) : null;
    const nextMeters = roundToWholePipes ? whole?.meters ?? null : mode === "meter" ? quantity : hasMass ? tonsToMeters(quantity, mass) : null;
    const nextTons = roundToWholePipes ? whole?.weightTons ?? null : mode === "ton" ? quantity : hasMass ? metersToTons(quantity, mass) : null;
    const exactQuantity = whole ? mode === "meter" ? whole.meters : whole.weightTons : quantity;
    return {quantity: exactQuantity, meters: nextMeters, tons: nextTons,
      draft: {inputMode: mode, meters: displayQuantity(nextMeters, "meter"),
        tons: displayQuantity(nextTons, "ton"), exactQuantity},
      message: roundToWholePipes ? undefined : corrected.message};
  }

  function settleQuantity(mode: OrderInputMode) {
    if (draft?.inputMode !== mode) return;
    const next = resolvedOrder(mode);
    if (!next) return;
    setDraft(next.draft);
    if (next.message) setMessage({kind: "correction", text: next.message});
  }

  function addToCart() {
    if (!hydrated || isSaved || removed) return;
    if (draft === null && enteredQuantity === null) {
      showError(enterQuantityMessage);
      return;
    }
    const next = resolvedOrder(inputMode);
    if (!next) return;
    if (cartLine && next.quantity === 0) {
      removeItem(variant.id);
      setDraft(null);
      setMessage(null);
      setRemoved(true);
      return;
    }
    setDraft(next.draft);
    // Blur can have corrected the value before the click. Keep its feedback when saving.
    setMessage(next.message ? {kind: "correction", text: next.message} : message?.kind === "correction" ? message : null);
    const nextTotal = estimateTotal(next.meters, next.tons);
    if (!next.tons || (hasMass && !next.meters)) {
      showError(enterQuantityMessage);
      return;
    }
    if (!canPurchase || nextTotal === null || pricePerTon === undefined || (!hasMass && inputMode === "meter")) return;
    if (cartLine) {
      updateQuantity(variant.id, inputMode === "meter" ? next.meters! : next.tons, hasMass ? inputMode : undefined);
    } else if (!hasMass) {
      addItem(variant.id, next.tons);
    } else {
      addItem(
        variant.id,
        inputMode === "meter" ? next.meters! : next.tons,
        {
          inputMode,
          meters: next.meters!,
          weightTons: next.tons,
          pricePerTon,
          estimatedTotal: nextTotal,
        },
      );
    }
    setDraft(null);
  }

  const actionSizeClassName = view === "card" ? "w-full" : tableStyles.tableAction;
  const action = !canPurchase && !shouldRemove && !removed ? (
    <QuoteRequestButton label={needsQuote ? "Запросить цену" : "Под заказ"}
      order={{product: formatQuoteProductName(variant), meters: invalidDraft ? null : parsedMeters, tons: invalidDraft ? null : parsedTons}}
      className={`${filterStyles.quoteButton} ${actionSizeClassName} px-3`}/>
  ) : (
    <Button type="button" disabled={!hydrated || isSaved || removed || !usableDraft || (!canPurchase && !shouldRemove)} onClick={addToCart}
      className={`${buttonClassName} ${actionSizeClassName} whitespace-nowrap px-3`}>
      {shouldRemove ? "Удалить" : buttonLabel}
    </Button>
  );

  const showOrderLabels = view === "card";
  const statusId = `measured-order-status-${view}-${variant.id}`;
  const meterInput = <OrderInput label={`Длина заказа для ${variant.name}`}
    placeholder={missingBeamMass && parsedTons !== null && parsedTons > 0 ? "—" : "0"}
    visibleLabel={showOrderLabels ? "Заказ, м" : undefined} value={meters || displayQuantity(referenceMeters, "meter")} invalid={invalidDraft && inputMode === "meter"} statusId={statusId}
    onChange={value => updateQuantityField("meter", value)} onBlur={() => settleQuantity("meter")} onRejectedTransfer={showError}/>;
  const tonInput = <OrderInput label={`Вес заказа в тоннах для ${variant.name}`}
    placeholder={needsMassForLength ? "—" : "0"}
    visibleLabel={showOrderLabels ? "Заказ, т" : undefined} value={tons || displayQuantity(referenceTons, "ton")} invalid={invalidDraft && inputMode === "ton"} statusId={statusId}
    onChange={value => updateQuantityField("ton", value)} onBlur={() => settleQuantity("ton")} onRejectedTransfer={showError}/>;
  const price = `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`;
  const total = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>;
  const statusColor = invalidDraft || message?.kind === "error" ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400";
  const statusSpacing = view === "table" ? "mx-auto mt-1 max-w-32" : "mt-1";
  const orderStatus = <span id={statusId} role="status" className={`block text-xs ${statusSpacing} ${statusColor}`}>{status}</span>;
  const order = <CatalogVariantOrder view={view} quantity={meterInput} secondaryQuantity={tonInput}
    action={action} total={total} status={orderStatus}/>;

  if (isRebar) return <RebarVariantLayout view={view} variant={variant} price={price} order={order}/>;

  const legacyDetails = <div className="space-y-2 text-left text-sm font-normal text-slate-600 dark:text-slate-300">
    <p className="font-bold text-slate-900 dark:text-slate-100">{variant.name}</p>
    <p>{variant.availability === "UNKNOWN" ? "Наличие уточняется" : variant.availability === "IN_STOCK" ? "В наличии" : "Под заказ"}</p>
    <p>{variant.shortDescription}</p>
    <p>{variant.description}</p>
    {isVgp && <p>Марка стали, исполнение резьбы и наличие муфт уточняются по документам поставки.</p>}
    {isPipe && variant.sourceProductName && <p>Обозначение поставщика — {variant.sourceProductName}</p>}
  </div>;

  const outsideDiameter = variant.diameterMm === undefined ? "—" : formatNumber(variant.diameterMm);
  const pipeSize = isVgp ? vgpSize(variant) : `${outsideDiameter} × ${formatNumber(variant.wallThicknessMm ?? 0)}`;
  const pipeLength = variant.lengthRangeMeters?.map(formatNumber).join("–")
    ?? (variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters));
  const pipeTolerance = variant.supplierLengthToleranceMm === undefined ? undefined
    : `±${formatNumber(variant.supplierLengthToleranceMm)} мм`;
  const pipeMass = hasMass ? formatNumber(mass) : undefined;
  const pipeMassLabel = kind === "pipe" && variant.coatingType === "galvanized"
    ? "Теоретическая масса без цинкового покрытия" : "Теоретическая масса";
  const lengthWithUnit = pipeLength ? <>
    <span className="whitespace-nowrap">{pipeLength} м</span>
    {pipeTolerance && <> <span className="whitespace-nowrap">({pipeTolerance})</span></>}
  </> : "—";
  const details = isOrdinaryVgp ? <VgpVariantDetails variant={variant}
    length={pipeLength ? lengthWithUnit : undefined} mass={hasMass ? mass : undefined}/> : legacyDetails;
  const specifications = <CatalogVariantSpecifications items={isPipe ? [
    {label: isVgp ? "Ду × стенка, мм" : "Наружный Ø × стенка, мм", value: <span className="whitespace-nowrap">{pipeSize}</span>},
    isVgp ? {label: "Наружный Ø, мм", value: outsideDiameter}
      : {label: "Марка стали", value: variant.steelGrade ?? "Уточняется"},
    {label: "Длина по каталогу", value: lengthWithUnit},
    ...(!isVgp ? [{label: pipeMassLabel, value: pipeMass ? `${pipeMass} кг/м` : "—"}] : []),
  ] : [
    {label: "Профиль", value: beamProfile(variant)},
    {label: "Тип балки", value: beamKind(variant)},
    {label: "Сталь / класс", value: variant.steelGrade ?? "—"},
    ...(variant.standard ? [{label: "Стандарт", value: beamStandardLabel(variant)}] : []),
    referenceMass !== undefined
      ? {label: "Справочная масса по ГОСТ 35087-2024", value: `${formatNumber(referenceMass)} кг/м`}
      : {label: "Теоретическая масса", value: hasMass ? `${formatNumber(mass)} кг/м` : "—"},
    {label: "Длина", value: variant.lengthMeters === undefined ? "—" : `${formatNumber(variant.lengthMeters)} м`},
  ]}/>;
  const detailsLabel = isVgp ? "Подробнее" : "Подробнее о товаре";
  const moreDetails = view === "card"
    ? <details className={isOrdinaryVgp ? `${tableStyles.vgpDetailsDisclosure} mt-3 border-t border-slate-200 text-sm dark:border-slate-700` : "mt-3 text-sm"}>
      <DetailsSummary className="font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:focus-visible:outline-brand-300">{detailsLabel}</DetailsSummary>
      <div className={isOrdinaryVgp ? "pt-2" : "mt-3"}>{details}</div></details>
    : <button type="button" aria-expanded={detailsOpen} aria-controls={`pipe-details-${variant.id}`}
      aria-label={`Подробности: ${variant.name}`} onClick={() => setDetailsOpen(!detailsOpen)}
      className={`mt-2 cursor-pointer rounded-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:decoration-slate-500 dark:focus-visible:outline-brand-300 ${isVgp ? "whitespace-nowrap text-xs" : "text-sm"} ${isOrdinaryVgp ? "inline-flex min-h-8 items-center gap-0.5" : ""} ${isOrdinaryVgp && detailsOpen ? "" : "hover:text-brand-700 dark:hover:text-brand-400"}`}>
      {detailsLabel}
      {isOrdinaryVgp && <Icon name="chevron-down" className={detailsOpen ? "rotate-180" : ""}/>}
    </button>;
  const tableSpecifications = isPipe ? {
    heading: <><span className="block">{pipeSize}</span>{moreDetails}</>,
    cells: <>
      {isVgp ? <td className="tabular-nums">{outsideDiameter}</td>
        : <td>{variant.steelGrade ?? <><span aria-hidden="true">—</span><span className="sr-only">Уточняется</span></>}</td>}
      <td className="tabular-nums">{pipeLength ?? "—"}{pipeTolerance && <small className="block whitespace-nowrap text-xs font-normal text-slate-600 dark:text-slate-400">{pipeTolerance}</small>}</td>
      {!isVgp && <td className="tabular-nums">{pipeMass ?? "—"}</td>}
    </>,
  } : undefined;
  return <>
    <CatalogVariantLayout view={view} variant={variant} name={name} tableSpecifications={tableSpecifications} specifications={isDemonstrationProduct(variant)
      ? <p className="text-sm text-slate-600 dark:text-slate-400">Характеристики требуют подтверждения перед заказом.</p>
      : <>{specifications}{isPipe && !isOrdinaryVgp && moreDetails}</>}
      cardDetails={isOrdinaryVgp && view === "card" && !isDemonstrationProduct(variant) ? moreDetails : undefined}
      price={price} order={order}/>
    {isPipe && view === "table" && <tr id={`pipe-details-${variant.id}`} hidden={!detailsOpen}
      className={isOrdinaryVgp ? tableStyles.vgpDetailsRow : "border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"}>
      <td colSpan={isVgp ? 9 : 10} className={isOrdinaryVgp ? "p-5" : "p-4"}>{details}</td>
    </tr>}
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
  const unverified = isDemonstrationProduct(variant);
  const mass = unverified ? undefined : variant.weightPerMeterKg;
  const steelGrade = unverified ? "Уточняется" : variant.steelGrade ?? "—";
  const length = variant.lengthMeters;

  if (view === "card") return (
    <article id={`variant-mobile-${variant.id}`} className={`${tableStyles.card} min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
      <h3 className="text-card-title">{variant.name}</h3>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {[
          ["Диаметр", `${diameter} мм`],
          ["Форма", form],
          ["Марка стали", steelGrade],
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
      <th scope="row" className="font-semibold">{diameter}</th>
      <td>{form}</td>
      <td>{steelGrade}</td>
      <td className="font-semibold tabular-nums">{price}</td>
      <td>{mass !== undefined && mass > 0 ? formatNumber(mass) : "—"}</td>
      <td>{length === undefined ? "—" : formatNumber(length)}</td>
      {order}
    </tr>
  );
}

function OrderInput({
  label,
  placeholder,
  visibleLabel,
  value,
  onChange,
  onBlur,
  onRejectedTransfer,
  invalid,
  statusId,
}: {
  label: string;
  placeholder: string;
  visibleLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onRejectedTransfer: (message: string) => void;
  invalid: boolean;
  statusId: string;
}) {
  const alignment = visibleLabel ? "px-2" : "px-2 text-center";
  const input = <Input aria-label={label} aria-invalid={invalid || undefined} aria-describedby={statusId} type="text" inputMode="decimal" onBlur={onBlur}
    {...quantityTransferHandlers(onRejectedTransfer)}
    value={value} onChange={event => onChange(event.target.value)}
    onKeyDown={event => {if (event.key === "Enter" && !event.nativeEvent.isComposing) {event.preventDefault(); event.currentTarget.blur();}}}
    className={`${filterStyles.field} ${tableStyles.measurementInput} w-full min-w-0 ${alignment} tabular-nums focus:placeholder:text-transparent`} placeholder={placeholder}/>;
  return (
    <label className="block text-sm font-semibold">
      {visibleLabel && <span className="mb-1 block">{visibleLabel}</span>}
      {input}
    </label>
  );
}

function displayQuantity(value: number | null, mode: OrderInputMode) {
  return value === null ? "" : formatMeasuredQuantity(value, mode);
}

function formLabel(form: "coil" | "bar") {
  return form === "coil" ? "В бунтах" : "Пруток";
}

