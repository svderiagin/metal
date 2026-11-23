"use client";

import {useEffect, useState, type ReactNode} from "react";
import {beamProfile, beamKind, beamReferenceMassKg, beamStandardLabel} from "@/lib/beam";
import {vgpSize} from "@/lib/vgp";
import {QuoteRequestButton} from "./QuoteRequestButton";
import {formatQuoteProductName} from "@/lib/quoteRequest";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantSpecifications, renderVariantPhoto} from "./CatalogVariantLayout";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
import {ProfilePipeVariantItem} from "./ProfilePipeVariantItem";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {calculateLineTotal, calculateMeasuredLineTotal, getMeasurementQuantityOptions, metersToTons, requiresWholeLengthOrder, tonsToMeters, wholeLengthOrder} from "@/lib/orderMeasurement";
import {constrainOrderQuantityInput, correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {formatMeasuredQuantity, formatQuantityForInput, quantityTransferHandlers} from "@/lib/cartQuantityInput";
import type {OrderInputMode} from "@/types/cart";
import type {ProductVariant} from "@/types/product";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {useOrderDraft} from "./OrderDraftProvider";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogGuideFigure} from "./CatalogGuideFigure";
import {PipePositionDetails} from "./PipePositionDetails";

type OrderFeedback = {kind: "correction" | "error"; text: string};
const enterQuantityMessage = "Укажите длину или вес больше нуля.";

export function MeasuredVariantItem({
  variant, view, kind, name, showRebarSteelGrade = true,
}: {variant: ProductVariant; view: "table" | "card"; kind: "rebar" | "beam" | "vgp" | "pipe" | "profile"; name?: string; showRebarSteelGrade?: boolean}) {
  return kind === "profile" ? <ProfilePipeVariantItem variant={variant} view={view}/>
    : <TonnageMeasuredVariantItem variant={variant} view={view} kind={kind} name={name} showRebarSteelGrade={showRebarSteelGrade}/>;
}

