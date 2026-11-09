import {orderRepository} from "@/lib/server/orders";
import {canReadInvoice} from "@/lib/server/invoiceAccess";

export const runtime = "nodejs";

const headers = {"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer"};
const missing = () => Response.json({ok: false, error: "Счёт не найден или ссылка недействительна."}, {status: 404, headers});

export async function GET(request: Request, context: {params: Promise<{reference: string}>}) {
  const {reference} = await context.params;
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!/^MS-[A-F0-9]{12}$/.test(reference) || !token) return missing();
  try {
    const order = await orderRepository.findByReference(reference);
    if (!order?.invoice || !canReadInvoice(token, order.invoice.accessTokenHash)) return missing();
    return new Response(new Uint8Array(Buffer.from(order.invoice.pdfBase64, "base64")), {headers: {...headers,
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="invoice-${reference}.pdf"`}});
  } catch {
    return Response.json({ok: false, error: "Не удалось загрузить счёт. Попробуйте ещё раз."}, {status: 503, headers});
  }
}
