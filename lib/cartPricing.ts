import {calculateLineTotal, calculateMeasuredLineTotal, getMeasurementQuantityOptions, metersToTons, tonsToMeters} from "./orderMeasurement";
import type {ProductVariant} from "@/types/product";
import type {CartMeasurement, CartPieceOrder} from "@/types/cart";
import {isWholePipeVariant} from "./pipeFamily";
import {wholePipeOrder} from "./wholePipeOrder";
import {hasConfirmedProfilePipePrice, isProfilePipeVariant, profilePipeOrder} from "./profilePipe";
import {isProfileSheetVariant} from "./profileSheet";
import {requiresWholeMetalMeshQuantity, requiresWholeRozmetQuantity} from "./variantPresentation";
import {isDemonstrationProduct, requiresOfferConfirmation} from "./catalogOffer";

type PriceInput = {quantity: number; measurement?: Pick<CartMeasurement, "inputMode" | "meters" | "weightTons">; pieceOrder?: CartPieceOrder};

export function revalidateCartPrice(product: ProductVariant, item: PriceInput) {
  if (isProfilePipeVariant(product)) {
    const pieces = item.pieceOrder?.pieces ?? (product.lengthMeters ? item.quantity / product.lengthMeters : NaN);
    const order = profilePipeOrder(product, pieces, item.pieceOrder?.lengthMeters);
    const invalidReason = !hasConfirmedProfilePipePrice(product)
      ? "Цена уточняется. Отправьте запрос на расчёт."
      : item.measurement || !order || order.pieces <= 0 || !Number.isFinite(item.quantity)
        || Math.abs(order.meters - item.quantity) > 1e-7
        ? "Выберите количество целых труб и конкретную длину в таблице товара."
        : order.estimatedTotal === null ? "Не удалось пересчитать стоимость." : undefined;
    return {
      measurement: undefined,
      pieceOrder: order && order.pieces > 0 ? {pieces: order.pieces, lengthMeters: order.lengthMeters} : undefined,
      invalidReason,
      estimatedTotal: invalidReason ? 0 : order?.estimatedTotal ?? 0,
    };
  }
  let invalidReason = requiresOfferConfirmation(product) || product.price === null || !Number.isFinite(product.price) || product.price < 0 || product.quoteOnly || product.priceQualifier === "from"
    ? "Цена требует уточнения. Отправьте запрос на расчёт." : undefined;
  let measurement: CartMeasurement | undefined;
  if (item.pieceOrder) invalidReason = "Количество целых труб не применимо к этой позиции.";
  if (requiresWholeRozmetQuantity(product) && (!Number.isInteger(item.quantity) || item.measurement)) {
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
  const legacyMeasuredTons = !item.measurement && product.unit === "ton" && !isDemonstrationProduct(product)
    && product.weightPerMeterKg !== undefined && Number.isFinite(product.weightPerMeterKg) && product.weightPerMeterKg > 0;
  let estimatedTotal = calculateLineTotal(item.quantity, product.price ?? 0);
  if (!Number.isFinite(item.quantity) || item.quantity <= 0 || (!item.measurement && item.quantity > 999)) {
    invalidReason = "Не удалось пересчитать количество.";
  }
  if (item.measurement) {
    const input = item.measurement;
    if (input.inputMode !== "meter" && input.inputMode !== "ton") {
      invalidReason = "Не удалось определить единицу измерения.";
    } else if (isDemonstrationProduct(product) || !product.pricePerTon || !product.weightPerMeterKg) {
      invalidReason = "Недостаточно данных для пересчёта массы и стоимости. Уточните позицию.";
    } else {
      const entered = input.inputMode === "meter" ? input.meters : input.weightTons;
      const {maximum} = getMeasurementQuantityOptions(product, input.inputMode);
      // Whole-pipe weight is itself converted and may carry floating-point noise.
      const tolerance = isWholePipeVariant(product) && input.inputMode === "ton" ? conversionTolerance(maximum) : 0;
      if (entered > maximum + tolerance) {
        invalidReason = "Объём превышает допустимое значение. Измените количество.";
      }
      const meters = input.inputMode === "meter" ? input.meters : tonsToMeters(input.weightTons, product.weightPerMeterKg);
      const weightTons = input.inputMode === "ton" ? input.weightTons : metersToTons(input.meters, product.weightPerMeterKg);
      if (meters === null || weightTons === null || meters <= 0 || weightTons <= 0) invalidReason = "Не удалось пересчитать количество.";
      else {
        estimatedTotal = input.inputMode === "meter"
          ? calculateMeasuredLineTotal(meters, product.weightPerMeterKg, product.pricePerTon)
          : calculateLineTotal(weightTons, product.pricePerTon);
        if (estimatedTotal !== null) measurement = {inputMode: input.inputMode, meters, weightTons, pricePerTon: product.pricePerTon, estimatedTotal};
      }
    }
  }
  if (estimatedTotal === null) invalidReason = "Не удалось пересчитать стоимость.";
  if (isWholePipeVariant(product)) {
    const whole = measurement && wholePipeOrder(product, measurement.meters, "meter");
    if (!measurement || !whole || Math.abs(whole.meters - measurement.meters) > 1e-7) {
      invalidReason = "Выберите объём целыми трубами в таблице товара.";
    } else {
      // Recompute from the whole length to avoid drift after a tonne/metre round trip.
      estimatedTotal = calculateMeasuredLineTotal(whole.meters, product.weightPerMeterKg!, product.pricePerTon ?? 0);
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
  return {measurement, pieceOrder: undefined, invalidReason, estimatedTotal};
}

function conversionTolerance(maximum: number) {
  return Math.max(1, maximum) * Number.EPSILON * 32;
}
