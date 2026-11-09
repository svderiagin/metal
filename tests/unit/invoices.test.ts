import test, {afterEach, mock} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, rm, stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {PDFDocument} from "pdf-lib";
import nodemailer from "nodemailer";
import {createTrustedOrder} from "../../lib/server/orders";
import {FileOrderRepository} from "../../lib/server/fileOrderRepository";
import {readInvoiceConfig, isValidBankAccount} from "../../lib/server/invoiceConfig";
import {renderInvoicePdf, invoiceLine} from "../../lib/server/invoicePdf";
import {amountInWords, includedVat} from "../../lib/server/invoiceAmounts";
import {invoiceService} from "../../lib/server/invoices";
import {notificationService} from "../../lib/server/notifications";
import {smtpMailer, readSmtpConfig} from "../../lib/server/smtp";

afterEach(() => mock.restoreAll());
const sample = () => createTrustedOrder({consent: true,
  items: [{productId: "local-258", quantity: 18, measurement: {inputMode: "meter", meters: 18, weightTons: .02304}},
    {productId: "rozmet-2199", quantity: 3}],
  customer: {type: "INDIVIDUAL", fullName: "Анна Тестовая", email: "audit@example.invalid", phone: "+79000000000"},
  delivery: {address: "Тестовый адрес"}, paymentMethod: "INVOICE"})!;
const smtp = {NOTIFICATION_PROVIDER: "smtp", SMTP_HOST: "smtp.example.invalid", SMTP_USER: "test", SMTP_PASSWORD: "test",
  SMTP_FROM: "sales@example.invalid", NOTIFICATION_RECIPIENT_EMAIL: "manager@example.invalid"};

test("preview marks unconfirmed bank and VAT; live mode rejects missing, short or invalid bank and tax configuration", () => {
  const preview = readInvoiceConfig({});
  assert.equal(preview.isPreview, true);
  assert.equal(preview.vat, null);
  assert.match(preview.seller.bank.account, /УКАЖИТЕ/);
  const valid = {INVOICE_MODE: "live", INVOICE_BANK_ACCOUNT: "40702810500000000000", INVOICE_VAT_RATE: "22", INVOICE_PRICES_INCLUDE_VAT: "true"};
  // This is a synthetic account with the correct BIK checksum, never a payment fixture.
  assert.equal(isValidBankAccount(valid.INVOICE_BANK_ACCOUNT, "044525450"), true);
  assert.equal(readInvoiceConfig(valid).vat, 22);
  for (const changes of [{INVOICE_BANK_ACCOUNT: "4070281080000020353"}, {INVOICE_BANK_ACCOUNT: "1".repeat(20)},
    {INVOICE_VAT_RATE: ""}, {INVOICE_VAT_RATE: "20"}, {INVOICE_PRICES_INCLUDE_VAT: "false"}, {INVOICE_MODE: "typo"}]) {
    assert.throws(() => readInvoiceConfig({...valid, ...changes}), /CONFIGURATION/);
  }
});

test("invoice uses authoritative tonne quantity with tonne price, preserves small weights and kopecks", () => {
  const order = sample();
  const pipe = invoiceLine(order.items[0]);
  assert.equal(pipe.quantity, "0,02304");
  assert.equal(pipe.unit, "т");
  assert.equal(pipe.price, "53 640,00");
  assert.equal(pipe.subtotal, "1 235,87");
  assert.match(pipe.description, /Длина: 18 м/);
  const sheet = invoiceLine(order.items[1]);
  assert.equal(sheet.quantity, "3");
  assert.equal(sheet.unit, "шт.");
  assert.equal(order.totalAmount, 7235.87);
  assert.equal(includedVat([122, 61], 22), 33);
  assert.equal(includedVat([.03, .03], 22), .02);
  assert.equal(amountInWords(73296035.87), "Семьдесят три миллиона двести девяносто шесть тысяч тридцать пять рублей 87 копеек");
  assert.equal(amountInWords(2001.01), "Две тысячи один рубль 01 копейка");
  assert.equal(amountInWords(0), "Ноль рублей 00 копеек");
});

