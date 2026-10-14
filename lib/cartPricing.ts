import {calculateLineTotal, metersToTons, tonsToMeters} from "./orderMeasurement";
import type {ProductVariant} from "@/types/product";
import type {CartMeasurement} from "@/types/cart";

type PriceInput = {quantity: number; measurement?: Pick<CartMeasurement, "inputMode" | "meters" | "weightTons">};

export function revalidateCartPrice(product: ProductVariant, item: PriceInput) {
  let invalidReason = product.price === null || product.quoteOnly || product.priceQualifier === "from"
    ? "Цена требует уточнения. Отправьте запрос на расчёт." : undefined;
  let measurement: CartMeasurement | undefined;
  let estimatedTotal = calculateLineTotal(item.quantity, product.price ?? 0);
  if (!Number.isFinite(item.quantity) || item.quantity <= 0 || (!item.measurement && item.quantity > 999)) {
    invalidReason = "Не удалось пересчитать количество.";
  }
  if (item.measurement) {
    const input = item.measurement;
    if (!product.pricePerTon || !product.weightPerMeterKg) {
      invalidReason = "Недостаточно данных для пересчёта массы и стоимости. Уточните позицию.";
    } else {
      const meters = input.inputMode === "meter" ? input.meters : tonsToMeters(input.weightTons, product.weightPerMeterKg);
      const weightTons = input.inputMode === "ton" ? input.weightTons : metersToTons(input.meters, product.weightPerMeterKg);
      if (meters === null || weightTons === null || meters <= 0 || weightTons <= 0) invalidReason = "Не удалось пересчитать количество.";
      else {
        estimatedTotal = calculateLineTotal(weightTons, product.pricePerTon);
        if (estimatedTotal !== null) measurement = {inputMode: input.inputMode, meters, weightTons, pricePerTon: product.pricePerTon, estimatedTotal};
      }
    }
  }
  if (estimatedTotal === null) invalidReason = "Не удалось пересчитать стоимость.";
  if (invalidReason || estimatedTotal === null) estimatedTotal = 0;
  return {measurement, invalidReason, estimatedTotal};
}
