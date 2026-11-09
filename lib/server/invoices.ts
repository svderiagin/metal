import type {Order} from "@/types/order";
import type {StoredInvoice} from "@/types/invoice";
import {createInvoiceAccess} from "./invoiceAccess";
import {readInvoiceConfig} from "./invoiceConfig";
import {renderInvoicePdf} from "./invoicePdf";

export const invoiceService = {
  async create(order: Order): Promise<{invoice: StoredInvoice; downloadToken: string}> {
    const config = readInvoiceConfig();
    const pdf = await renderInvoicePdf(order, config);
    const access = createInvoiceAccess();
    return {invoice: {number: order.reference, fileName: `invoice-${order.reference}.pdf`,
      pdfBase64: pdf.toString("base64"), accessTokenHash: access.hash, emailStatus: "PENDING", isPreview: config.isPreview},
      downloadToken: access.token};
  },
};