test("PDF embeds Cyrillic fonts, fits a small order on A4 and paginates 100 long product rows", async () => {
  const order = sample();
  const pdf = await renderInvoicePdf(order, readInvoiceConfig({}));
  const parsed = await PDFDocument.load(pdf);
  assert.equal(parsed.getPageCount(), 1);
  assert.match(parsed.getTitle()!, new RegExp(order.reference));
  assert.equal(Math.round(parsed.getPage(0).getWidth()), 595);
  const live = await PDFDocument.load(await renderInvoicePdf(order, {...readInvoiceConfig({}), isPreview: false, vat: 22}));
  assert.equal(live.getPageCount(), 1);
  order.items = Array.from({length: 100}, (_, index) => ({...order.items[index % 2],
    name: `Позиция ${index + 1}: ${"Длинное наименование металлопроката ".repeat(6)} 😀`}));
  order.totalAmount = order.items.reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0) / 100;
  const many = await PDFDocument.load(await renderInvoicePdf(order, readInvoiceConfig({})));
  assert.ok(many.getPageCount() > 5);
});

test("private file repository survives re-opening and keeps invoice bytes across concurrent status updates", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "rwb-orders-"));
  try {
    const first = new FileOrderRepository(directory);
    const order = sample();
    order.invoice = (await invoiceService.create(order)).invoice;
    await first.save(order);
    await assert.rejects(first.save(order), /EEXIST/);
    const second = new FileOrderRepository(directory);
    assert.deepEqual(await second.findByReference(order.reference), order);
    await Promise.all([second.updatePaymentStatus(order.reference, "PAID"), second.updateInvoiceEmailStatus(order.reference, "SENT")]);
    const saved = await second.findByReference(order.reference);
    assert.equal(saved?.paymentStatus, "PAID");
    assert.equal(saved?.invoice?.emailStatus, "SENT");
    assert.equal(saved?.invoice?.pdfBase64, order.invoice.pdfBase64);
    assert.equal((await stat(path.join(directory, `${order.reference}.json`))).mode & 0o777, 0o600);
    await assert.rejects(second.findByReference("../../secret"), /INVALID_ORDER_REFERENCE/);
    assert.throws(() => new FileOrderRepository("relative"));
    assert.throws(() => new FileOrderRepository(path.join(process.cwd(), "public/orders")), /PRIVATE/);
  } finally {await rm(directory, {recursive: true, force: true});}
});

test("SMTP sends the exact saved PDF to the customer with a manager copy and marks rejected recipients as failure", async () => {
  const previous = {...process.env};
  Object.assign(process.env, smtp);
  try {
    const order = sample();
    order.invoice = (await invoiceService.create(order)).invoice;
    const send = mock.method(smtpMailer, "send", async () => {});
    await notificationService.sendOrderNotification(order);
    const message = send.mock.calls[0].arguments[0]!;
    assert.equal(message.to, order.customer.email);
    assert.equal(message.bcc, smtp.NOTIFICATION_RECIPIENT_EMAIL);
    assert.match(message.subject!, /Образец счёта/);
    assert.deepEqual(message.attachments?.[0].content, Buffer.from(order.invoice.pdfBase64, "base64"));
    mock.restoreAll();
    let options: unknown;
    let accept = true;
    mock.method(nodemailer, "createTransport", (config: unknown) => {
      options = config;
      return {sendMail: async () => ({accepted: accept ? [order.customer.email] : []}), close() {}} as never;
    });
    await smtpMailer.send({to: order.customer.email, text: "Тест"});
    assert.equal((options as {secure: boolean}).secure, true);
    accept = false;
    await assert.rejects(smtpMailer.send({to: order.customer.email}), /RECIPIENT_REJECTED/);
    assert.equal(readSmtpConfig({...smtp, SMTP_PORT: "587"}).options.requireTLS, true);
    assert.throws(() => readSmtpConfig({}), /NOT_CONFIGURED/);
  } finally {
    for (const key of Object.keys(smtp)) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
