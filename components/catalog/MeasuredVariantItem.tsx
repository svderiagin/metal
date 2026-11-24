"use client";

import {Fragment, useEffect, useState, type ReactNode} from "react";
import {beamProfile, beamReferenceMassKg, beamSection, beamSeries, beamStandardLabel} from "@/lib/beam";
import {vgpSize} from "@/lib/vgp";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantSpecifications} from "./CatalogVariantLayout";
import {Button} from "@/components/ui/Button";
import {CatalogOrderInput} from "./CatalogOrderInput";
import {Icon} from "@/components/ui/Icon";
import {ProfilePipeVariantItem} from "./ProfilePipeVariantItem";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {calculateLineTotal, calculateMeasuredLineTotal, getMeasurementQuantityOptions, metersToTons, requiresWholeLengthOrder, tonsToMeters, wholeLengthOrder} from "@/lib/orderMeasurement";
import {constrainOrderQuantityInput, correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {correctDraftPrecision, formatMeasuredQuantity, formatQuantityForInput, formatRebarOrderTons, measuredTonFractionDigits, rebarMinimumMeterEntry, rebarMinimumTonEntry, rebarTonFractionDigits} from "@/lib/cartQuantityInput";
import type {OrderInputMode} from "@/types/cart";
import type {ProductVariant} from "@/types/product";
import {isDemonstrationProduct, requiresCatalogPriceQuote, storefrontAvailability} from "@/lib/catalogOffer";
import {a240SubcategoryId, a40025g2sSubcategoryId, a40035gsSubcategoryId, a500cSubcategoryId} from "@/lib/rebar";
import {orderQuantityHintDuration, useOrderDraft} from "./OrderDraftProvider";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogStandardReference} from "./CatalogStandardReference";
import {PipePositionDetails} from "./PipePositionDetails";

type OrderFeedback = {kind: "correction" | "error"; text: string};

export function MeasuredVariantItem({
  variant, view, kind, name, showSteelGrade, sharedPipeStandard, showBeamStandard,
}: {
  variant: ProductVariant; view: "table" | "card"; kind: "rebar" | "beam" | "vgp" | "pipe" | "profile";
  name?: string; showSteelGrade?: boolean; sharedPipeStandard?: string; showBeamStandard?: boolean;
}) {
  return kind === "profile" ? <ProfilePipeVariantItem variant={variant} view={view}/>
    : <TonnageMeasuredVariantItem variant={variant} view={view} kind={kind} name={name}
      showSteelGrade={showSteelGrade} sharedPipeStandard={sharedPipeStandard} showBeamStandard={showBeamStandard}/>;
}

