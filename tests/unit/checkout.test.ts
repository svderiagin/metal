import test, {afterEach, mock} from "node:test";
import assert from "node:assert/strict";
import {isCheckoutFormValid, createOrderInput} from "../../lib/checkout";
import {createOrder, createPayment, isPaymentRedirect} from "../../lib/checkoutClient";
import {parseOrderConfirmation, readOrderConfirmation, rememberOrderConfirmation} from "../../lib/orderConfirmation";
import {isValidPhone, isValidEmail} from "../../lib/validation";
import type {CheckoutFormData} from "../../types/order";

afterEach(() => mock.restoreAll());
const form = (): CheckoutFormData => ({customerType: "INDIVIDUAL", fullName: "Анна Тестовая", email: "audit@example.invalid",
  phone: "+79000000000", deliveryAddress: "Тестовый адрес", companyName: "", taxNumber: "", legalAddress: "",
  comment: "", paymentMethod: "INVOICE", consentAccepted: true});
const reference = "MS-A1B2C3D4E5F6";

test("checkout validates consent, contacts, company requirements and server field limits", () => {
  assert.equal(isCheckoutFormValid(form()), true);
  for (const changed of [{consentAccepted: false}, {fullName: " "}, {email: "a@@b.ru"}, {phone: "abcdefghij"},
    {deliveryAddress: ""}, {comment: "x".repeat(1001)}, {customerType: "COMPANY" as const}]) {
    assert.equal(isCheckoutFormValid({...form(), ...changed}), false);
  }
  assert.equal(isCheckoutFormValid({...form(), customerType: "COMPANY", companyName: "Тест", taxNumber: "1234567890", legalAddress: "Адрес"}), true);
  assert.equal(isValidPhone("(((((((((("), false);
  assert.equal(isValidPhone("+7 (900) 000-00-00"), true);
  assert.equal(isValidPhone("call 79000000000"), false);
  assert.equal(isValidEmail(" a@example.invalid "), true);
  const input = createOrderInput({...form(), fullName: " Анна ", email: " AUDIT@EXAMPLE.INVALID "}, [{productId: "test", quantity: 1}]);
  assert.equal(input.customer.email, "audit@example.invalid");
  assert.equal(input.customer.fullName, "Анна");
  assert.equal(input.consent, true);
});

test("order HTTP client requires successful status, success flag and a valid receipt contract", async () => {
  const input = createOrderInput(form(), [{productId: "test", quantity: 1}]);
  for (const [status, result] of [[503, {ok: false, error: "Недоступно"}], [200, {ok: false}],
    [200, {ok: true, order: {reference: "broken"}}]] as const) {
    mock.method(globalThis, "fetch", async () => Response.json(result, {status}));
    await assert.rejects(createOrder(input));
    mock.restoreAll();
  }
  mock.method(globalThis, "fetch", async () => new Response("not JSON", {status: 502}));
  await assert.rejects(createOrder(input), /Не удалось создать заказ/);
  mock.restoreAll();
  const request = mock.method(globalThis, "fetch", async () => Response.json({ok: true, order: {reference, totalAmount: 100, paymentMethod: "INVOICE"}}));
  assert.equal((await createOrder(input)).order.reference, reference);
  assert.equal(request.mock.calls.length, 1);
});

test("payment HTTP client rejects unsafe destinations and preserves the accepted order on failure", async () => {
  for (const url of ["javascript:alert(1)", "http://example.invalid/", "/payment", "https://user:secret@example.invalid", "broken"]) assert.equal(isPaymentRedirect(url), false);
  assert.equal(isPaymentRedirect("https://pay.example.invalid/session"), true);
  mock.method(globalThis, "fetch", async () => Response.json({ok: true, redirectUrl: "javascript:alert(1)"}));
  await assert.rejects(createPayment(reference), /корзина не очищена/);
  mock.restoreAll();
  mock.method(globalThis, "fetch", async () => Response.json({ok: true, redirectUrl: "https://pay.example.invalid/session"}));
  assert.equal((await createPayment(reference)).redirectUrl, "https://pay.example.invalid/session");
});

test("receipt parsing rejects corrupt storage and blocked storage retains an accepted order in memory", () => {
  for (const value of [null, [], {}, {orderNumber: {}}, {orderNumber: reference, email: "broken", paymentMethod: "INVOICE"}]) assert.equal(parseOrderConfirmation(value), null);
  const confirmation = {orderNumber: reference, paymentMethod: "INVOICE" as const, email: "audit@example.invalid", paymentPending: false};
  const blocked = (): Storage => {throw new Error("storage blocked");};
  assert.doesNotThrow(() => rememberOrderConfirmation(confirmation, blocked));
  assert.deepEqual(readOrderConfirmation(blocked), confirmation);
  let saved = "";
  const storage = () => ({getItem: () => saved, setItem: (_key: string, value: string) => {saved = value;}});
  rememberOrderConfirmation(confirmation, storage);
  assert.deepEqual(readOrderConfirmation(storage), confirmation);
  saved = JSON.stringify({orderNumber: "forged"});
  assert.equal(readOrderConfirmation(storage), null);
});
