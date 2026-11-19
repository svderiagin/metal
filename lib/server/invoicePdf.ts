import {readFile} from "node:fs/promises";
import path from "node:path";
import {PDFDocument, rgb, type PDFFont, type PDFPage} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type {Order, OrderItem} from "@/types/order";
import {companyDetails} from "@/lib/companyDetails";
import type {InvoiceConfig} from "./invoiceConfig";
import {amountInWords, includedVat} from "./invoiceAmounts";

const width = 595.28, height = 841.89, margin = 40, content = width - margin * 2;
const ink = rgb(.09, .13, .18), muted = rgb(.32, .37, .43), border = rgb(.7, .73, .77);
const money = (value: number) => new Intl.NumberFormat("ru-RU", {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value).replace(/\s/g, " ");
const quantity = (value: number) => new Intl.NumberFormat("ru-RU", {useGrouping: false, maximumSignificantDigits: 15}).format(value);
const secondaryQuantity = (value: number) => new Intl.NumberFormat("ru-RU", {maximumSignificantDigits: 8}).format(value);
const date = (value: string | Date) => new Intl.DateTimeFormat("ru-RU", {timeZone: "Europe/Moscow"}).format(new Date(value));

export function invoiceLine(item: OrderItem) {
  const units: Record<string, string> = {"за тонну": "т", "за штуку": "шт.", "за рулон": "рул.",
    "за погонный метр": "м", "за метр": "м", "за квадратный метр": "м²"};
  const unit = item.measurement ? "т" : units[item.priceUnit];
  if (!unit) throw new Error("UNKNOWN_INVOICE_UNIT");
  const details = [item.measurement ? `Длина: ${secondaryQuantity(item.measurement.meters)} м` : "",
    item.pieceOrder ? `${item.pieceOrder.pieces} шт. по ${quantity(item.pieceOrder.lengthMeters)} м` : ""].filter(Boolean);
  return {description: [item.name, ...details].join("\n"),
    quantity: quantity(item.measurement?.weightTons ?? item.quantity), unit, price: money(item.unitPrice), subtotal: money(item.subtotal)};
}

export async function renderInvoicePdf(order: Order, config: InvoiceConfig, number: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fontDirectory = path.join(process.cwd(), "lib/server/invoice-fonts");
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(fontDirectory, "Inter-Regular.ttf")), readFile(path.join(fontDirectory, "Inter-Semibold.ttf")),
  ]);
  const regular = await doc.embedFont(regularBytes, {subset: true});
  const bold = await doc.embedFont(boldBytes, {subset: true});
  const supported = new Set(regular.getCharacterSet());
  const clean = (value: string) => Array.from(value.replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").replace(/[\u2010-\u2015]/g, "-").replace(/\u00a0|\u202f/g, " "))
    .map(char => char === "\n" || supported.has(char.codePointAt(0)!) ? char : "?").join("");
  let page!: PDFPage;
  let y = 0;
  const pages: PDFPage[] = [];
  function newPage() {
    page = doc.addPage([width, height]);
    pages.push(page);
    y = height - margin;
  }
  function text(value: string, x: number, top: number, size = 10, font: PDFFont = regular, color = ink) {
    page.drawText(clean(value), {x, y: top - size, size, font, color});
  }
  function wrap(value: string, maximum: number, size = 10, font = regular) {
    const lines: string[] = [];
    for (const paragraph of clean(value).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > maximum) {lines.push(line); line = "";}
        for (const char of word) {
          if (line && font.widthOfTextAtSize(line + char, size) > maximum) {lines.push(line); line = "";}
          line += char;
        }
        line += " ";
      }
      lines.push(line.trim());
    }
    return lines;
  }
  function ensure(space: number) {if (y - space < 62) newPage();}
  function paragraph(value: string, size = 10, font = regular, color = ink) {
    const lines = wrap(value, content, size, font);
    for (const line of lines) {ensure(size + 4); text(line, margin, y, size, font, color); y -= size + 4;}
    y -= 4;
  }
  newPage();
  text(companyDetails.brandName, margin, y, 17, bold, rgb(.11, .28, .36));
  y -= 34;
  paragraph("Реквизиты получателя", 10, bold);

  const bankTop = y;
  const bankRows = [
    [`${config.seller.bank.name}\nБанк получателя`, `БИК ${config.seller.bank.bik}\nК/с ${config.seller.bank.correspondentAccount}`],
    [`ИНН ${config.seller.inn} / КПП ${config.seller.kpp}`, `Р/с ${config.seller.bank.account}`],
    [`${config.seller.name}\nПолучатель`, ""],
  ];
  const bankLeft = content * .57;
  for (const [left, right] of bankRows) {
    const a = wrap(left, bankLeft - 16, 9), b = wrap(right, content - bankLeft - 16, 9);
    const rowHeight = Math.max(a.length, b.length) * 13 + 14;
    page.drawRectangle({x: margin, y: y - rowHeight, width: content, height: rowHeight, borderColor: border, borderWidth: .6});
    if (right) page.drawLine({start: {x: margin + bankLeft, y}, end: {x: margin + bankLeft, y: y - rowHeight}, color: border, thickness: .6});
    a.forEach((line, i) => text(line, margin + 8, y - 7 - i * 13, 9));
    b.forEach((line, i) => text(line, margin + bankLeft + 8, y - 7 - i * 13, 9));
    y -= rowHeight;
  }
  if (bankTop - y > 180) throw new Error("INVOICE_BANK_LAYOUT_OVERFLOW");
  y -= 18;
  paragraph(`Счёт на оплату № ${number} от ${date(order.createdAt)}`, 18, bold);
  y -= 4;
  paragraph(`Поставщик: ${config.seller.name}, ИНН ${config.seller.inn}, КПП ${config.seller.kpp}, ОГРН ${config.seller.ogrn}. ${config.seller.address}`, 9);
  const customer = order.customer;
  paragraph(`Покупатель: ${customer.type === "COMPANY" ? `${customer.companyName}, ИНН ${customer.taxNumber}. ${customer.legalAddress}` : customer.fullName}`, 9);
  paragraph(customer.type === "COMPANY" ? `Контактное лицо: ${customer.fullName}, ${customer.phone}` : `Телефон: ${customer.phone}`, 9);
  paragraph(`Адрес доставки: ${order.delivery.address}`, 9);
  y -= 4;

  const columns = [24, 192, 72, 30, 92, content - 410];
  function row(cells: string[], header = false) {
    const size = header ? 8 : 9;
    const font = header ? bold : regular;
    const lines = cells.map((cell, i) => wrap(cell, columns[i] - 10, size, font));
    const rowHeight = Math.max(...lines.map(lines => lines.length)) * 12 + 10;
    ensure(rowHeight + (header ? 32 : 0));
    let x = margin;
    cells.forEach((_cell, i) => {
      page.drawRectangle({x, y: y - rowHeight, width: columns[i], height: rowHeight, borderColor: border, borderWidth: .5,
        ...(header ? {color: rgb(.94, .95, .97)} : {})});
      lines[i].forEach((line, index) => {
        const right = i >= 2 && !header;
        const tx = right ? x + columns[i] - 5 - font.widthOfTextAtSize(line, size) : x + 5;
        text(line, tx, y - 5 - index * 12, size, font);
      });
      x += columns[i];
    });
    y -= rowHeight;
  }
  const header = () => row(["№", "Товар / характеристики", "Количество", "Ед.", "Цена, руб.", "Сумма, руб."], true);
  header();
  for (const [index, item] of order.items.entries()) {
    const line = invoiceLine(item);
    const cells = [String(index + 1), line.description, line.quantity, line.unit, line.price, line.subtotal];
    const needed = Math.max(...cells.map((cell, i) => wrap(cell, columns[i] - 10, 9).length)) * 12 + 10;
    if (y - needed < 62) {newPage(); paragraph(`Счёт № ${number} от ${date(order.createdAt)} (продолжение)`, 10, bold); header();}
    row(cells);
  }
  y -= 18;
  ensure(95);
  paragraph(`Итого за товары: ${money(order.totalAmount)} руб.`, 11, bold);
  paragraph("Доставка: бесплатно (0,00 руб.)", 10);
  const vatLine = config.vat === "NONE" ? "Без НДС."
    : `В том числе НДС ${config.vat}%: ${money(includedVat(order.items.map(item => item.subtotal), config.vat))} руб.`;
  paragraph(vatLine);
  paragraph(`Всего к оплате: ${money(order.totalAmount)} руб.`, 13, bold);
  paragraph(`Всего наименований: ${order.items.length}. ${amountInWords(order.totalAmount)}.`, 10);
  y -= 8;
  const deadline = new Date(order.createdAt);
  deadline.setTime(deadline.getTime() + config.paymentDays * 86_400_000);
  paragraph("Назначение платежа", 9, bold);
  paragraph(`Оплата по счёту № ${number} от ${date(order.createdAt)} за металлопрокат. ${vatLine}`, 9);
  paragraph(`Счёт действителен по ${date(deadline)} включительно. Предоплата 100%. Дата и условия отгрузки согласуются с покупателем.`, 9);
  pages.forEach((current, index) => {
    current.drawLine({start: {x: margin, y: 43}, end: {x: width - margin, y: 43}, color: border, thickness: .5});
    current.drawText(`Счёт № ${number}  |  Стр. ${index + 1} из ${pages.length}`, {x: margin, y: 28, size: 8, font: regular, color: muted});
  });
  doc.setTitle(`Счёт на оплату № ${number}`);
  doc.setAuthor(config.seller.name);
  doc.setCreationDate(new Date(order.createdAt));
  return Buffer.from(await doc.save());
}
