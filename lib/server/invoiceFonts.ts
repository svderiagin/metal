import {readFile} from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import type {Order} from "@/types/order";
import type {InvoiceBuyerField} from "@/types/invoice";

type Typeface = {bytes: Buffer; glyphs: Set<number>};
const fonts = new Map<string, Promise<Typeface>>();

function loadTypeface(file: string): Promise<Typeface> {
  const cached = fonts.get(file);
  if (cached) return cached;
  const loading = readFile(path.join(process.cwd(), "lib/server/invoice-fonts", file))
    .then(bytes => ({bytes, glyphs: new Set(fontkit.create(bytes).characterSet)}))
    .catch(error => {
      fonts.delete(file);
      throw error;
    });
  fonts.set(file, loading);
  return loading;
}

export function normalizeInvoiceText(text: string) {
  // Preserve the spelling. Normalizing whitespace here only affects printable layout.
  return text.normalize("NFC").replace(/[\u0000-\u001f\u00a0\u202f]/gu, " ");
}

export function hasInvoiceGlyph(typeface: Typeface, character: string) {
  return typeface.glyphs.has(character.codePointAt(0)!);
}

export class UnsupportedInvoiceTextError extends Error {
  constructor(public readonly field: InvoiceBuyerField) {
    super("В счёте нельзя напечатать некоторые символы из этого поля. Укажите написание из документов кириллицей или латиницей.");
  }
}

export async function prepareInvoiceFonts(order: Order) {
  const [regular, bold] = await Promise.all([loadTypeface("Inter-Regular.ttf"), loadTypeface("Inter-Semibold.ttf")]);
  const fields = [
    {key: "fullName", text: order.customer.fullName, typeface: order.customer.type === "COMPANY" ? regular : bold},
    {key: "companyName", text: order.customer.companyName ?? "", typeface: bold},
    {key: "legalAddress", text: order.customer.legalAddress ?? "", typeface: regular},
    {key: "deliveryAddress", text: order.delivery.address, typeface: regular},
  ] as const;
  for (const field of fields) {
    if ([...normalizeInvoiceText(field.text)].some(letter => !hasInvoiceGlyph(field.typeface, letter))) {
      throw new UnsupportedInvoiceTextError(field.key);
    }
  }
  return {regular, bold};
}

export type InvoiceFonts = Awaited<ReturnType<typeof prepareInvoiceFonts>>;
