import type {Order} from "@/types/order";
import type {StoredInvoice} from "@/types/invoice";
import {createInvoiceAccess} from "./invoiceAccess";
import {readInvoiceConfig} from "./invoiceConfig";
import {renderInvoicePdf} from "./invoicePdf";
import {invoiceFileName, isInvoiceNumber} from "@/lib/invoiceNumber";
import {hashInvoicePdf} from "./invoiceFile";
import {prepareInvoiceFonts} from "./invoiceFonts";

export const invoiceService = {
  async create(order: Order, reserveNumber: () => Promise<number>, downloadToken?: string): Promise<{invoice: StoredInvoice; downloadToken: string}> {
    const config = readInvoiceConfig();
    const fonts = await prepareInvoiceFonts(order);
    const number = String(await reserveNumber());
    if (!isInvoiceNumber(number)) throw new Error("INVALID_INVOICE_NUMBER");
    const paymentDueDate = new Date(Date.parse(order.createdAt) + config.paymentDays * 86_400_000).toISOString();
    const pdf = await renderInvoicePdf(order, config, number, paymentDueDate, fonts);
    const access = createInvoiceAccess(downloadToken);
    return {invoice: {number, paymentDueDate, fileName: invoiceFileName(number),
      pdfBase64: pdf.toString("base64"), pdfHash: hashInvoicePdf(pdf), accessTokenHash: access.hash,
      emailStatus: "PENDING"},
      downloadToken: access.token};
  },
};
