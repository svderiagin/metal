import {createHash} from "node:crypto";
import {after} from "next/server";
import {readJsonBody} from "@/lib/server/request";
import {notificationService} from "@/lib/server/notifications";
import {createTrustedOrder, orderRepository} from "@/lib/server/orders";
import {parseCreateOrderInput} from "@/lib/server/validation";
import {invoiceService} from "@/lib/server/invoices";
import {canReadInvoice, hashInvoiceToken} from "@/lib/server/invoiceAccess";
import {checkoutInvoiceToken, checkoutOrderReference, serializeCheckout} from "@/lib/server/checkoutSubmission";
import {UnsupportedInvoiceTextError} from "@/lib/server/invoiceFonts";
import type {InvoiceEmailStatus} from "@/types/invoice";
import type {Order} from "@/types/order";

export const runtime = "nodejs";

const headers = {"Cache-Control": "no-store"};
const error = (message: string, status: number) => Response.json({ok: false, error: message}, {status, headers});

function orderResponse(order: Order, key: string, status: 200 | 201) {
  const invoice = order.invoice;
  const downloadToken = checkoutInvoiceToken(key, order.reference);
  if (!invoice || !canReadInvoice(downloadToken, invoice.accessTokenHash)) throw new Error("INVALID_ORDER_INVOICE");
  return Response.json({ok: true, order: {
    reference: order.reference, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod,
    invoice: {number: invoice.number, downloadToken, emailStatus: invoice.emailStatus, paymentDueDate: invoice.paymentDueDate},
  }}, {status, headers});
}

async function sendInvoice(order: Order) {
  let emailStatus: InvoiceEmailStatus;
  try {
    await notificationService.sendOrderNotification(order);
    emailStatus = "SENT";
  } catch {
    emailStatus = "FAILED";
    console.error("ORDER_EMAIL_FAILED", order.reference);
  }
  try {
    await orderRepository.updateInvoiceEmailStatus(order.reference, emailStatus);
  } catch {
    console.error("ORDER_EMAIL_STATUS_SAVE_FAILED", order.reference);
  }
}

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const input = parseCreateOrderInput(parsed.value);
  const key = request.headers.get("idempotency-key");
  const expected = (parsed.value as {expectedLineTotals?: unknown} | null)?.expectedLineTotals;
  if (!input || !key || !/^[a-f0-9]{64}$/.test(key)
    || !Array.isArray(expected) || expected.length !== input.items.length
    || !expected.every(value => Number.isSafeInteger(value) && value > 0)) {
    return error("Проверьте данные заказа. Если форма давно открыта, обновите страницу.", 400);
  }
  const keyHash = hashInvoiceToken(key);
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");

  const replay = (order: Order) => order.checkout?.fingerprint === fingerprint
    ? orderResponse(order, key, 200)
    : error("Данные заказа изменились. Проверьте корзину и повторите оформление.", 409);

  try {
    return await serializeCheckout(keyHash, async () => {
      let invoiceNumber: number | undefined;
      for (let attempt = 0; attempt < 4; attempt++) {
        const reference = checkoutOrderReference(keyHash, attempt);
        const existing = await orderRepository.findByReference(reference);
        if (existing?.checkout?.keyHash === keyHash) return replay(existing);
        if (existing) continue;

        const order = createTrustedOrder(input);
        if (!order) return error("Проверьте количество и состав заказа. Один или несколько товаров недоступны для оформления.", 400);
        const lineTotals = order.items.map(item => Math.round(item.subtotal * 100));
        if (lineTotals.some((amount, index) => amount !== expected[index])) {
          return Response.json({ok: false, code: "ORDER_PRICE_CHANGED", lineTotals,
            error: "Цены изменились. Проверьте новую сумму перед оформлением."}, {status: 409, headers});
        }

        order.reference = reference;
        order.checkout = {keyHash, fingerprint};
        order.invoice = (await invoiceService.create(order, async () =>
          invoiceNumber ??= await orderRepository.reserveInvoiceNumber(), checkoutInvoiceToken(key, reference))).invoice;
        try {
          await orderRepository.save(order);
        } catch (caught) {
          const code = (caught as {code?: string} | undefined)?.code;
          if (code !== "EEXIST" && code !== "23505") throw caught;
          const saved = await orderRepository.findByReference(reference);
          if (saved?.checkout?.keyHash === keyHash) return replay(saved);
          if (saved) continue;
          throw caught;
        }
        after(() => sendInvoice(order));
        return orderResponse(order, key, 201);
      }
      throw new Error("ORDER_REFERENCE_EXHAUSTED");
    });
  } catch (caught) {
    if (caught instanceof UnsupportedInvoiceTextError) {
      return Response.json({ok: false, code: "INVOICE_TEXT_UNSUPPORTED", field: caught.field, error: caught.message}, {status: 422, headers});
    }
    if (caught instanceof Error && caught.message === "INVOICE_CONFIGURATION_INVALID") {
      console.error("INVOICE_CONFIGURATION_INVALID");
    }
    return error("Оформление временно недоступно. Свяжитесь с нами для расчёта поставки.", 503);
  }
}
