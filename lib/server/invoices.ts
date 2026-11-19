import type {Order} from "@/types/order";
import type {StoredInvoice} from "@/types/invoice";
import {createInvoiceAccess} from "./invoiceAccess";
import {readInvoiceConfig} from "./invoiceConfig";
import {renderInvoicePdf} from "./invoicePdf";
import {invoiceFileName, isInvoiceNumber} from "@/lib/invoiceNumber";

export const invoiceService = {
  async create(order: Order, reserveNumber: () => Promise<number>): Promise<{invoice: StoredInvoice; downloadToken: string}> {
    const config = readInvoiceConfig();
    const number = String(await reserveNumber());
    if (!isInvoiceNumber(number)) throw new Error("INVALID_INVOICE_NUMBER");
    const pdf = await renderInvoicePdf(order, config, number);
    const access = createInvoiceAccess();
    return {invoice: {number, fileName: invoiceFileName(number, order.reference),
      pdfBase64: pdf.toString("base64"), accessTokenHash: access.hash, emailStatus: "PENDING", isPreview: false},
      downloadToken: access.token};
  },
};
