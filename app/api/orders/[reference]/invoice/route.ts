import {orderRepository} from "@/lib/server/orders";
import {canReadInvoice} from "@/lib/server/invoiceAccess";
import {isOrderReference} from "@/lib/orderReference";
import {invoiceFileName, isInvoiceNumber} from "@/lib/invoiceNumber";
import {readStoredInvoicePdf} from "@/lib/server/invoiceFile";

export const runtime = "nodejs";

const headers = {"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer"};
type RouteContext = {params: Promise<{reference: string}>};

async function findInvoice(request: Request, context: RouteContext) {
  const {reference} = await context.params;
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!isOrderReference(reference) || !token) return null;
  const invoice = (await orderRepository.findByReference(reference))?.invoice;
  if (!invoice || !isInvoiceNumber(invoice.number) || !canReadInvoice(token, invoice.accessTokenHash)
    || invoice.fileName !== invoiceFileName(invoice.number)) return null;
  return invoice;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const invoice = await findInvoice(request, context);
    if (!invoice) return Response.json({ok: false, error: "Счёт не найден или ссылка недействительна."}, {status: 404, headers});
    const pdf = await readStoredInvoicePdf(invoice);
    return new Response(new Uint8Array(pdf), {headers: {...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"; filename*=UTF-8''${encodeURIComponent(invoice.fileName)}`}});
  } catch {
    return Response.json({ok: false, error: "Не удалось загрузить счёт. Попробуйте ещё раз."}, {status: 503, headers});
  }
}

export async function HEAD(request: Request, context: RouteContext) {
  try {
    const invoice = await findInvoice(request, context);
    if (!invoice) return new Response(null, {status: 404, headers});
    return new Response(null, {headers: {...headers, "X-Invoice-Email-Status": invoice.emailStatus}});
  } catch {
    return new Response(null, {status: 503, headers});
  }
}
