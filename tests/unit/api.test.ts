import test, {afterEach, mock} from "node:test";
import assert from "node:assert/strict";
import {readJsonBody} from "../../lib/server/request";
import {parseCreateOrderInput, parseContactRequest, parseQuoteRequest} from "../../lib/server/validation";
import {createTrustedOrder, orderRepository} from "../../lib/server/orders";
import {notificationService} from "../../lib/server/notifications";
import {paymentProvider, hasValidOrderAmount} from "../../lib/server/payments";
import {POST as contactPost} from "../../app/api/contact/route";
import {POST as quotePost} from "../../app/api/quote/route";
import {POST as orderPost} from "../../app/api/orders/route";
import {POST as paymentPost} from "../../app/api/payments/create/route";
import {POST as webhookPost} from "../../app/api/payments/webhook/route";

afterEach(() => mock.restoreAll());
const contact = {name: "Анна", email: "audit@example.invalid", phone: "+79000000000", message: "Тестовая заявка", consent: true};
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
  assert.equal(parseContactRequest({...contact, phone: "letters1234567890"}), null);
  assert.equal(parseQuoteRequest({...contact, consent: false}), null);
  assert.equal(createTrustedOrder({...order(), consent: false}), null);
  assert.equal(hasValidOrderAmount({items: [], totalAmount: 0} as never), false);
});

test("contact and quote routes reject invalid input, honor honeypots and fail honestly without providers", async () => {
  for (const post of [contactPost, quotePost]) {
    assert.equal((await post(request({...contact, consent: false}))).status, 400);
    assert.equal((await post(request({...contact, website: "spam.invalid"}))).status, 200);
    assert.equal((await post(request(contact))).status, 503);
    assert.equal((await post(new Request("http://localhost", {method: "POST", body: "not-json"}))).status, 400);
  }
  const sent = mock.method(notificationService, "sendContactRequest", async () => {});
  assert.equal((await contactPost(request(contact))).status, 200);
  assert.equal(sent.mock.calls.length, 1);
  mock.method(notificationService, "sendQuoteRequest", async () => {});
  assert.equal((await quotePost(request(contact))).status, 200);
});

test("order endpoint uses current catalog prices and does not report success when delivery fails", async () => {
  assert.equal((await orderPost(request({...order(), consent: false}))).status, 400);
  assert.equal((await orderPost(request({...order(), items: [{productId: "unknown", quantity: 1}]}))).status, 400);
  assert.equal((await orderPost(request(order()))).status, 503);
  const sent = mock.method(notificationService, "sendOrderNotification", async () => {});
  const response = await orderPost(request(order()));
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.order.totalAmount, 1070);
  assert.equal(sent.mock.calls.length, 1);
});

test("payment and webhook delegate to providers; duplicate verified events update the order once", async () => {
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
