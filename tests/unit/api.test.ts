import test, {after, before} from "node:test";
import assert from "node:assert/strict";
import {readJsonBody} from "../../lib/server/request";
import {parseCreateOrderInput} from "../../lib/server/validation";
import {notificationService} from "../../lib/server/notifications";
import {smtpMailer} from "../../lib/server/smtp";
import {paymentProvider, hasValidOrderAmount} from "../../lib/server/payments";
import {POST as contactPost} from "../../app/api/contact/route";
import {POST as quotePost} from "../../app/api/quote/route";
import {invoiceService} from "../../lib/server/invoices";

let orders: typeof import("../../lib/server/orders");
let orderPost: typeof import("../../app/api/orders/route").POST;
let paymentPost: typeof import("../../app/api/payments/create/route").POST;
let webhookPost: typeof import("../../app/api/payments/webhook/route").POST;
let invoiceGet: typeof import("../../app/api/orders/[reference]/invoice/route").GET;
const testEnvironment = {NODE_ENV: "test", ORDER_STORAGE_DIR: "", ORDER_DATABASE_URL: "",
  NOTIFICATION_PROVIDER: "", INVOICE_MODE: "preview", INVOICE_PAYMENT_DAYS: "3"};
const previousEnvironment = Object.keys(testEnvironment).map(key => [key, process.env[key]] as const);

before(async () => {
  // The order module chooses its repository at import time. Tests use its in-memory repository.
  Object.assign(process.env, testEnvironment);
  orders = await import("../../lib/server/orders");
  orderPost = (await import("../../app/api/orders/route")).POST;
  paymentPost = (await import("../../app/api/payments/create/route")).POST;
  webhookPost = (await import("../../app/api/payments/webhook/route")).POST;
  invoiceGet = (await import("../../app/api/orders/[reference]/invoice/route")).GET;
});

after(() => {
  for (const [key, value] of previousEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const contact = {name: "Анна", email: "audit@example.invalid", phone: "+79000000000", message: "Тестовая заявка", consent: true};
const quote = {...contact, name: " Анна-Мария ", email: "AUDIT@example.invalid", message: "Арматура рифлёная А500С\nДлина: 100 м"};
const order = () => ({consent: true, items: [{productId: "rozmet-2235", quantity: 2}],
  customer: {type: "INDIVIDUAL" as const, fullName: "Анна", email: "audit@example.invalid", phone: "+79000000000"},
  delivery: {address: "Тестовый адрес"}, paymentMethod: "INVOICE" as "INVOICE" | "CARD"});
const request = (body: unknown) => new Request("http://localhost/api/test", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});

test("stream boundary handles valid, empty, malformed, declared oversized and chunked oversized JSON", async () => {
  assert.deepEqual(await readJsonBody(request({hello: "мир"})), {ok: true, value: {hello: "мир"}});
  for (const [input, status] of [
    [new Request("http://localhost", {method: "POST"}), 400],
    [new Request("http://localhost", {method: "POST", body: "{"}), 400],
    [new Request("http://localhost", {method: "POST", headers: {"content-length": "1000000"}, body: "{}"}), 413],
    [request({message: "я".repeat(35_000)}), 413],
  ] as const) {
    const result = await readJsonBody(input);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.response.status, status);
  }
});

test("order schema rejects missing consent, duplicate IDs, invalid contact and broken measurements", () => {
  assert.ok(parseCreateOrderInput(order()));
  for (const value of [null, {...order(), consent: false}, {...order(), consent: undefined}, {...order(), items: []},
    {...order(), items: [order().items[0], order().items[0]]}, {...order(), customer: {...order().customer, phone: "(((((((((("}},
    {...order(), items: [{productId: "rozmet-2235", quantity: Infinity}]},
    {...order(), items: [{productId: "rozmet-2235", quantity: 1, measurement: {inputMode: "wrong", meters: 1, weightTons: 1}}]}]) {
    assert.equal(parseCreateOrderInput(value), null);
  }
  assert.equal(orders.createTrustedOrder({...order(), consent: false}), null);
  assert.equal(hasValidOrderAmount({items: [], totalAmount: 0} as never), false);
});

test("contact and quote return 503 without a notification provider", async ({mock}) => {
  const send = mock.method(smtpMailer, "send", async () => {});
  for (const post of [contactPost, quotePost]) {
    const response = await post(request(contact));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  }
  assert.equal(send.mock.calls.length, 0);
});

test("contact validates input and ignores the honeypot before notifying", async ({mock}) => {
  const sent = mock.method(notificationService, "sendContactRequest", async () => {});
  assert.equal((await contactPost(request({...contact, consent: false}))).status, 400);
  assert.equal((await contactPost(request({...contact, phone: "letters1234567890"}))).status, 400);
  for (const fields of [{name: "12345"}, {email: "a..b@example.invalid"}, {phone: "+7)900(0000000"}]) {
    assert.equal((await contactPost(request({...contact, ...fields}))).status, 400);
  }
  assert.equal((await contactPost(new Request("http://localhost", {method: "POST", body: "not-json"}))).status, 400);
  assert.equal((await contactPost(request({...contact, website: "spam.invalid"}))).status, 200);
  assert.equal(sent.mock.calls.length, 0);

  const accepted = await contactPost(request(contact));
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), {ok: true});
  assert.equal(sent.mock.calls.length, 1);
});