function TonnageMeasuredVariantItem({
  variant,
  view,
  kind,
  name,
  showSteelGrade,
  sharedPipeStandard,
  showBeamStandard = true,
}: {
  variant: ProductVariant;
  name?: string;
  showSteelGrade?: boolean;
  sharedPipeStandard?: string;
  showBeamStandard?: boolean;
  kind: "rebar" | "beam" | "vgp" | "pipe";
  view: "table" | "card";
}) {
  const {addItem, updateQuantity, removeItem, lines, hydrated} = useCart();
  const hasMass = !isDemonstrationProduct(variant) && variant.weightPerMeterKg !== undefined && variant.weightPerMeterKg > 0;
  const mass = variant.weightPerMeterKg ?? 0;
  const referenceMass = beamReferenceMassKg(variant);
  const isRebar = kind === "rebar";
  const isVgp = kind === "vgp";
  const isPipe = isVgp || kind === "pipe";
  const wholeLengths = requiresWholeLengthOrder(variant);
  const roundToWholeLengths = wholeLengths && hasMass && Number.isFinite(variant.lengthMeters) && (variant.lengthMeters ?? 0) > 0;
  const [editingTons, setEditingTons] = useState(false);
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
  const requestedQuantity = inputMode === "meter" ? enteredMeters : enteredTons;
  const wholeOrder = roundToWholeLengths && requestedQuantity !== null ? wholeLengthOrder(variant, requestedQuantity, inputMode) : null;
  const parsedMeters = roundToWholeLengths ? wholeOrder?.meters ?? null : !hasMass ? enteredMeters : inputMode === "meter" ? enteredMeters : enteredTons === null ? null : tonsToMeters(enteredTons, mass);
  const parsedTons = roundToWholeLengths ? wholeOrder?.weightTons ?? null : !hasMass ? enteredTons : inputMode === "ton" ? enteredTons : enteredMeters === null ? null : metersToTons(enteredMeters, mass);
  // A reference conversion is displayed in the opposite field. The cart and
  // quote still receive only the quantity entered for this supplier's offer.
  const referenceTons = referenceMass !== undefined && parsedMeters !== null ? metersToTons(parsedMeters, referenceMass) : null;
  const referenceMeters = referenceMass !== undefined && parsedTons !== null ? tonsToMeters(parsedTons, referenceMass) : null;
  const pricePerTon = variant.pricePerTon;
  const needsQuote = pricePerTon === undefined || requiresCatalogPriceQuote(variant)
    || (wholeLengths && !roundToWholeLengths) || (!hasMass && enteredMeters !== null && enteredMeters > 0);
  const madeToOrder = storefrontAvailability(variant.availability) === "ON_ORDER";
  const canAdd = madeToOrder || !needsQuote;
  const requiresTonnage = madeToOrder && !hasMass;
  const estimatedTotal = variant.quoteOnly ? null
    : referenceMass !== undefined && parsedMeters !== null && pricePerTon !== undefined ? calculateMeasuredLineTotal(parsedMeters, referenceMass, pricePerTon)
    : estimateTotal(parsedMeters, parsedTons);
  const missingMass = (kind === "beam" || isRebar) && !hasMass && referenceMass === undefined;
  const needsMassForLength = missingMass && parsedMeters !== null && parsedMeters > 0;
  const unconfirmedRebarLength = isRebar && isDemonstrationProduct(variant) && needsMassForLength;
  const totalLabel = unconfirmedRebarLength ? "Длина поставки и масса 1 м уточняются"
    : needsMassForLength ? "Для расчёта нужна масса 1 м"
    : variant.quoteOnly || pricePerTon === undefined ? "По запросу" : estimatedTotal === null ? "Укажите объём" : `${referenceTons !== null ? "≈ " : ""}${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(estimatedTotal)}`;
  const totalClassName = estimatedTotal === null
    ? "text-xs font-normal text-slate-500 dark:text-slate-400"
    : `font-semibold tabular-nums text-slate-900 dark:text-slate-100`;
  const enteredQuantity = draft === null && cartLine && !savedMeasurement ? enteredTons : inputMode === "meter" ? enteredMeters : enteredTons;
  const isSaved = !!cartLine && !cartLine.invalidReason && parsedTons !== null && parsedTons > 0 && savedTons !== null
    && enteredQuantity !== 0
    && (savedMeasurement?.inputMode === inputMode ? parsedTons === savedTons
      : Math.abs(parsedTons - savedTons) <= Math.max(1, savedTons) * Number.EPSILON * 32)
    && (cartLine.priceRequiresQuote || estimatedTotal === cartLine.estimatedTotal)
    && (hasMass || !(enteredMeters && enteredMeters > 0));
  const hasChanges = !!cartLine && !isSaved;
  const shouldRemove = !!cartLine && enteredQuantity === 0;
  const activeValue = inputMode === "meter" ? meters : tons;
  const enteringFraction = activeValue === "0,";
  const canPromptForQuantity = activeValue === "";
  const usableDraft = canPromptForQuantity || draft === null || shouldRemove || (draft.exactQuantity ?? parseDraftQuantity(activeValue) ?? 0) > 0;
  const cannotCalculate = enteredQuantity !== null && enteredQuantity > 0 &&
    ((hasMass && (!parsedMeters || !parsedTons)) || (!needsQuote && parsedTons !== null && estimatedTotal === null));
  const invalidDraft = draft !== null && !enteringFraction && activeValue.trim() !== ""
    && (enteredQuantity === null || (enteredQuantity === 0 && !shouldRemove) || cannotCalculate);
  const tinyRebarMeters = isRebar && parsedMeters !== null && parsedMeters > 0 && parsedMeters < rebarMinimumMeterEntry / 2;
  const displayedMeters = tinyRebarMeters ? "" : meters;
  const showRoundedTons = (isVgp || isRebar) && !editingTons && !invalidDraft && parsedTons !== null;
  const tinyRebarTons = showRoundedTons && isRebar && parsedTons > 0 && parsedTons < rebarMinimumTonEntry / 2;
  const displayedTons = !showRoundedTons ? tons : isRebar
    ? tinyRebarTons ? "" : formatRebarOrderTons(parsedTons, true) : formatQuantityForInput(parsedTons, false, 3);
  const buttonLabel = removed ? "Удалено" : shouldRemove ? "Удалить" : isSaved
    ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : hasChanges ? "Обновить" : madeToOrder ? "Заказать" : "В корзину";
  const buttonClassName = removed ? filterStyles.removedCartButton
    : shouldRemove ? filterStyles.removeCartButton
      : isSaved ? filterStyles.savedCartButton
        : hasChanges && canAdd ? filterStyles.updateCartButton
          : filterStyles.cartButton;
  const unsavedMessage = "Не сохранено";
  const showUnsaved = hasChanges && !shouldRemove && !enteringFraction && !invalidDraft && !!activeValue;
  let feedbackText = message?.text;
  if (!feedbackText) {
    if (invalidDraft) feedbackText = "Проверьте введённое значение.";
    else if (requiresTonnage && parsedTons === null) feedbackText = "Укажите массу заказа.";
  }
  const pieceCount = !invalidDraft && wholeOrder && wholeOrder.pieces > 0 ? `${wholeOrder.pieces} шт.` : "";
  const status = <>
    {pieceCount && <span className="block">{pieceCount}</span>}
    {showUnsaved && <span className="block whitespace-nowrap">{unsavedMessage}</span>}
    {feedbackText && <span className="block">{feedbackText}</span>}
  </>;

  function showEnterQuantityHint() {
    setMessage({kind: "error", text: "Укажите длину или вес больше нуля."}, orderQuantityHintDuration);
  }

  function estimateTotal(orderMeters: number | null, orderTons: number | null) {
    if (orderTons === null || pricePerTon === undefined) return null;
    return orderMeters !== null && hasMass && (inputMode === "meter" || roundToWholeLengths)
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
    return corrected.capped || corrected.message ? null : parseDraftQuantity(value);
  }

  function parseDraftQuantity(value: string) {
    return value === "0," ? null : parseOrderQuantity(value);
  }

  function updateQuantityField(mode: OrderInputMode, value: string) {
    const isVgpTonInput = isVgp && mode === "ton";
    const isRebarTonInput = isRebar && mode === "ton";
    const options = quantityOptions(mode);
    let substitutedMinimum: number | undefined;
    let unroundedQuantity: number | undefined;
    if (isVgpTonInput && /,\d{4}/u.test(value)) return false;
    if (!isVgpTonInput) {
      const precision = mode === "meter" ? 2 : isRebarTonInput ? rebarTonFractionDigits : options.decimalPlaces ?? measuredTonFractionDigits;
      const correction = correctDraftPrecision(value, precision, options,
        roundToWholeLengths ? amount => {
          const order = wholeLengthOrder(variant, amount, mode);
          return mode === "meter" ? order?.meters : order?.weightTons;
        } : undefined);
      if (correction) {
        value = correction.text;
        substitutedMinimum = correction.substitutedMinimum;
        unroundedQuantity = correction.exactQuantity;
      }
    }
    if (isVgpTonInput || isRebarTonInput) setEditingTons(true);
    const constrained = constrainOrderQuantityInput(value, options.maximum, bound =>
      isRebarTonInput ? formatRebarOrderTons(bound, true)
        : isVgpTonInput ? formatQuantityForInput(bound, false, 3) : formatMeasuredQuantity(bound, mode));
    value = constrained.value;
    const entered = parseDraftQuantity(value);
    const previousValue = mode === "meter" ? displayedMeters : displayedTons;
    const previousExact = mode === "meter" ? parsedMeters : parsedTons;
    const sameDisplayedQuantity = substitutedMinimum === undefined && unroundedQuantity === undefined
      && entered !== null && entered === parseDraftQuantity(previousValue);
    if (cartLine && !value.trim()) {
      showEnterQuantityHint();
    } else if (substitutedMinimum !== undefined && mode === "meter" && !roundToWholeLengths) {
      setMessage({kind: "correction", text: `Значение увеличено до минимума ${formatMeasuredQuantity(substitutedMinimum, mode, true)}.`});
    } else if (!sameDisplayedQuantity || constrained.capped || message?.kind === "error") setMessage(null);
    if (!constrained.capped && sameDisplayedQuantity && mode !== inputMode && previousExact !== null) {
      // Reformatting the converted field must keep the original pricing basis.
      setDraft({inputMode, meters: mode === "meter" ? value : meters, tons: mode === "ton" ? value : tons,
        exactQuantity: (inputMode === "meter" ? parsedMeters : parsedTons) ?? undefined});
      return;
    }
    // Editing the formatting of a converted value preserves the original physical quantity.
    const exactQuantity = constrained.capped ? options.maximum
      : substitutedMinimum ?? unroundedQuantity ?? (sameDisplayedQuantity ? previousExact ?? undefined : undefined);
    const parsed = exactQuantity ?? validQuantity(value, mode);
    const whole = roundToWholeLengths && parsed !== null ? wholeLengthOrder(variant, parsed, mode) : null;
    if (mode === "meter") {
      const converted = parsed === null ? null : roundToWholeLengths ? whole?.weightTons ?? null : metersToTons(parsed, mass);
      setDraft({inputMode: mode, meters: value, tons: hasMass ? displayQuantity(converted, "ton") : "", exactQuantity});
    } else {
      const converted = parsed === null ? null : roundToWholeLengths ? whole?.meters ?? null : tonsToMeters(parsed, mass);
      setDraft({inputMode: mode, tons: value, meters: hasMass ? displayQuantity(converted, "meter") : "", exactQuantity});
    }
  }

  function resolvedOrder(mode: OrderInputMode) {
    const options = quantityOptions(mode);
    const raw = mode === "meter" ? meters : tons;
    const exact = draft?.inputMode === mode ? draft.exactQuantity : undefined;
    const entered = exact ?? parseDraftQuantity(raw);
    if (entered === null || (entered === 0 && !cartLine)) return null;
    const corrected = correctOrderQuantity(exact === undefined ? raw : formatCatalogNumber(exact), {
      ...options,
      minimum: entered === 0 ? 0 : options.minimum,
      decimalPlaces: exact === undefined ? options.decimalPlaces : undefined,
      formatFeedback: quantity => formatMeasuredQuantity(quantity, mode, true),
    });
    const quantity = parseOrderQuantity(corrected.value);
    if (quantity === null) return null;
    const whole = roundToWholeLengths ? wholeLengthOrder(variant, quantity, mode) : null;
    const nextMeters = roundToWholeLengths ? whole?.meters ?? null : mode === "meter" ? quantity : hasMass ? tonsToMeters(quantity, mass) : null;
    const nextTons = roundToWholeLengths ? whole?.weightTons ?? null : mode === "ton" ? quantity : hasMass ? metersToTons(quantity, mass) : null;
    const exactQuantity = whole ? mode === "meter" ? whole.meters : whole.weightTons : quantity;
    return {quantity: exactQuantity, meters: nextMeters, tons: nextTons,
      draft: {inputMode: mode, meters: displayQuantity(nextMeters, "meter"),
        tons: displayQuantity(nextTons, "ton"), exactQuantity},
      message: roundToWholeLengths ? undefined : corrected.message};
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
    if (canPromptForQuantity) {
      showEnterQuantityHint();
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
    const nextTotal = estimateTotal(next.meters, next.tons);
    if (!next.tons || (hasMass && !next.meters)) {
      showEnterQuantityHint();
      return;
    }
    if (!canAdd || (!needsQuote && nextTotal === null) || (!hasMass && inputMode === "meter")) return;
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
          pricePerTon: pricePerTon ?? 0,
          estimatedTotal: nextTotal ?? 0,
        },
      );
    }
    setDraft(null);
    setMessage(null);
  }

  const actionSizeClassName = view === "card" ? "w-full" : tableStyles.tableAction;
  const statusId = `measured-order-status-${view}-${variant.id}`;
  const deliveryId = madeToOrder ? `${statusId}-delivery` : undefined;
  const needsInquiry = !canAdd && !shouldRemove && !removed;
  const correctedInquiry = needsInquiry && invalidDraft ? resolvedOrder(inputMode) : null;
  const quoteLabel = unconfirmedRebarLength ? "Запросить расчёт" : "Запросить цену";
  const quoteClass = `${filterStyles.quoteButton} ${actionSizeClassName} px-3`;
  const inquiryPieces = !invalidDraft ? wholeOrder?.pieces
    : roundToWholeLengths && correctedInquiry ? wholeLengthOrder(variant, correctedInquiry.quantity, inputMode)?.pieces : undefined;
  const action = needsInquiry ? (
    (enteringFraction || (invalidDraft && !correctedInquiry))
      ? <Button type="button" disabled aria-describedby={statusId} className={quoteClass}>{quoteLabel}</Button>
      : <QuoteRequestButton label={quoteLabel}
        order={{product: formatQuoteProductName(variant),
          meters: correctedInquiry?.meters ?? (invalidDraft ? null : parsedMeters),
          tons: correctedInquiry?.tons ?? (invalidDraft ? null : parsedTons),
          ...(inquiryPieces !== undefined ? {quantity: inquiryPieces, unit: "шт."} : {})}}
        className={quoteClass}/>
  ) : (
    <Button type="button" aria-describedby={deliveryId} disabled={!hydrated || isSaved || removed || !usableDraft || (!canAdd && !shouldRemove)} onClick={addToCart}
      className={`${buttonClassName} ${actionSizeClassName} whitespace-nowrap px-3`}>
      {shouldRemove ? "Удалить" : buttonLabel}
    </Button>
  );

  const showOrderLabels = view === "card";
  const meterInput = <CatalogOrderInput mode="meter" label={`Длина заказа для ${variant.name}`}
    placeholder={requiresTonnage || (missingMass && parsedTons !== null && parsedTons > 0) ? "—" : tinyRebarMeters ? "< 0,01" : "0"}
    disabled={requiresTonnage}
    keepPlaceholderOnFocus={tinyRebarMeters}
    visibleLabel={showOrderLabels ? "Заказ, м" : undefined} value={displayedMeters || displayQuantity(referenceMeters, "meter")} invalid={invalidDraft && inputMode === "meter"} statusId={statusId}
    onChange={value => updateQuantityField("meter", value)} onBlur={() => settleQuantity("meter")}/>;
  const tonInput = <CatalogOrderInput mode="ton" label={`Вес заказа в тоннах для ${variant.name}`}
    placeholder={needsMassForLength ? "—" : tinyRebarTons ? `< ${formatRebarOrderTons(rebarMinimumTonEntry)}` : "0"}
    keepPlaceholderOnFocus={tinyRebarTons}
    visibleLabel={showOrderLabels ? "Заказ, т" : undefined} value={displayedTons || displayQuantity(referenceTons, "ton")}
    invalid={invalidDraft && inputMode === "ton"} statusId={statusId} onChange={value => updateQuantityField("ton", value)}
    onBlur={() => {setEditingTons(false); settleQuantity("ton");}}/>;
  const price = `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`;
  const total = <output data-price={estimatedTotal !== null && !needsMassForLength || undefined} aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>;
  const statusColor = invalidDraft || message?.kind === "error" ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400";
  const statusSpacing = view === "table" ? "mx-auto mt-1 max-w-32" : "mt-1";
  const orderStatus = <span id={statusId} role="status" className={`block text-xs ${statusSpacing} ${statusColor}`}>{status}</span>;
  const order = <CatalogVariantOrder view={view} quantity={meterInput} secondaryQuantity={tonInput} deliveryId={deliveryId}
    action={action} total={total} status={orderStatus}/>;

  if (isRebar) return <RebarVariantLayout view={view} variant={variant} price={price} order={order}/>;

  const unverified = isDemonstrationProduct(variant);
  if (isPipe) {
    const outsideDiameter = variant.diameterMm === undefined ? "—" : formatNumber(variant.diameterMm);
    const pipeSize = isVgp ? vgpSize(variant) : `${outsideDiameter} × ${formatNumber(variant.wallThicknessMm ?? 0)}`;
    const grade = variant.steelGrade || "Уточняется";
    const pipeDesignation = view === "card" ? `Труба Ø${pipeSize} мм` : pipeSize;
    const pipeLength = variant.lengthRangeMeters?.map(formatNumber).join("–")
      ?? (variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters));
    const tolerance = variant.supplierLengthToleranceMm === undefined ? undefined
      : `±${formatNumber(variant.supplierLengthToleranceMm)} мм`;
    const length = pipeLength ? <>
      <span className="whitespace-nowrap">{pipeLength} м</span>
      {tolerance && <> <span className="whitespace-nowrap">({tolerance})</span></>}
    </> : undefined;

    return <CatalogVariantLayout view={view} variant={variant} name={isVgp ? (view === "table" ? pipeSize : name) : pipeDesignation}
      tableSpecifications={[...(isVgp ? [outsideDiameter] : []),
        <Fragment key="length">{pipeLength ?? "—"}{tolerance && <small className="block whitespace-nowrap text-xs font-normal text-slate-600 dark:text-slate-400">{tolerance}</small>}</Fragment>,
        ...(showSteelGrade ? [grade] : []),
      ]}
      specifications={<CatalogVariantSpecifications items={[
        ...(isVgp ? [{label: "Ду × стенка, мм", value: pipeSize}, {label: "Наружный Ø, мм", value: outsideDiameter}] : []),
        {label: "Длина по каталогу", value: length ?? "—"},
        ...(showSteelGrade ? [{label: "Марка стали", value: grade}] : []),
      ]}/>}
      detailsId={`pipe-details-${variant.id}`}
      details={<PipePositionDetails variant={variant} isVgp={isVgp} length={pipeLength && `${pipeLength} м`}
        mass={hasMass ? mass : undefined} sharedPipeStandard={sharedPipeStandard} showSteelGrade={showSteelGrade}/>}
      price={price} order={order}/>;
  }

  const profile = unverified ? "Уточняется" : beamProfile(variant);
  const series = beamSeries(variant);
  const section = beamSection(variant);
  const sectionSize = section ? `${formatNumber(section.height)} × ${formatNumber(section.width)}` : undefined;
  const steelGrade = unverified || !showSteelGrade || variant.steelGrade === "—" ? undefined : variant.steelGrade;
  const length = unverified || variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters);
  const standard = unverified ? undefined : beamStandardLabel(variant);
  const massField = referenceMass !== undefined
    ? {label: "Справочная масса", value: <>
      {formatNumber(referenceMass)} кг/м
      <small className="mt-0.5 block text-xs font-normal">
        <CatalogStandardReference>ГОСТ 35087‑2024</CatalogStandardReference>
      </small>
    </>}
    : {label: "Теоретическая масса", value: hasMass ? `${formatNumber(mass)} кг/м` : undefined};
  const fields = [
    {label: "Профиль", value: profile},
    ...(section ? [
      {label: "Высота сечения", value: `${formatNumber(section.height)} мм`},
      {label: "Ширина полки", value: `${formatNumber(section.width)} мм`},
      {label: "Толщина стенки", value: `${formatNumber(section.web)} мм`},
      {label: series === "М" ? "Средняя толщина полки" : "Толщина полки", value: `${formatNumber(section.flange)} мм`},
    ] : []),
    {label: "Марка стали", value: steelGrade},
    {label: "Стандарт", value: showBeamStandard ? standard : undefined},
    massField,
  ];
  const designation = name ?? profile;
  return <CatalogVariantLayout view={view} variant={variant}
    name={view === "table" || designation.startsWith("Балка ") ? designation : `Балка ${designation}`}
    nameNote={steelGrade}
    tableSpecifications={[<span key="size" className="whitespace-nowrap">{sectionSize ?? "—"}</span>, length ?? "—"]}
    specifications={<CatalogVariantSpecifications items={[
      {label: "Размер сечения", value: sectionSize && `${sectionSize} мм`},
      {label: "Длина", value: length && `${length} м`},
    ]}/>}
    details={<CatalogPositionDetails productName={variant.name} fields={fields}
      note={unverified ? variant.description : undefined}/>}
    price={price} order={order}/>;
}

