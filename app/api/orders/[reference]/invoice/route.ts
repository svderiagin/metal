import {orderRepository} from "@/lib/server/orders";
import {canReadInvoice} from "@/lib/server/invoiceAccess";
import {isOrderReference} from "@/lib/orderReference";
import {invoiceFileName} from "@/lib/invoiceNumber";

export const runtime = "nodejs";

const headers = {"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer"};
const missing = () => Response.json({ok: false, error: "Счёт не найден или ссылка недействительна."}, {status: 404, headers});

export async function GET(request: Request, context: {params: Promise<{reference: string}>}) {
  const {reference} = await context.params;
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!isOrderReference(reference) || !token) return missing();
  try {
    const order = await orderRepository.findByReference(reference);
    if (!order?.invoice || !canReadInvoice(token, order.invoice.accessTokenHash)) return missing();
    const fileName = invoiceFileName(order.invoice.number, reference);
    return new Response(new Uint8Array(Buffer.from(order.invoice.pdfBase64, "base64")), {headers: {...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${reference}.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`}});
  } catch {
    return Response.json({ok: false, error: "Не удалось загрузить счёт. Попробуйте ещё раз."}, {status: 503, headers});
  }
}