test("order rejects invalid contact fields and zero-priced lines before saving, and strips hidden company details", async ({mock}) => {
  const original = order();
  const company = {type: "COMPANY", companyName: "ООО Тест", taxNumber: "1234567894", legalAddress: "Тестовый адрес"};
  assert.ok(parseCreateOrderInput({...original, customer: {...original.customer, ...company}}));
  const save = mock.method(orders.orderRepository, "save", async () => {});
  const notify = mock.method(notificationService, "sendOrderNotification", async () => {});
  const smallQuantity = {...original.items[0], quantity: 0.000001};
  for (const invalid of [
    {...original, items: [smallQuantity]},
    {...original, items: [...original.items, {...smallQuantity, productId: "rozmet-2209"}]},
    ...[{fullName: "12345"}, {email: "audit@-example.invalid"}, {phone: "+7)900(0000000"}]
      .map(fields => ({...original, customer: {...original.customer, ...fields}})),
    ...["abc", "1234567890", "12345678940"].map(taxNumber =>
      ({...original, customer: {...original.customer, ...company, taxNumber}})),
  ]) assert.equal((await orderPost(request(invalid))).status, 400);
  assert.equal(save.mock.calls.length, 0);
  assert.equal(notify.mock.calls.length, 0);

  const response = await orderPost(request({...original, customer: {...company, ...original.customer}}));
  assert.equal(response.status, 201);
  assert.deepEqual(save.mock.calls[0].arguments[0]?.customer, original.customer);
});

test("quote reports invalid fields, ignores the honeypot and sends the normalized message", async ({mock}) => {
  const sent = mock.method(notificationService, "sendQuoteRequest", async () => {});
  const rejected = await quotePost(request({...quote, phone: "+7911", message: "а".repeat(2001), consent: false}));
  assert.equal(rejected.status, 400);
  const errors = await rejected.json();
  assert.equal(errors.ok, false);
  assert.equal(errors.fieldErrors.phone, "Неверный формат");
  assert.match(errors.fieldErrors.message, /2000/);
  assert.ok(errors.fieldErrors.consent);
  assert.equal((await quotePost(new Request("http://localhost", {method: "POST", body: "not-json"}))).status, 400);
  assert.equal((await quotePost(request({...quote, website: "spam.invalid"}))).status, 200);
  assert.equal(sent.mock.calls.length, 0);

  const accepted = await quotePost(request(quote));
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), {ok: true});
  assert.equal(sent.mock.calls.length, 1);
  const payload = sent.mock.calls[0].arguments[0];
  assert.ok(payload);
  assert.equal(payload.name, "Анна-Мария");
  assert.equal(payload.email, "audit@example.invalid");
  assert.equal(payload.message, quote.message);
});

