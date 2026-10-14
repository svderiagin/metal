import type {Order, PaymentStatus} from "@/types/order";
import {calculateLineTotal} from "@/lib/orderMeasurement";

export function hasValidOrderAmount(order: Order): boolean {
  const subtotals = order.items.map(item => calculateLineTotal(item.measurement?.weightTons ?? item.quantity, item.unitPrice));
  return subtotals.every((subtotal, index) => subtotal !== null && subtotal === order.items[index].subtotal)
    && subtotals.reduce<number>((sum, subtotal) => sum + Math.round((subtotal ?? 0) * 100), 0) / 100 === order.totalAmount;
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
