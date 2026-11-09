import type {ContactRequest, QuoteRequest} from "@/types/forms";
import type {Order} from "@/types/order";
import {readSmtpConfig, smtpMailer} from "./smtp";
import {formatCurrency} from "@/lib/currency";

export interface NotificationService {
  sendContactRequest(request: ContactRequest): Promise<void>;

  sendQuoteRequest(request: QuoteRequest): Promise<void>;

  sendOrderNotification(order: Order): Promise<void>;
}

export const notificationService: NotificationService = {
  async sendContactRequest(request) {
    await smtpMailer.send({to: readSmtpConfig().recipient, replyTo: request.email, subject: "Обращение с сайта RWB-METAL",
      text: `${request.name}\n${request.email}\n${request.phone ?? ""}\n\n${request.message}`});
  },
  async sendQuoteRequest(request) {
    await smtpMailer.send({to: readSmtpConfig().recipient, replyTo: request.email, subject: "Запрос расчёта RWB-METAL",
      text: `${request.name}\n${request.email}\n${request.phone}\n${request.company ?? ""}\n\n${request.message}`});
  },
  async sendOrderNotification(order) {
    const config = readSmtpConfig();
    await smtpMailer.send({to: order.customer.email, bcc: config.recipient,
      subject: order.invoice ? `${order.invoice.isPreview ? "Образец счёта" : "Счёт на оплату"} ${order.invoice.number} — RWB-METAL` : `Заказ ${order.reference} — RWB-METAL`,
      text: `${order.customer.fullName}, ваш заказ ${order.reference} создан.\nСумма: ${formatCurrency(order.totalAmount)}.\nДоставка бесплатная.\n\n${order.invoice?.isPreview ? "К письму приложен образец счёта PDF. Реквизиты и ставка НДС пока не подтверждены. Образец не предназначен для оплаты." : order.invoice ? "Счёт на оплату приложен к письму в формате PDF. Для оплаты используйте реквизиты и назначение платежа из счёта." : "Информация об оплате будет предоставлена отдельно."}\n\nПо вопросам заказа ответьте на это письмо.`,
      replyTo: config.recipient,
      ...(order.invoice ? {attachments: [{filename: order.invoice.fileName,
        content: Buffer.from(order.invoice.pdfBase64, "base64"), contentType: "application/pdf"}]} : {}),
    });
  },
};
