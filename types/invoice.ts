export type InvoiceEmailStatus = "SENT" | "FAILED";

export interface InvoiceReceipt {
  number: string;
  downloadToken: string;
  emailStatus: InvoiceEmailStatus;
  isPreview: boolean;
}

// Stored only on the server. The PDF is fixed at issue time, including seller details and tax.
export interface StoredInvoice {
  number: string;
  fileName: string;
  pdfBase64: string;
  accessTokenHash: string;
  emailStatus: "PENDING" | InvoiceEmailStatus;
  isPreview: boolean;
}
