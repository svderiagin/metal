import {createHash} from "node:crypto";
import {PDFDocument} from "pdf-lib";
import type {StoredInvoice} from "@/types/invoice";

export function hashInvoicePdf(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function readStoredInvoicePdf(invoice: StoredInvoice): Promise<Buffer> {
  const bytes = Buffer.from(invoice.pdfBase64, "base64");
  if (bytes.toString("base64") !== invoice.pdfBase64
    || bytes.subarray(0, 5).toString("ascii") !== "%PDF-"
    || !/%%EOF\s*$/u.test(bytes.subarray(-32).toString("ascii"))) {
    throw new Error("INVALID_STORED_INVOICE");
  }
  if (invoice.pdfHash !== undefined) {
    if (invoice.pdfHash !== hashInvoicePdf(bytes)) throw new Error("INVALID_STORED_INVOICE");
  } else {
    const pdf = await PDFDocument.load(bytes, {updateMetadata: false, throwOnInvalidObject: true});
    if (!pdf.getPageCount()) throw new Error("INVALID_STORED_INVOICE");
  }
  return bytes;
}