test("order endpoint saves a PDF using current prices; mail failure preserves the accepted order and download", async ({mock}) => {
  assert.equal((await orderPost(request({...order(), consent: false}))).status, 400);
  assert.equal((await orderPost(request({...order(), items: [{productId: "unknown", quantity: 1}]}))).status, 400);
  const failed = await orderPost(request(order()));
  assert.equal(failed.status, 201);
  const failedResult = await failed.json();
  assert.equal(failedResult.order.invoice.emailStatus, "FAILED");
  const saved = await orders.orderRepository.findByReference(failedResult.order.reference);
  assert.equal(saved?.invoice?.emailStatus, "FAILED");
  assert.ok(saved?.invoice?.pdfBase64);
  const context = {params: Promise.resolve({reference: failedResult.order.reference})};
  const download = () => invoiceGet(new Request("http://localhost/api/invoice", {
    headers: {authorization: `Bearer ${failedResult.order.invoice.downloadToken}`},
  }), context);
  const first = await download();
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("content-type"), "application/pdf");
  assert.match(first.headers.get("cache-control")!, /no-store/);
  const bytes = Buffer.from(await first.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.deepEqual(Buffer.from(await (await download()).arrayBuffer()), bytes);
  for (const token of [undefined, "0".repeat(64), failedResult.order.reference]) {
    assert.equal((await invoiceGet(new Request("http://localhost/api/invoice", {
      headers: token ? {authorization: `Bearer ${token}`} : {},
    }), context)).status, 404);
  }
  const sent = mock.method(notificationService, "sendOrderNotification", async () => {});
  const response = await orderPost(request(order()));
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.order.totalAmount, 1070);
  assert.equal(result.order.invoice.emailStatus, "SENT");
  assert.equal("pdfBase64" in result.order.invoice, false);
  assert.equal("accessTokenHash" in result.order.invoice, false);
  assert.equal(sent.mock.calls.length, 1);
});

test("PDF or storage failure rejects before sending mail; saved orders survive a mail-status write failure", async ({mock}) => {
  const {orderRepository} = orders;
  const sent = mock.method(notificationService, "sendOrderNotification", async () => {});
  const brokenPdf = mock.method(invoiceService, "create", async () => {throw new Error("PDF failure");});
  assert.equal((await orderPost(request(order()))).status, 503);
  assert.equal(sent.mock.calls.length, 0);
  brokenPdf.mock.restore();
  const brokenStorage = mock.method(orderRepository, "save", async () => {throw new Error("Disk full");});
  assert.equal((await orderPost(request(order()))).status, 503);
  assert.equal(sent.mock.calls.length, 0);
  brokenStorage.mock.restore();
  mock.method(orderRepository, "updateInvoiceEmailStatus", async () => {throw new Error("Disk full");});
  const accepted = await orderPost(request(order()));
  assert.equal(accepted.status, 201);
  assert.equal(sent.mock.calls.length, 1);
  const {order: result} = await accepted.json();
  const saved = await orderRepository.findByReference(result.reference);
  assert.ok(saved?.invoice?.pdfBase64);
  assert.equal(saved.invoice.emailStatus, "PENDING");
});

test("payment and webhook delegate to providers; duplicate verified events update the order once", async ({mock}) => {
  const {createTrustedOrder, orderRepository} = orders;
  assert.equal((await paymentPost(request({orderReference: "broken"}))).status, 400);
  assert.equal((await paymentPost(request({orderReference: "MS-000000000000"}))).status, 404);
  const accepted = createTrustedOrder({...order(), paymentMethod: "CARD"})!;
  await orderRepository.save(accepted);
  assert.equal((await paymentPost(request({orderReference: accepted.reference}))).status, 503);
  mock.method(paymentProvider, "createPayment", async () => ({paymentId: "test", redirectUrl: "https://pay.example.invalid/session"}));
  assert.equal((await paymentPost(request({orderReference: accepted.reference}))).status, 200);
  assert.equal((await webhookPost(request({forged: true}))).status, 401);
  mock.method(paymentProvider, "verifyWebhook", async () => ({eventId: "unit-event-1", orderReference: accepted.reference, status: "PAID"}));
  const update = mock.method(orderRepository, "updatePaymentStatus", orderRepository.updatePaymentStatus.bind(orderRepository));
  for (let repeat = 0; repeat < 2; repeat++) assert.equal((await webhookPost(request({signed: true}))).status, 204);
  assert.equal(update.mock.calls.length, 1);
  assert.equal((await orderRepository.findByReference(accepted.reference))?.paymentStatus, "PAID");
});
