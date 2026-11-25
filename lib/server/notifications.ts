import type {ContactRequest, QuoteRequest} from "@/types/forms";
import type {Order} from "@/types/order";
import {readSmtpConfig, smtpMailer} from "./smtp";
import {companyDetails} from "@/lib/companyDetails";
import {buildOrderEmail} from "./orderEmail";

export interface NotificationService {
  sendContactRequest(request: ContactRequest): Promise<void>;

  sendQuoteRequest(request: QuoteRequest): Promise<void>;

  sendOrderNotification(order: Order): Promise<void>;
}

export const notificationService: NotificationService = {
  async sendContactRequest(request) {
    await smtpMailer.send({to: readSmtpConfig().recipient, replyTo: request.email, subject: `Обращение с сайта ${companyDetails.brandName}`,
      text: `${request.name}\n${request.email}\n${request.phone ?? ""}\n\n${request.message}`});
  },
  async sendQuoteRequest(request) {
    await smtpMailer.send({to: readSmtpConfig().recipient, replyTo: request.email, subject: `Запрос расчёта ${companyDetails.brandName}`,
      text: `${request.name}\n${request.email}\n${request.phone}\n${request.company ?? ""}\n\n${request.message}`});
  },
  async sendOrderNotification(order) {
    const config = readSmtpConfig();
    await smtpMailer.send({to: order.customer.email, bcc: config.recipient,
      ...buildOrderEmail(order),
      replyTo: companyDetails.salesEmail,
      ...(order.invoice ? {attachments: [{filename: order.invoice.fileName,
        content: Buffer.from(order.invoice.pdfBase64, "base64"), contentType: "application/pdf"}]} : {}),
    });
  },
};