function TonnageMeasuredVariantItem({
  variant,
  view,
  kind,
  name,
  showRebarSteelGrade,
}: {
  variant: ProductVariant;
  name?: string;
  showRebarSteelGrade: boolean;
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
  const needsQuote = pricePerTon === undefined || variant.quoteOnly || variant.priceQualifier === "from"
    || (wholeLengths && !roundToWholeLengths) || (!hasMass && enteredMeters !== null && enteredMeters > 0);
  const canPurchase = !needsQuote && (variant.inStock || (variant.imported && variant.availability === "UNKNOWN"));
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
  const displayedTons = isVgp && !editingTons && !invalidDraft && parsedTons !== null
    ? formatQuantityForInput(parsedTons, false, 3) : tons;
  const buttonLabel = removed ? "Удалено" : !canPurchase ? "Под заказ" : shouldRemove ? "Удалить" : isSaved
    ? <><Icon name="check"/><span className="whitespace-nowrap">В корзине</span></> : hasChanges ? "Обновить" : "В корзину";
  const buttonClassName = removed ? filterStyles.removedCartButton
    : shouldRemove ? filterStyles.removeCartButton
      : isSaved ? filterStyles.savedCartButton
        : hasChanges && canPurchase ? filterStyles.updateCartButton
          : filterStyles.cartButton;
  const unsavedMessage = "Не сохранено";
  let feedbackText = message?.text;
  if (!feedbackText) {
    if (invalidDraft) feedbackText = "Проверьте введённое значение.";
    else if (hasChanges && !shouldRemove) feedbackText = activeValue.trim() ? unsavedMessage : enterQuantityMessage;
  }
  const pieceCount = !invalidDraft && wholeOrder && wholeOrder.pieces > 0 ? `${wholeOrder.pieces} шт.` : "";
  const status = <>
    {pieceCount && <span className="block">{pieceCount}</span>}
    {feedbackText && <span className={feedbackText === unsavedMessage ? "block whitespace-nowrap" : "block"}>{feedbackText}</span>}
  </>;

  function showError(text: string) {
    setMessage({kind: "error", text});
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
    return corrected.capped || corrected.message ? null : parseOrderQuantity(value);
  }

  function updateQuantityField(mode: OrderInputMode, value: string) {
    const isVgpTonInput = isVgp && mode === "ton";
    if (isVgpTonInput) {
      if (/[.,]\d{4}/u.test(value)) return;
      setEditingTons(true);
    }
    const options = quantityOptions(mode);
    const constrained = constrainOrderQuantityInput(value, options.maximum, bound =>
      isVgpTonInput ? formatQuantityForInput(bound, false, 3) : formatMeasuredQuantity(bound, mode));
    value = constrained.value;
    const entered = parseOrderQuantity(value);
    const previousValue = mode === "meter" ? meters : displayedTons;
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
    setMessage(null);
  }

  const actionSizeClassName = view === "card" ? "w-full" : tableStyles.tableAction;
  const action = !canPurchase && !shouldRemove && !removed ? (
    <QuoteRequestButton label={unconfirmedRebarLength ? "Запросить расчёт" : needsQuote ? "Запросить цену" : "Под заказ"}
      order={{product: formatQuoteProductName(variant), meters: invalidDraft ? null : parsedMeters, tons: invalidDraft ? null : parsedTons,
        ...(isRebar && wholeOrder && !invalidDraft ? {quantity: wholeOrder.pieces, unit: "шт."} : {})}}
      className={`${filterStyles.quoteButton} ${actionSizeClassName} px-3`}/>
  ) : (
    <Button type="button" disabled={!hydrated || isSaved || removed || !usableDraft || (!canPurchase && !shouldRemove)} onClick={addToCart}
      className={`${buttonClassName} ${actionSizeClassName} whitespace-nowrap px-3`}>
      {shouldRemove ? "Удалить" : buttonLabel}
    </Button>
  );

  const showOrderLabels = view === "card";
  const isVgpTable = isVgp && view === "table";
  const statusId = `measured-order-status-${view}-${variant.id}`;
  const meterInput = <OrderInput label={`Длина заказа для ${variant.name}`}
    placeholder={missingMass && parsedTons !== null && parsedTons > 0 ? "—" : "0"}
    className={isVgpTable ? tableStyles.vgpMeterInput : undefined}
    visibleLabel={showOrderLabels ? "Заказ, м" : undefined} value={meters || displayQuantity(referenceMeters, "meter")} invalid={invalidDraft && inputMode === "meter"} statusId={statusId}
    onChange={value => updateQuantityField("meter", value)} onBlur={() => settleQuantity("meter")} onRejectedTransfer={showError}/>;
  const tonInput = <OrderInput label={`Вес заказа в тоннах для ${variant.name}`}
    placeholder={needsMassForLength ? "—" : "0"}
    className={isVgpTable ? tableStyles.vgpTonInput : undefined}
    visibleLabel={showOrderLabels ? "Заказ, т" : undefined} value={displayedTons || displayQuantity(referenceTons, "ton")}
    invalid={invalidDraft && inputMode === "ton"} statusId={statusId} onChange={value => updateQuantityField("ton", value)}
    onBlur={() => {setEditingTons(false); settleQuantity("ton");}} onRejectedTransfer={showError}/>;
  const price = `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`;
  const total = <output data-price={estimatedTotal !== null && !needsMassForLength || undefined} aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>;
  const statusColor = invalidDraft || message?.kind === "error" ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400";
  const statusSpacing = view === "table" ? "mx-auto mt-1 max-w-32" : "mt-1";
  const orderStatus = <span id={statusId} role="status" className={`block text-xs ${statusSpacing} ${statusColor}`}>{status}</span>;
  const order = <CatalogVariantOrder view={view} quantity={meterInput} secondaryQuantity={tonInput}
    action={action} total={total} status={orderStatus}/>;

  if (isRebar) return <RebarVariantLayout view={view} variant={variant} price={price} order={order} showSteelGrade={showRebarSteelGrade}/>;

  const unverified = isDemonstrationProduct(variant);
  if (isPipe) {
    const outsideDiameter = variant.diameterMm === undefined ? "—" : formatNumber(variant.diameterMm);
    const pipeSize = isVgp ? vgpSize(variant) : `${outsideDiameter} × ${formatNumber(variant.wallThicknessMm ?? 0)}`;
    const grade = variant.steelGrade && variant.steelGrade !== "—" ? `, сталь ${variant.steelGrade}` : "";
    const pipeDesignation = view === "card" ? `Труба Ø${pipeSize} мм${grade}` : pipeSize + grade;
    const pipeLength = variant.lengthRangeMeters?.map(formatNumber).join("–")
      ?? (variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters));
    const tolerance = variant.supplierLengthToleranceMm === undefined ? undefined
      : `±${formatNumber(variant.supplierLengthToleranceMm)} мм`;
    const length = pipeLength ? <>
      <span className="whitespace-nowrap">{pipeLength} м</span>
      {tolerance && <> <span className="whitespace-nowrap">({tolerance})</span></>}
    </> : undefined;

    return <CatalogVariantLayout view={view} variant={variant} name={isVgp ? (view === "table" ? pipeSize : name) : pipeDesignation}
      tableSpecifications={{headingClassName: isVgp ? tableStyles.sizeColumn : undefined, cells: <>
        {isVgp && <td>{outsideDiameter}</td>}
        <td className="tabular-nums">{pipeLength ?? "—"}{tolerance && <small className="block whitespace-nowrap text-xs font-normal text-slate-600 dark:text-slate-400">{tolerance}</small>}</td>
      </>}}
      specifications={<CatalogVariantSpecifications items={[
        ...(isVgp ? [{label: "Ду × стенка, мм", value: pipeSize}, {label: "Наружный Ø, мм", value: outsideDiameter}] : []),
        {label: "Длина по каталогу", value: length ?? "—"},
      ]}/>}
      detailsId={`pipe-details-${variant.id}`}
      details={<PipePositionDetails variant={variant} isVgp={isVgp} length={length} mass={hasMass ? mass : undefined}/>}
      price={price} order={order}/>;
  }

  const profile = unverified ? "Уточняется" : beamProfile(variant);
  const steelGrade = unverified ? undefined : variant.steelGrade;
  const length = unverified || variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters);
  const massField = referenceMass !== undefined
    ? {label: "Справочная масса по ГОСТ 35087-2024", value: `${formatNumber(referenceMass)} кг/м`}
    : {label: "Теоретическая масса", value: hasMass ? `${formatNumber(mass)} кг/м` : undefined};
  const fields = [
    {label: "Профиль", value: profile},
    {label: "Тип балки", value: beamKind(variant)},
    {label: "Марка стали", value: steelGrade},
    {label: "Длина", value: length && `${length} м`},
    {label: "Стандарт", value: !unverified ? beamStandardLabel(variant) : undefined},
    massField,
  ];
  const designation = name ?? profile;
  return <CatalogVariantLayout view={view} variant={variant}
    name={view === "card" && !designation.startsWith("Балка ") ? `Балка ${designation}` : designation}
    tableSpecifications={{cells: <td className="tabular-nums">{length ?? "—"}</td>}}
    specifications={<CatalogVariantSpecifications items={[{label: "Длина", value: length && `${length} м`}]}/>}
    details={<CatalogPositionDetails title="Характеристики балки" fields={fields}
      figures={profile !== "Уточняется" && profile !== "—" ? <CatalogGuideFigure diagram={{
        shape: "beam", dimensions: [["Профиль", profile], ...(length ? [["Длина", `${length} м`] as const] : [])],
      }}/> : undefined}
      supply={unverified ? <p>{variant.description}</p> : <>
        {referenceMass !== undefined && <p>Масса по сортаменту даёт ориентир для расчёта. Применимость к выбранной позиции подтверждает поставщик.</p>}
        {variant.sourceProductName && <p>Обозначение поставщика — {variant.sourceProductName}</p>}
      </>}/>}
    price={price} order={order}/>;
}

