import {companyDetails} from "@/lib/companyDetails";

type InvoiceSeller = {name: string; inn: string; kpp: string; address: string; ogrn: string};
type InvoiceBank = {name: string; bik: string; account: string; correspondentAccount: string};
type InvoiceVat = "NONE" | 5 | 7 | 10 | 22;

export type InvoiceConfig = {seller: InvoiceSeller & {bank: InvoiceBank}; vat: InvoiceVat; paymentDays: number};

export function isValidBankAccount(account: string, bik: string): boolean {
  if (!/^\d{20}$/.test(account) || !/^\d{9}$/.test(bik) || /^0+$/.test(account) || /^0+$/.test(bik)) return false;
  const digits = bik.slice(-3) + account;
  return [...digits].reduce((sum, digit, index) => sum + Number(digit) * [7, 1, 3][index % 3], 0) % 10 === 0;
}

export function readInvoiceConfig(env: Record<string, string | undefined> = process.env): InvoiceConfig {
  const account = env.INVOICE_BANK_ACCOUNT?.trim() ?? "";
  const seller = {name: companyDetails.legalName, inn: companyDetails.inn, kpp: companyDetails.kpp,
    address: companyDetails.legalAddress, ogrn: companyDetails.ogrn};
  const vat = env.INVOICE_VAT_RATE?.trim();
  const paymentDays = Number(env.INVOICE_PAYMENT_DAYS || "3");
  if (!isValidBankAccount(account, companyDetails.bank.bik)
    || !["NONE", "5", "7", "10", "22"].includes(vat ?? "")
    || vat !== "NONE" && env.INVOICE_PRICES_INCLUDE_VAT !== "true"
    || !Number.isInteger(paymentDays) || paymentDays < 1 || paymentDays > 30) {
    throw new Error("INVOICE_CONFIGURATION_INVALID");
  }
  return {seller: {...seller, bank: {...companyDetails.bank, account}},
    vat: vat === "NONE" ? "NONE" : Number(vat) as InvoiceVat, paymentDays};
}
