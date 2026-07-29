import type { ContactRequest, QuoteRequest } from "@/types/forms";
import type { Order } from "@/types/order";

export interface NotificationService {
  sendContactRequest(request: ContactRequest): Promise<void>;
  sendQuoteRequest(request: QuoteRequest): Promise<void>;
  sendOrderNotification(order: Order): Promise<void>;
}

class DevelopmentNotificationService implements NotificationService {
  async sendContactRequest(request: ContactRequest) { void request; }
  async sendQuoteRequest(request: QuoteRequest) { void request; }
  async sendOrderNotification(order: Order) { void order; }
}

class UnconfiguredNotificationService implements NotificationService {
  private unavailable(): never { throw new Error("NOTIFICATION_PROVIDER_NOT_CONFIGURED"); }
  async sendContactRequest(request: ContactRequest) { void request; this.unavailable(); }
  async sendQuoteRequest(request: QuoteRequest) { void request; this.unavailable(); }
  async sendOrderNotification(order: Order) { void order; this.unavailable(); }
}

export const notificationService: NotificationService =
  process.env.NODE_ENV === "production"
    ? new UnconfiguredNotificationService()
    : new DevelopmentNotificationService();
