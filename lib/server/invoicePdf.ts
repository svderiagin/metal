import {PDFDocument, rgb, type PDFFont, type PDFPage} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type {Order} from "@/types/order";
import {companyDetails} from "@/lib/companyDetails";
import {formatInvoiceDate} from "@/lib/invoiceDate";
import {formatCheckoutPhoneDraft} from "@/lib/checkoutPhone";
import type {InvoiceConfig} from "./invoiceConfig";
import {amountInWords, includedVat} from "./invoiceAmounts";
import {orderDocumentLine} from "./orderDocumentLine";
import {hasInvoiceGlyph, normalizeInvoiceText, prepareInvoiceFonts, type InvoiceFonts} from "./invoiceFonts";

const width = 595.28;
const height = 841.89;
const margin = 36;
const content = width - margin * 2;
const right = width - margin;
const bottom = 61;
const columnGap = 24;
const partyWidth = (content - columnGap) / 2;
const buyerX = right - partyWidth;
const tableInset = 8;
const ink = rgb(.09, .13, .18);
const muted = rgb(.33, .37, .42);
const accent = rgb(.10, .27, .35);
const border = rgb(.76, .80, .82);
const panel = rgb(.945, .957, .963);
const moneyFormat = new Intl.NumberFormat("ru-RU", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const money = (value: number) => moneyFormat.format(value);

type TextAlignment = "left" | "center" | "right";

export async function renderInvoicePdf(order: Order, config: InvoiceConfig, number: string, paymentDueDate: string,
  prepared?: InvoiceFonts): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = prepared ?? await prepareInvoiceFonts(order);
  const [regular, bold] = await Promise.all([
    doc.embedFont(fonts.regular.bytes, {subset: true}),
    doc.embedFont(fonts.bold.bytes, {subset: true}),
  ]);
  const issued = formatInvoiceDate(order.createdAt);
  const title = `Счёт на оплату № ${number}`;
  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  function printable(value: string, font: PDFFont) {
    const typeface = font === bold ? fonts.bold : fonts.regular;
    let result = "";
    for (const character of normalizeInvoiceText(value)) {
      if (hasInvoiceGlyph(typeface, character)) result += character;
      else if (/[\u2010-\u2015]/u.test(character)) result += "-";
      else throw new Error("MISSING_INVOICE_GLYPH");
    }
    return result;
  }

  function text(value: string, x: number, baseline: number, size = 10, font = regular, color = ink, align: TextAlignment = "left") {
    const label = printable(value, font);
    if (!label) return;
    const measured = align === "left" ? 0 : font.widthOfTextAtSize(label, size);
    const offset = align === "center" ? measured / 2 : measured;
    page.drawText(label, {x: x - offset, y: baseline, size, font, color});
  }

  function wrap(value: string, available: number, size: number, font = regular) {
    const lines: string[] = [];
    let line = "";
    const fits = (line: string) => font.widthOfTextAtSize(printable(line, font), size) <= available;
    for (const word of value.trim().split(/[ \t\n\r]+/u)) {
      const proposed = line ? `${line} ${word}` : word;
      if (fits(proposed)) {
        line = proposed;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const char of word) {
        if (line && !fits(line + char)) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function linesAt(lines: readonly string[], x: number, baseline: number, size: number, leading: number, font = regular, color = ink) {
    lines.forEach((value, index) => text(value, x, baseline - index * leading, size, font, color));
    return baseline - lines.length * leading;
  }

  function rule(top: number) {
    page.drawLine({start: {x: margin, y: top}, end: {x: right, y: top}, color: border, thickness: .55});
  }

  function background(x: number, top: number, w: number, h: number) {
    page.drawRectangle({x, y: top - h, width: w, height: h, color: panel});
  }

  function addPage() {
    page = doc.addPage([width, height]);
    const continuation = pages.length > 0;
    pages.push(page);
    y = height - margin;
    const brandBaseline = y - 12;
    text(companyDetails.brandName, margin, brandBaseline, 12, bold, accent);
    if (continuation) {
      text(`Счёт № ${number} от ${issued} (продолжение)`, margin, y - 33, 11, bold);
      y -= 46;
    } else {
      y -= 28;
    }
  }

  function bankBlock(bank: InvoiceConfig["seller"]["bank"]) {
    const inset = columnGap / 2;
    const split = buyerX - inset;
    const rows = [
      [{label: "Получатель", value: config.seller.name}, {label: "Расчётный счёт", value: bank.account}],
      [{label: "Банк получателя", value: bank.name}, {label: "БИК", value: bank.bik}],
      [{label: "ИНН / КПП", value: `${config.seller.inn} / ${config.seller.kpp}`},
        {label: "Корреспондентский счёт", value: bank.correspondentAccount}],
    ].map(pair => {
      const fields = pair.map(field => ({label: field.label, lines: wrap(field.value, partyWidth - inset, 10, bold)}));
      return {fields, height: 17 + Math.max(...fields.map(field => field.lines.length)) * 13};
    });
    const blockHeight = rows.reduce((sum, row) => sum + row.height, 0) + 20;
    text("Банковские реквизиты для оплаты", margin, y - 11, 11, bold);
    y -= 18;
    background(margin, y, content, blockHeight);
    page.drawLine({start: {x: split, y: y - 10}, end: {x: split, y: y - blockHeight + 10}, color: border, thickness: .5});
    let baseline = y - 19;
    for (const {fields: [left, right], height} of rows) {
      text(left.label, margin + inset, baseline, 8.5, regular, muted);
      text(right.label, buyerX, baseline, 8.5, regular, muted);
      linesAt(left.lines, margin + inset, baseline - 13, 10, 13, bold);
      linesAt(right.lines, buyerX, baseline - 13, 10, 13, bold);
      baseline -= height;
    }
    y -= blockHeight + 16;
  }

  addPage();
  const titleBaseline = y - 20;
  text(title, margin, titleBaseline, 20, bold);
  text("К оплате", right, titleBaseline + 21, 9, regular, muted, "right");
  text(`${money(order.totalAmount)} руб.`, right, titleBaseline, 15, bold, accent, "right");
  y -= 30;
  text(`от ${issued}  ·  Заказ № ${order.reference}`, margin, y - 10, 10, regular, muted);
  text(`Оплатить до ${formatInvoiceDate(paymentDueDate)} включительно`, right, y - 10, 10, bold, ink, "right");
  y -= 24;
  bankBlock(config.seller.bank);

  const customer = order.customer;
  const company = customer.type === "COMPANY";
  const phone = formatCheckoutPhoneDraft(customer.phone) ?? customer.phone;
  const buyerName = company ? customer.companyName ?? customer.fullName : customer.fullName;
  text("Поставщик", margin, y - 9, 9, bold, accent);
  text("Покупатель", buyerX, y - 9, 9, bold, accent);
  y = Math.min(
    linesAt(wrap(config.seller.name, partyWidth, 10, bold), margin, y - 25, 10, 13, bold),
    linesAt(wrap(buyerName, partyWidth, 10, bold), buyerX, y - 25, 10, 13, bold),
  ) - 1;
  text(`ИНН ${config.seller.inn} · КПП ${config.seller.kpp}`, margin, y, 9, regular, muted);
  text(`ОГРН ${config.seller.ogrn}`, margin, y - 12, 9, regular, muted);
  if (company && customer.taxNumber) {
    text(`ИНН ${customer.taxNumber}`, buyerX, y, 9, regular, muted);
  }
  let buyerBaseline = company ? y - 24 : y;
  if (company) buyerBaseline = linesAt(wrap(customer.legalAddress ?? "", partyWidth, 9), buyerX, buyerBaseline, 9, 12, regular, muted);
  const contact = company ? `${customer.fullName}, ${phone.replaceAll(" ", "\u00a0")}` : phone;
  buyerBaseline = linesAt(wrap(contact, partyWidth, 9), buyerX, buyerBaseline, 9, 12, regular, muted);
  const sellerBaseline = linesAt(wrap(config.seller.address, partyWidth, 9), margin, y - 24, 9, 12, regular, muted);
  y = Math.min(sellerBaseline, buyerBaseline) - 11;
  text("Адрес доставки", margin, y, 9, bold, accent);
  y = linesAt(wrap(order.delivery.address, content, 9), margin, y - 14, 9, 12, regular, muted) - 2;

  let columnX = margin;
  const columns = ([
    ["№", 27, "center"],
    ["Наименование товара", content - 307, "left"],
    ["Количество", 74, "right"],
    ["Ед.", 32, "center"],
    ["Цена, руб.", 80, "right"],
    ["Сумма, руб.", 94, "right"],
  ] as const).map(([label, width, align]) => {
    const left = columnX;
    columnX += width;
    const x = align === "center" ? left + width / 2 : align === "right" ? columnX - tableInset : left + tableInset;
    return {label, x, width, align};
  });
  const nameColumn = columns[1];
  const nameWidth = nameColumn.width - tableInset * 2;
  const headerHeight = 24;
  const taxNoteHeight = 15;
  const vat = config.vat;
  const vatAmount = vat === "NONE" ? null : includedVat(order.totalAmount, vat);
  const taxNote = vat === "NONE" ? "Цены и суммы по позициям указаны без НДС." : `Цены и суммы по позициям включают НДС ${vat}%.`;

  function tableHeader() {
    text(taxNote, margin + tableInset, y - 8, 8.5, regular, muted);
    y -= taxNoteHeight;
    background(margin, y, content, headerHeight);
    for (const {label, x, align} of columns) text(label, x, y - 15, 9, bold, ink, align);
    y -= headerHeight;
  }

  function tableValue(value: string, column: number, baseline: number, color = ink) {
    const {width, x, align} = columns[column];
    const available = width - (align === "center" ? 8 : tableInset * 2);
    const measured = regular.widthOfTextAtSize(printable(value, regular), 9.5);
    const size = measured > available ? 9.5 * available / measured : 9.5;
    text(value, x, baseline, size, regular, color, align);
  }

  const netAmount = vatAmount === null ? order.totalAmount
    : (Math.round(order.totalAmount * 100) - Math.round(vatAmount * 100)) / 100;
  const amounts = [
    {label: vatAmount === null ? "Стоимость товаров" : "Стоимость товаров без НДС", value: money(netAmount)},
    vatAmount === null ? {label: "Без НДС", value: ""} : {label: `НДС ${vat}%`, value: money(vatAmount)},
    {label: "Доставка", value: "0,00"},
  ];
  const words = wrap(amountInWords(order.totalAmount), content - tableInset * 2, 9, bold);
  const taxInPurpose = vatAmount === null ? "Без НДС." : `В том числе НДС ${vat}% — ${money(vatAmount)}\u00a0руб.`;
  const purpose = wrap(
    `Предоплата по счёту №\u00a0${number} от ${issued} за металлопрокат. ${taxInPurpose}`,
    content - 24, 9,
  );
  const terms = wrap(
    "Предоплата 100%. Дату и условия отгрузки согласуем с вами.",
    content - 24, 9,
  );
  const paymentHeight = 33 + (purpose.length + terms.length) * 12;
  const totalsHeight = 12 + amounts.length * 15 + 3 + 36 + 13 + words.length * 12 + 10 + paymentHeight;
  let headerNeeded = true;
  for (const [index, item] of order.items.entries()) {
    const line = orderDocumentLine(item);
    const names = wrap(line.name, nameWidth, 9.5, bold);
    const details = wrap(line.details, nameWidth, 8.5);
    const delivery = line.delivery ? wrap(line.delivery.replace(/(\d) (?=недел)/u, "$1\u00a0"), nameWidth, 8.5) : [];
    const rowHeight = names.length * 12 + (details.length + delivery.length) * 11 + 12;
    const remaining = rowHeight + (headerNeeded ? taxNoteHeight + headerHeight : 0) +
      (index === order.items.length - 1 ? totalsHeight : 0);
    if (y - remaining < bottom) {
      addPage();
      headerNeeded = true;
    }
    if (headerNeeded) {
      tableHeader();
      headerNeeded = false;
    }
    const baseline = y - 15.5;
    tableValue(String(index + 1), 0, baseline, muted);
    const afterName = linesAt(names, nameColumn.x, baseline, 9.5, 12, bold);
    const afterDetails = linesAt(details, nameColumn.x, afterName, 8.5, 11, regular, muted);
    linesAt(delivery, nameColumn.x, afterDetails, 8.5, 11, regular, accent);
    tableValue(line.quantity, 2, baseline);
    tableValue(line.unit, 3, baseline);
    tableValue(money(item.unitPrice), 4, baseline);
    tableValue(money(item.subtotal), 5, baseline);
    y -= rowHeight;
    rule(y);
  }

  const totalLabelX = margin + tableInset;
  const currencyX = columns[5].x;
  const totalValueX = currencyX - regular.widthOfTextAtSize("руб.", 9.5) - 5;
  function totalValue(value: string, baseline: number, prominent = false) {
    if (!value) return;
    text(value, totalValueX, baseline, prominent ? 15 : 9.5, prominent ? bold : regular, prominent ? accent : ink, "right");
    text("руб.", currencyX, baseline, 9.5, regular, prominent ? accent : muted, "right");
  }

  y -= 12;
  for (const {label, value} of amounts) {
    text(label, totalLabelX, y - 9.5, 9.5, regular, muted);
    totalValue(value, y - 9.5);
    y -= 15;
  }
  y -= 3;
  background(margin, y, content, 28);
  text("Всего к оплате", totalLabelX, y - 19, 11, bold);
  totalValue(money(order.totalAmount), y - 19, true);
  y -= 36;
  text("Сумма прописью", totalLabelX, y - 8.5, 8.5, regular, muted);
  text(`Позиций: ${order.items.length}`, currencyX, y - 8.5, 8.5, regular, muted, "right");
  y = linesAt(words, totalLabelX, y - 21, 9, 12, bold) - 2;
  background(margin, y, content, paymentHeight);
  text("Назначение платежа", margin + 12, y - 18, 9, bold, accent);
  y = linesAt(purpose, margin + 12, y - 30, 9, 12) - 3;
  linesAt(terms, margin + 12, y, 9, 12, regular, muted);

  pages.forEach((current, index) => {
    page = current;
    rule(42);
    text(`Заказ № ${order.reference}`, margin, 25, 8, regular, muted);
    text(`Вопросы по заказу · ${companyDetails.salesEmail}`, width / 2, 25, 8, regular, accent, "center");
    text(`Страница ${index + 1} из ${pages.length}`, right, 25, 8, regular, muted, "right");
  });
  doc.setTitle(title);
  doc.setAuthor(config.seller.name);
  doc.setCreationDate(new Date(order.createdAt));
  return Buffer.from(await doc.save());
}
