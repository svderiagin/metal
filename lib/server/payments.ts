import type {Order, OrderItem, PaymentStatus} from "@/types/order";
import {calculateLineTotal, calculateMeasuredLineTotal, calculatePieceLineTotal} from "@/lib/orderMeasurement";

export function hasValidOrderAmount(order: Order): boolean {
  if (!order.items.length || !Number.isFinite(order.totalAmount) || order.totalAmount <= 0) return false;
  const subtotals = order.items.map(item => calculateStoredSubtotal(item, order.pricingVersion));
  return subtotals.every((subtotal, index) => subtotal !== null && subtotal === order.items[index].subtotal)
    && subtotals.reduce<number>((sum, subtotal) => sum + Math.round((subtotal ?? 0) * 100), 0) / 100 === order.totalAmount;
}

function calculateStoredSubtotal(item: OrderItem, version: Order["pricingVersion"]) {
  const {measurement, pieceOrder, unitPrice, weightPerMeterKg} = item;
  const quantity = measurement?.weightTons ?? item.quantity;
  if (version === undefined) {
    // Keep the recorded amount payable for orders issued before decimal rounding.
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return null;
    const subtotal = Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
    return Number.isFinite(subtotal) && (quantity === 0 || subtotal > 0) ? subtotal : null;
  }
  if (measurement && (measurement.inputMode === "meter" || weightPerMeterKg !== undefined)) {
    return weightPerMeterKg === undefined ? null : calculateMeasuredLineTotal(measurement.meters, weightPerMeterKg, unitPrice);
  }
  if (pieceOrder) return calculatePieceLineTotal(pieceOrder.pieces, pieceOrder.lengthMeters, unitPrice);
  return calculateLineTotal(quantity, unitPrice);
}

export interface VerifiedPaymentEvent {
  eventId: string;
  orderReference: string;
  status: PaymentStatus;
}

export interface PaymentProvider {
  createPayment(order: Order): Promise<{ paymentId: string; redirectUrl: string }>;

  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>;
}

class UnconfiguredPaymentProvider implements PaymentProvider {
  async createPayment(order: Order): Promise<{ paymentId: string; redirectUrl: string }> {
    void order;
    throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  }

  async verifyWebhook(request: Request): Promise<VerifiedPaymentEvent> {
    void request;
    throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  }
}

// Replace this adapter only after selecting a provider and following its official
// hosted-checkout and webhook-signature documentation.
export const paymentProvider: PaymentProvider = new UnconfiguredPaymentProvider();
