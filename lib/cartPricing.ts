import {calculateLineTotal, metersToTons, tonsToMeters} from "./orderMeasurement";
import type {ProductVariant} from "@/types/product";
import type {CartItem} from "@/types/cart";

export function revalidateCartPrice(product: ProductVariant, item: CartItem) {
  let invalidReason = product.price === null || product.quoteOnly || product.priceQualifier === "from"
    ? "Цена требует уточнения. Отправьте запрос на расчёт." : undefined;
  let measurement = item.measurement;
  let estimatedTotal = calculateLineTotal(item.quantity, product.price ?? 0) ?? 0;
  if (measurement) {
    if (!product.pricePerTon || !product.weightPerMeterKg) {
      invalidReason = "Недостаточно данных для пересчёта массы и стоимости. Уточните позицию.";
    } else {
      const meters = measurement.inputMode === "meter" ? measurement.meters : tonsToMeters(measurement.weightTons, product.weightPerMeterKg);
      const weightTons = measurement.inputMode === "ton" ? measurement.weightTons : metersToTons(measurement.meters, product.weightPerMeterKg);
      if (meters === null || weightTons === null || meters <= 0 || weightTons <= 0) invalidReason = "Не удалось пересчитать количество.";
      else {
        estimatedTotal = calculateLineTotal(weightTons, product.pricePerTon) ?? 0;
        measurement = {...measurement, meters, weightTons, pricePerTon: product.pricePerTon, estimatedTotal};
      }
    }
  }
  if (invalidReason) estimatedTotal = 0;
  return {measurement, invalidReason, estimatedTotal};
}
