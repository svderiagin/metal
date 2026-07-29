import type {Order, PaymentStatus} from "@/types/order";

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
