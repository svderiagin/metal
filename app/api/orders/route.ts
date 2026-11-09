import {readJsonBody} from "@/lib/server/request";
import {notificationService} from "@/lib/server/notifications";
import {createTrustedOrder, orderRepository} from "@/lib/server/orders";
import {parseCreateOrderInput} from "@/lib/server/validation";
import {invoiceService} from "@/lib/server/invoices";
import type {InvoiceEmailStatus} from "@/types/invoice";

export const runtime = "nodejs";

const error = (message: string, status: number) =>
  Response.json({ok: false, error: message}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const input = parseCreateOrderInput(body);
  if (!input) return error("Проверьте данные заказа.", 400);
  const order = createTrustedOrder(input);
  if (!order) return error("Один или несколько товаров недоступны.", 400);
  let downloadToken: string | undefined;
  try {
    if (order.paymentMethod === "INVOICE") {
      const created = await invoiceService.create(order);
      order.invoice = created.invoice;
      downloadToken = created.downloadToken;
    }
    await orderRepository.save(order);
  } catch {
    return error("Оформление временно недоступно. Свяжитесь с нами для расчёта поставки.", 503);
  }
  let emailStatus: InvoiceEmailStatus = "SENT";
  try {await notificationService.sendOrderNotification(order);} catch {
    emailStatus = "FAILED";
    console.error("ORDER_EMAIL_FAILED", order.reference);
  }
  if (order.invoice) {
    try {await orderRepository.updateInvoiceEmailStatus(order.reference, emailStatus);} catch {
      // The order and PDF are already durable. Do not encourage a duplicate submission.
      console.error("ORDER_EMAIL_STATUS_SAVE_FAILED", order.reference);
    }
  }
  return Response.json({
    ok: true,
    order: {reference: order.reference, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod,
      ...(order.invoice && downloadToken ? {invoice: {number: order.invoice.number, downloadToken, emailStatus, isPreview: order.invoice.isPreview}} : {})},
  }, {status: 201, headers: {"Cache-Control": "no-store"}});
}
