import type {ContactRequest, QuoteRequest} from "@/types/forms";
import type {Order} from "@/types/order";

export interface NotificationService {
  sendContactRequest(request: ContactRequest): Promise<void>;

  sendQuoteRequest(request: QuoteRequest): Promise<void>;

  sendOrderNotification(order: Order): Promise<void>;
}

// Delivery has not been configured. Never report a discarded request as delivered,
// including during local development. Browser tests mock responses explicitly.
export const notificationService: NotificationService = {
  async sendContactRequest() {throw new Error("NOTIFICATION_PROVIDER_NOT_CONFIGURED");},
  async sendQuoteRequest() {throw new Error("NOTIFICATION_PROVIDER_NOT_CONFIGURED");},
  async sendOrderNotification() {throw new Error("NOTIFICATION_PROVIDER_NOT_CONFIGURED");},
};