function RebarVariantLayout({view, variant, price, order}: {
  view: "table" | "card";
  variant: ProductVariant;
  price: string;
  order: ReactNode;
}) {
  const isA500c = variant.subcategoryId === a500cSubcategoryId;
  const isA240 = variant.subcategoryId === a240SubcategoryId;
  const isA40035gs = variant.subcategoryId === a40035gsSubcategoryId;
  const isA40025g2s = variant.subcategoryId === a40025g2sSubcategoryId;
  const unverified = isDemonstrationProduct(variant);
  const diameter = unverified ? variant.name.match(/(\d+(?:[.,]\d+)?)\s*мм$/iu)?.[1]?.replace(".", ",")
    : variant.diameterMm === undefined ? undefined : formatNumber(variant.diameterMm);
  const form = unverified || variant.form === undefined ? "Уточняется" : formLabel(variant.form);
  const length = unverified || variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters);
  const standard = variant.standard === "ГОСТ 5781-82" ? "ГОСТ 5781-82 (таблица 1)" : variant.standard;

  const fields = [
    {label: "Диаметр", value: diameter ? `${diameter} мм` : "—"},
    {label: "Форма", value: form},
    {label: "Длина", value: length ? `${length} м` : "—"},
  ];
  const detailsFields = [
    {label: "Диаметр", value: diameter && `${diameter} мм`},
    {label: "Форма поставки", value: form},
    {label: "Марка стали", value: isA500c || isA40035gs || isA40025g2s || variant.steelGrade === "—" ? undefined : variant.steelGrade},
    {label: "Длина прутка", value: length && variant.form === "bar" ? `${length} м` : undefined},
    {label: "Теоретическая масса", value: variant.weightPerMeterKg === undefined ? undefined : `${formatNumber(variant.weightPerMeterKg)} кг/м`},
    ...(isA500c ? [] : [
      {label: "Стандарт", value: isA40035gs || isA240 ? undefined : standard},
      ...variant.specifications.filter(({name}) =>
        (!isA240 && name === "Класс арматуры") || (!isA40025g2s && name === "Поверхность"))
        .map(({name, value}) => ({label: name, value})),
    ]),
  ];
  const cardName = isA500c ? variant.name.replace(/\s+ГОСТ\s+34028(?:-2016)?$/u, "") : variant.name;
  return <CatalogVariantLayout view={view} variant={variant} name={view === "card" ? cardName : diameter ?? "—"}
    tableSpecifications={[unverified ? <span key="form" className="text-xs text-slate-600 dark:text-slate-400">{form}</span> : form, length ?? "—"]}
    specifications={<CatalogVariantSpecifications items={fields}/>} details={!unverified && <CatalogPositionDetails productName={variant.name} fields={detailsFields}/>}
    price={price} order={order}/>;
}

function displayQuantity(value: number | null, mode: OrderInputMode) {
  return value === null ? "" : formatMeasuredQuantity(value, mode);
}

function formLabel(form: "coil" | "bar") {
  return form === "coil" ? "В бунтах" : "Пруток";
}