function RebarVariantLayout({view, variant, price, order, showSteelGrade}: {
  view: "table" | "card";
  variant: ProductVariant;
  price: string;
  order: ReactNode;
  showSteelGrade: boolean;
}) {
  const unverified = isDemonstrationProduct(variant);
  const diameter = unverified ? variant.name.match(/(\d+(?:[.,]\d+)?)\s*мм$/iu)?.[1]?.replace(".", ",")
    : variant.diameterMm === undefined ? undefined : formatNumber(variant.diameterMm);
  const form = unverified || variant.form === undefined ? "Уточняется" : formLabel(variant.form);
  const steelGrade = unverified ? "Уточняется" : variant.steelGrade ?? "—";
  const length = unverified || variant.lengthMeters === undefined ? undefined : formatNumber(variant.lengthMeters);
  const photo = renderVariantPhoto(variant, view);
  const pendingCell = unverified ? "[--cell-padding-x:0.25rem] text-xs text-slate-600 dark:text-slate-400" : undefined;

  if (view === "table") return <tr id={`variant-${variant.id}`} title={variant.name} className="align-middle tabular-nums">
    <th scope="row" className={`${tableStyles.sizeColumn} font-semibold`}>{diameter ?? "—"}</th>
    <td>{photo ? <div className={tableStyles.rowImage}>{photo}</div> : "—"}</td>
    <td className={pendingCell}>{form}</td>
    {showSteelGrade && <td className={pendingCell}>{steelGrade}</td>}
    <td>{length ?? "—"}</td>
    <td className="font-semibold">{price}</td>
    {order}
  </tr>;

  const fields = [
    ["Диаметр", diameter ? `${diameter} мм` : "—"],
    ["Форма", form],
    ...(showSteelGrade ? [["Марка стали", steelGrade]] : []),
    ["Длина", length ? `${length} м` : "—"],
    ["Цена", price],
  ];
  return <article id={`variant-mobile-${variant.id}`} className={`${tableStyles.card} min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
    <div className={photo ? "grid items-center gap-3 @min-[17rem]:grid-cols-[minmax(0,1fr)_8rem]" : undefined}>
      <h3 className="text-card-title">{variant.name}</h3>
      {photo && <div className="w-32 max-w-full">{photo}</div>}
    </div>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      {fields.map(([label, value]) => <div key={label} className="last:odd:col-span-2">
        <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
        <dd className="mt-1 font-medium tabular-nums">{value}</dd>
      </div>)}
    </dl>
    {order}
  </article>;
}

function OrderInput({
  label,
  placeholder,
  className = "",
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
  className?: string;
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
    className={`${filterStyles.field} ${tableStyles.measurementInput} w-full min-w-0 ${alignment} tabular-nums focus:placeholder:text-transparent ${className}`} placeholder={placeholder}/>;
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

