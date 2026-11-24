import {calculateLineTotal, calculateMeasuredLineTotal, getMeasurementQuantityOptions, metersToTons, requiresWholeLengthOrder, sameMeasuredQuantity, tonsToMeters, wholeLengthOrder} from "./orderMeasurement";
import type {ProductVariant} from "@/types/product";
import type {CartMeasurement, CartPieceOrder} from "@/types/cart";
import {hasConfirmedProfilePipePrice, isProfilePipeVariant, isSquareProfilePipe, profilePipeMaximumPieces, profilePipeOrder} from "./profilePipe";
import {isProfileSheetVariant} from "./profileSheet";
import {requiresWholeMetalMeshQuantity, requiresWholeCatalogQuantity} from "./variantPresentation";
import {isDemonstrationProduct, requiresCatalogPriceQuote} from "./catalogOffer";
import {hasLegacyChannelMeterQuantity} from "./channel";

type PriceInput = {quantity: number; measurement?: Pick<CartMeasurement, "inputMode" | "meters" | "weightTons">; pieceOrder?: CartPieceOrder};

export function revalidateCartPrice(product: ProductVariant, item: PriceInput) {
  if (isProfilePipeVariant(product)) {
    const priceRequiresQuote = !hasConfirmedProfilePipePrice(product);
    const pieces = item.pieceOrder?.pieces ?? (product.lengthMeters ? item.quantity / product.lengthMeters : NaN);
    const order = profilePipeOrder(product, pieces, item.pieceOrder?.lengthMeters);
    const maximum = !order && isSquareProfilePipe(product) ? profilePipeMaximumPieces(product, item.pieceOrder?.lengthMeters) : null;
    const invalidReason = maximum !== null && pieces > maximum ? "Объём превышает допустимое значение. Измените количество."
      : item.measurement || !order || order.pieces <= 0 || !Number.isFinite(item.quantity)
      || Math.abs(order.meters - item.quantity) > 1e-7
      ? "Выберите количество целых труб и конкретную длину в таблице товара."
      : !priceRequiresQuote && order.estimatedTotal === null ? "Не удалось пересчитать стоимость." : undefined;
    return {
      measurement: undefined,
      pieceOrder: order && order.pieces > 0 ? {pieces: order.pieces, lengthMeters: order.lengthMeters} : undefined,
      invalidReason,
      priceRequiresQuote,
      estimatedTotal: invalidReason ? 0 : order?.estimatedTotal ?? 0,
    };
  }
  const priceRequiresQuote = requiresCatalogPriceQuote(product);
  let invalidReason: string | undefined;
  let measurement: CartMeasurement | undefined;
  if (item.pieceOrder) invalidReason = "Количество целых труб не применимо к этой позиции.";
  if (requiresWholeCatalogQuantity(product) && (!Number.isInteger(item.quantity) || item.measurement)) {
    invalidReason = "Укажите целое количество штук.";
  }
  if (isProfileSheetVariant(product) && (!Number.isInteger(item.quantity) || item.measurement)) {
    invalidReason = "Укажите целое количество листов.";
  }
  if (requiresWholeMetalMeshQuantity(product) && (!Number.isInteger(item.quantity) || item.measurement)) {
    invalidReason = product.priceUnit.toLocaleLowerCase("ru").includes("рулон")
      ? "Укажите целое количество рулонов."
      : "Укажите целое количество штук.";
  }
  const legacyChannelMeters = !item.measurement && !item.pieceOrder && hasLegacyChannelMeterQuantity(product);
  const legacyMeasuredTons = !item.measurement && !legacyChannelMeters && product.unit === "ton" && !isDemonstrationProduct(product)
    && product.weightPerMeterKg !== undefined && Number.isFinite(product.weightPerMeterKg) && product.weightPerMeterKg > 0;
  const wholeLength = requiresWholeLengthOrder(product);
  let estimatedTotal = priceRequiresQuote ? 0 : calculateLineTotal(item.quantity, product.price!);
  if (!Number.isFinite(item.quantity) || item.quantity <= 0 || (!item.measurement && item.quantity > 999)) {
    invalidReason = "Не удалось пересчитать количество.";
  }
  // Older rebar clients sent only tonnes. Validate that original quantity
  // against the stock length just as we do for an explicitly measured line.
  const legacyBar = legacyMeasuredTons && wholeLength && product.categoryId === "cat-arm";
  if (item.measurement || legacyBar || legacyChannelMeters) {
    const inputMode = item.measurement?.inputMode ?? (legacyChannelMeters ? "meter" : "ton");
    if (inputMode !== "meter" && inputMode !== "ton") {
      invalidReason = "Не удалось определить единицу измерения.";
    } else if (isDemonstrationProduct(product) || !product.weightPerMeterKg
      || (!priceRequiresQuote && !product.pricePerTon)) {
      invalidReason = "Недостаточно данных для пересчёта массы и стоимости. Уточните позицию.";
    } else {
      const entered = item.measurement
        ? inputMode === "meter" ? item.measurement.meters : item.measurement.weightTons
        : item.quantity;
      const {maximum} = getMeasurementQuantityOptions(product, inputMode);
      // Converted weight may carry floating-point noise at the last whole stock length.
      const tolerance = wholeLength && inputMode === "ton" ? conversionTolerance(maximum) : 0;
      if (entered > maximum + tolerance) {
        invalidReason = "Объём превышает допустимое значение. Измените количество.";
      }
      const meters = inputMode === "meter" ? entered : tonsToMeters(entered, product.weightPerMeterKg);
      const weightTons = inputMode === "ton" ? entered : metersToTons(entered, product.weightPerMeterKg);
      if (meters === null || weightTons === null || meters <= 0 || weightTons <= 0) invalidReason = "Не удалось пересчитать количество.";
      else {
        const pricePerTon = priceRequiresQuote ? 0 : product.pricePerTon!;
        estimatedTotal = priceRequiresQuote ? 0 : inputMode === "meter"
          ? calculateMeasuredLineTotal(meters, product.weightPerMeterKg, pricePerTon)
          : calculateLineTotal(weightTons, pricePerTon);
        if (estimatedTotal !== null) measurement = {inputMode, meters, weightTons, pricePerTon, estimatedTotal};
      }
    }
  }
  if (estimatedTotal === null) invalidReason = "Не удалось пересчитать стоимость.";
  if (wholeLength) {
    const whole = measurement && wholeLengthOrder(product, measurement.meters, "meter");
    if (!measurement || !whole || !sameMeasuredQuantity(measurement.meters, whole.meters)) {
      invalidReason ??= product.categoryId === "cat-arm"
        ? "Измените объём заказа до целого числа прутков."
        : "Выберите объём целыми трубами в таблице товара.";
    } else {
      // Recompute from the whole length to avoid drift after a tonne/metre round trip.
      estimatedTotal = priceRequiresQuote ? 0
        : calculateMeasuredLineTotal(whole.meters, product.weightPerMeterKg!, measurement.pricePerTon);
      if (estimatedTotal === null) invalidReason = "Не удалось пересчитать стоимость.";
      else measurement = {...measurement, meters: whole.meters, weightTons: whole.weightTons, estimatedTotal};
    }
  }
  const physicalMeters = measurement?.meters ?? (legacyMeasuredTons ? tonsToMeters(item.quantity, product.weightPerMeterKg!) : null);
  const maximumMeters = getMeasurementQuantityOptions(product, "meter").maximum;
  if (legacyMeasuredTons && physicalMeters === null) invalidReason = "Не удалось пересчитать количество.";
  if (physicalMeters !== null && physicalMeters > maximumMeters + conversionTolerance(maximumMeters)) {
    invalidReason = "Объём превышает допустимое значение. Измените количество.";
  }
  if (invalidReason || estimatedTotal === null) estimatedTotal = 0;
  return {measurement, pieceOrder: undefined, invalidReason, priceRequiresQuote, estimatedTotal};
}

function conversionTolerance(maximum: number) {
  return Math.max(1, maximum) * Number.EPSILON * 32;
}
