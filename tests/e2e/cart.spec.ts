import type {Locator, Page} from "@playwright/test";
import {test, expect, fillCheckout, openProduct, samples, visibleProduct} from "../browser";
import {getProductVariantById} from "../../lib/catalog";
import type {CartItem} from "../../types/cart";
import type {ProductVariant} from "../../types/product";

const cartKey = "metal-store-cart-v1";

function product(id: string): ProductVariant {
  const value = getProductVariantById(id);
  if (!value) throw new Error(`Missing public catalog fixture: ${id}`);
  return value;
}

const rebar6 = product("rebar-a500c-6-coil");
const rebar10 = product("rebar-a500c-10-bar");
const rebar12 = product("rebar-a500c-12-bar");
const vgp = product("local-258");
const heavyBeam = product("local-115970");
const rangePipe = product("profile-pipe-square-80x80x2");

function measuredItem(variant: ProductVariant, meters: number): CartItem {
  return {productId: variant.id, quantity: meters, measurement: {
    inputMode: "meter", meters, weightTons: meters * variant.weightPerMeterKg! / 1000,
    pricePerTon: 0, estimatedTotal: 0,
  }};
}

function measuredTonneItem(variant: ProductVariant, tons: number): CartItem {
  return {productId: variant.id, quantity: tons, measurement: {
    inputMode: "ton", meters: tons * 1000 / variant.weightPerMeterKg!, weightTons: tons,
    pricePerTon: 0, estimatedTotal: 0,
  }};
}

async function seedItems(page: Page, items: CartItem[]) {
  // A fresh context owns this storage. Reload must preserve subsequent edits and an empty cart.
  await page.addInitScript(({key, items}) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(items));
  }, {key: cartKey, items});
}

async function storedItems(page: Page): Promise<CartItem[]> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "[]"), cartKey);
}

async function storedItem(page: Page, id: string) {
  return (await storedItems(page)).find(item => item.productId === id);
}

function cartRow(page: Page, id: string) {
  return page.locator(`[data-cart-row="${id}"]`);
}

function metersInput(row: Locator) {
  return row.getByRole("textbox", {name: /^Длина /});
}

function tonsInput(row: Locator) {
  return row.getByRole("textbox", {name: /^Масса /});
}

function numberFromText(text: string) {
  return Number(text.replace(/[\s\u202f]/gu, "").replace(",", "."));
}

async function fillQuantity(input: Locator, value: string) {
  // Focus exposes the exact editable value before Playwright selects the text to replace.
  await input.focus();
  await input.fill(value);
}

async function expectNumber(input: Locator, expected: number) {
  await expect.poll(async () => numberFromText(await input.inputValue())).toBeCloseTo(expected, 10);
}

async function openCart(page: Page, items: CartItem[]) {
  await seedItems(page, items);
  await page.goto("/cart");
  await expect(page.getByRole("heading", {name: "Корзина", exact: true, level: 1})).toBeVisible();
  for (const item of items) await expect(cartRow(page, item.productId)).toBeVisible();
}

async function expectMeasurement(page: Page, id: string, meters: number, tons: number, mode: "meter" | "ton") {
  await expect.poll(async () => {
    const item = await storedItem(page, id);
    return {mode: item?.measurement?.inputMode, meters: item?.measurement?.meters,
      tons: item?.measurement?.weightTons, quantity: item?.quantity};
  }).toEqual({mode, meters: expect.closeTo(meters, 10), tons: expect.closeTo(tons, 12),
    quantity: expect.closeTo(mode === "meter" ? meters : tons, 10)});
}

async function pasteText(input: Locator, text: string) {
  // Each test owns its clipboard payload; parallel browser contexts cannot overwrite it.
  await input.evaluate((element, text) => {
    const field = element as HTMLInputElement;
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    if (!field.dispatchEvent(new ClipboardEvent("paste", {bubbles: true, cancelable: true, clipboardData}))) return;
    // Untrusted paste events have no native insertion. Reproduce that default only when the app allows it.
    const start = field.selectionStart ?? field.value.length, end = field.selectionEnd ?? start;
    const next = field.value.slice(0, start) + text + field.value.slice(end);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, next);
    field.setSelectionRange(start + text.length, start + text.length);
    field.dispatchEvent(new InputEvent("input", {bubbles: true, inputType: "insertFromPaste", data: text}));
  }, text);
}

async function compositionInput(input: Locator, text: string) {
  await input.evaluate((element, text) => {
    const field = element as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, text);
    field.dispatchEvent(new InputEvent("input", {
      bubbles: true, inputType: "insertCompositionText", data: text, isComposing: true,
    }));
  }, text);
}

test("strict drafts reject letters, preserve decimals and constrain zeros and overflow before commit", async ({page}) => {
  await openCart(page, [{productId: samples.shveller.id, quantity: 3}]);
  const input = metersInput(cartRow(page, samples.shveller.id));
  await input.fill("");
  await input.pressSequentially("0000000");
  await expect(input).toHaveValue("0");
  await input.pressSequentially("ю123");
  await expect(input).toHaveValue("123");
  expect((await storedItem(page, samples.shveller.id))!.quantity).toBe(3);
  await input.fill("0ю123");
  await expect(input).toHaveValue("123");
  await input.fill("1,2");
  await input.pressSequentially(".3");
  await expect(input).toHaveValue("1,23");
  await input.press("Enter");
  await expect.poll(async () => (await storedItem(page, samples.shveller.id))!.quantity).toBe(1.23);
  await input.fill("9".repeat(400));
  await expect(input).toHaveValue("999");
  expect((await storedItem(page, samples.shveller.id))!.quantity).toBe(1.23);
  await input.press("Enter");
  await expect.poll(async () => (await storedItem(page, samples.shveller.id))!.quantity).toBe(999);
});

test("paste accepts locale grouping and rejects ambiguous numbers without losing the selected value", async ({page}) => {
  await openCart(page, [measuredItem(rebar6, 12.5)]);
  const input = metersInput(cartRow(page, rebar6.id));
  for (const separator of [" ", "\u00a0", "\u202f", "\u2009"]) {
    await input.focus();
    await input.press("ControlOrMeta+A");
    await pasteText(input, `1${separator}234,50`);
    await expect(input).toHaveValue("1234,50");
  }
  await input.press("Enter");
  await expectMeasurement(page, rebar6.id, 1234.5, 0.274059, "meter");
  for (const text of ["1,234.56", "1 23,4", "12\n34", "12\t34", "5 кг", "0ю123"]) {
    await input.focus();
    await input.press("ControlOrMeta+A");
    await pasteText(input, text);
    await expect(input).toHaveValue("1234,5");
    expect(await input.evaluate(element => {
      const input = element as HTMLInputElement;
      return [input.selectionStart, input.selectionEnd];
    })).toEqual([0, 6]);
  }
  await input.blur();
  await expectMeasurement(page, rebar6.id, 1234.5, 0.274059, "meter");
});

test("native clipboard paste commits the same locale quantity", async ({page}, testInfo) => {
  // Keep one native-clipboard smoke case; all projects exercise isolated paste payloads above.
  test.skip(testInfo.project.name !== "desktop-light", "The OS clipboard is shared across parallel contexts.");
  await openCart(page, [{productId: samples.shveller.id, quantity: 3}]);
  const input = metersInput(cartRow(page, samples.shveller.id));
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("0001,25"));
  await input.focus();
  await input.press("ControlOrMeta+A");
  await input.press("ControlOrMeta+V");
  await expect(input).toHaveValue("1,25");
  await input.press("Enter");
  await expect.poll(async () => (await storedItem(page, samples.shveller.id))!.quantity).toBe(1.25);
});

test("rejected replacements restore both selection endpoints and an invalid drop leaves the draft intact", async ({page}) => {
  await openCart(page, [{productId: samples.shveller.id, quantity: 3}]);
  const input = metersInput(cartRow(page, samples.shveller.id));
  await input.fill("123,45");
  await input.evaluate(element => (element as HTMLInputElement).setSelectionRange(1, 3, "backward"));
  await input.pressSequentially("ю");
  await expect(input).toHaveValue("123,45");
  expect(await input.evaluate(element => {
    const field = element as HTMLInputElement;
    return [field.selectionStart, field.selectionEnd, field.selectionDirection];
  })).toEqual([1, 3, "backward"]);
  const allowedDrop = await input.evaluate(element => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", "0ю123");
    return element.dispatchEvent(new DragEvent("drop", {bubbles: true, cancelable: true, dataTransfer}));
  });
  expect(allowedDrop).toBe(false);
  await expect(input).toHaveValue("123,45");
  await input.press("Escape");
  await expect(input).toHaveValue("3");
  expect((await storedItem(page, samples.shveller.id))!.quantity).toBe(3);
});

test("composition is transient, rejected as a whole and committed after a blur only when finalized", async ({page}) => {
  await openCart(page, [{productId: samples.shveller.id, quantity: 3}]);
  const input = metersInput(cartRow(page, samples.shveller.id));
  await input.focus();
  await input.dispatchEvent("compositionstart");
  await compositionInput(input, "0ю123");
  await expect(input).toHaveValue("0ю123");
  expect((await storedItem(page, samples.shveller.id))!.quantity).toBe(3);
  await input.dispatchEvent("compositionend");
  await expect(input).toHaveValue("3");
  await input.dispatchEvent("compositionstart");
  await compositionInput(input, "0005");
  await input.blur();
  expect((await storedItem(page, samples.shveller.id))!.quantity).toBe(3);
  await input.dispatchEvent("compositionend");
  await expect.poll(async () => (await storedItem(page, samples.shveller.id))!.quantity).toBe(5);
  await expect(input).toHaveValue("5");
});

test("a rejected composition ending after blur cannot silently clamp a historical oversized measurement", async ({page}) => {
  await openCart(page, [measuredItem(rebar6, 6000000)]);
  const row = cartRow(page, rebar6.id), input = metersInput(row);
  const before = await storedItems(page);
  await expect(row.getByRole("alert")).toContainText("Объём превышает");
  await input.focus();
  await expectNumber(input, 6000000);
  await input.dispatchEvent("compositionstart");
  await compositionInput(input, "6000000あ");
  await expect(input).toHaveValue("6000000あ");
  await input.blur();
  expect(await storedItems(page)).toEqual(before);
  await input.dispatchEvent("compositionend");
  await expectNumber(input, 6000000);
  await expect(input).not.toBeFocused();
  await expect(row.getByRole("alert")).toContainText("Объём превышает");
  await expect(page.getByRole("main").getByRole("link", {name: "Перейти к оформлению", exact: true})).toHaveCount(0);
  expect(await storedItems(page)).toEqual(before);
  await input.focus();
  await input.blur();
  await expectNumber(input, 6000000);
  expect(await storedItems(page)).toEqual(before);
});

test("metres and tonnes share exact state and focusing the other field cannot restore an old value", async ({page}) => {
  await openCart(page, [{productId: rebar6.id, quantity: 0.01}]);
  const row = cartRow(page, rebar6.id), meters = metersInput(row), tons = tonsInput(row);
  const initial = await storedItems(page);
  for (const input of [meters, tons]) {await input.focus(); await input.blur();}
  expect(await storedItems(page)).toEqual(initial);
  expect((await storedItem(page, rebar6.id))!.measurement).toBeUndefined();
  await fillQuantity(meters, "12,5");
  await meters.press("Enter");
  await expectMeasurement(page, rebar6.id, 12.5, 0.002775, "meter");
  await expect(row.getByText(/203,41\s*₽/)).toBeVisible();
  await fillQuantity(meters, "100,25");
  await tons.click();
  await expectNumber(tons, 0.0222555);
  await tons.blur();
  await expectMeasurement(page, rebar6.id, 100.25, 0.0222555, "meter");
  await fillQuantity(tons, "0,01");
  await tons.press("Enter");
  await expectMeasurement(page, rebar6.id, 45.04504504504504, 0.01, "ton");
  await fillQuantity(meters, "0,01");
  await meters.press("Enter");
  await expectMeasurement(page, rebar6.id, 0.01, 0.00000222, "meter");
  await expectNumber(tons, 0.00000222);
  await expect(row.getByText(/0,16\s*₽/)).toBeVisible();
});

for (const [variant, maximumMeters, maximumTons, minimumMeters, minimumTons] of [
  [rebar6, 4500000, 999, 0.01, 0.00000222],
  [rebar12, 1125000, 999, 0.01, 0.00000888],
  [vgp, 780468, 998.99904, 6, 0.00768],
] as const) {
  test(`${variant.id}: both units have the same physical minimum and exact maximum`, async ({page}) => {
    await openCart(page, [measuredItem(variant, 12)]);
    const row = cartRow(page, variant.id), meters = metersInput(row), tons = tonsInput(row);
    await fillQuantity(meters, String(maximumMeters + 1));
    await expectNumber(meters, maximumMeters);
    expect((await storedItem(page, variant.id))!.measurement!.meters).toBe(12);
    await meters.press("Enter");
    await expectMeasurement(page, variant.id, maximumMeters, maximumTons, "meter");
    await expectNumber(tons, maximumTons);
    for (const name of [/^Длина /, /^Масса /]) {
      await expect(row.getByRole("group", {name}).getByRole("button", {name: "Увеличить количество", exact: true})).toBeDisabled();
    }
    // Change the physical volume first so the tonne maximum must persist a fresh state.
    await fillQuantity(meters, String(minimumMeters).replace(".", ","));
    await meters.press("Enter");
    await expectMeasurement(page, variant.id, minimumMeters, minimumTons, "meter");
    await fillQuantity(tons, String(maximumTons).replace(".", ","));
    await tons.press("Enter");
    await expectMeasurement(page, variant.id, maximumMeters, maximumTons, "ton");
    await expectNumber(meters, maximumMeters);
    const capped = await storedItems(page);
    for (const input of [meters, tons]) {await input.focus(); await input.blur();}
    expect(await storedItems(page)).toEqual(capped);
    await fillQuantity(tons, "1000");
    await expectNumber(tons, maximumTons);
    await tons.press("Enter");
    await expectNumber(meters, maximumMeters);
    await fillQuantity(tons, "0");
    await tons.press("Enter");
    await expectMeasurement(page, variant.id, minimumMeters, minimumTons, "ton");
    await expectNumber(meters, minimumMeters);
    await expectNumber(tons, minimumTons);
  });
}

test("a fractional metre ceiling preserves the full 999 tonnes through commit and untouched focus changes", async ({page}) => {
  const maximumMeters = 999000 / 0.617;
  await openCart(page, [measuredItem(rebar10, 12)]);
  const row = cartRow(page, rebar10.id), meters = metersInput(row), tons = tonsInput(row);
  await fillQuantity(meters, String(maximumMeters + 1));
  await expectNumber(meters, maximumMeters);
  expect((await storedItem(page, rebar10.id))!.measurement!.meters).toBe(12);
  await meters.press("Enter");
  await expectMeasurement(page, rebar10.id, maximumMeters, 999, "meter");
  await expectNumber(meters, Number(maximumMeters.toPrecision(8)));
  await expectNumber(tons, 999);
  await expect(row.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("link", {name: "Перейти к оформлению", exact: true})).toBeVisible();
  const capped = await storedItems(page);
  await meters.focus();
  await expectNumber(meters, maximumMeters);
  await meters.blur();
  await tons.focus();
  await tons.blur();
  expect(await storedItems(page)).toEqual(capped);
  await expectMeasurement(page, rebar10.id, maximumMeters, 999, "meter");
  await expect(row.getByRole("alert")).toHaveCount(0);
});

test("VGP rounds either input to whole pipes and steps by one pipe", async ({page}) => {
  await openCart(page, [measuredItem(vgp, 6)]);
  const row = cartRow(page, vgp.id), meters = metersInput(row), tons = tonsInput(row);
  await fillQuantity(meters, "7");
  await meters.press("Enter");
  await expectMeasurement(page, vgp.id, 12, 0.01536, "meter");
  await fillQuantity(tons, "0,02");
  await tons.press("Enter");
  await expectMeasurement(page, vgp.id, 18, 0.02304, "ton");
  await row.getByRole("group", {name: /^Масса /}).getByRole("button", {name: "Увеличить количество", exact: true}).click();
  await expectMeasurement(page, vgp.id, 24, 0.03072, "ton");
});

for (const legacy of [true, false]) {
  test(`an oversized ${legacy ? "legacy tonne" : "measured"} line remains visible until a valid edit`, async ({page}) => {
    const item: CartItem = legacy ? {productId: rebar6.id, quantity: 1000} : measuredTonneItem(rebar6, 1000);
    await openCart(page, [item]);
    const row = cartRow(page, rebar6.id), meters = metersInput(row), tons = tonsInput(row);
    await expect(row.getByRole("alert")).toContainText("Объём превышает");
    await expect(page.getByRole("main").getByRole("link", {name: "Перейти к оформлению", exact: true})).toHaveCount(0);
    const before = await storedItems(page);
    for (const input of [meters, tons]) {
      await input.focus(); await input.blur();
      await input.focus(); await input.pressSequentially("ю"); await input.blur();
    }
    expect(await storedItems(page)).toEqual(before);
    await fillQuantity(meters, "1000");
    await meters.press("Enter");
    await expectMeasurement(page, rebar6.id, 1000, 0.222, "meter");
    await expect(row.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", {name: "Перейти к оформлению", exact: true})).toBeVisible();
  });
}

test("a valid legacy heavy-beam tonne order submits only canonical quantities and survives an API refusal", async ({page}) => {
  const items: CartItem[] = [{productId: heavyBeam.id, quantity: 900}];
  const expectedMeters = 900 * 1000 / heavyBeam.weightPerMeterKg!;
  await openCart(page, items);
  const row = cartRow(page, heavyBeam.id);
  // Resting measured fields show eight significant digits; focus exposes the exact editable value.
  await expectNumber(metersInput(row), Number(expectedMeters.toPrecision(8)));
  await expectNumber(tonsInput(row), 900);
  await expect(row.getByRole("alert")).toHaveCount(0);
  await metersInput(row).focus();
  await expectNumber(metersInput(row), expectedMeters);
  await metersInput(row).blur();
  await tonsInput(row).focus();
  await expectNumber(tonsInput(row), 900);
  await tonsInput(row).blur();
  expect(await storedItems(page)).toEqual(items);

  let submissions = 0;
  await page.route("**/api/orders", async route => {
    submissions++;
    await route.fulfill({status: 503, json: {ok: false, error: "Тестовый отказ сервиса"}});
  });
  await page.getByRole("main").getByRole("link", {name: "Перейти к оформлению", exact: true}).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await fillCheckout(page);
  const responsePromise = page.waitForResponse(response => response.url().endsWith("/api/orders")
    && response.request().method() === "POST");
  await page.getByRole("button", {name: /^Создать заказ на/}).click();
  const response = await responsePromise;
  expect(response.status()).toBe(503);
  const body = response.request().postDataJSON();
  // Exact objects reject cached prices, derived totals and presentation fields at either level.
  expect(body.items).toEqual([{productId: heavyBeam.id, quantity: 900, measurement: {
    inputMode: "ton", meters: expect.closeTo(expectedMeters, 10), weightTons: 900,
  }}]);
  expect(body.consent).toBe(true);
  expect(body.paymentMethod).toBe("INVOICE");
  await expect(page.locator("form").getByRole("alert")).toContainText("Тестовый отказ сервиса");
  await expect(page.locator("form").getByRole("alert")).toContainText("Корзина и введённые данные сохранены");
  await expect(page.getByLabel("ФИО *", {exact: true})).toHaveValue("Анна Тестовая");
  expect(submissions).toBe(1);
  expect(await storedItems(page)).toEqual(items);

  await page.goto("/cart");
  await expectNumber(metersInput(cartRow(page, heavyBeam.id)), Number(expectedMeters.toPrecision(8)));
  await expectNumber(tonsInput(cartRow(page, heavyBeam.id)), 900);
  await expect(cartRow(page, heavyBeam.id).getByRole("alert")).toHaveCount(0);
  expect(await storedItems(page)).toEqual(items);
});

test("checkout preview keeps tiny measured quantities and whole-pipe weight visible without changing the order", async ({page}) => {
  await openCart(page, [measuredItem(rebar6, 0.01), measuredItem(vgp, 18)]);
  const before = await storedItems(page);
  await page.getByRole("main").getByRole("link", {name: "Перейти к оформлению", exact: true}).click();
  await expect(page).toHaveURL(/\/checkout$/);
  const preview = page.getByRole("complementary");
  await expect(preview.getByRole("heading", {name: "Ваш заказ", exact: true})).toBeVisible();
  const rebarLine = preview.getByRole("listitem").filter({hasText: rebar6.name});
  const vgpLine = preview.getByRole("listitem").filter({hasText: vgp.name});
  await expect(rebarLine).toContainText(/0,01\s*м\s*\/\s*0,00000222\s*т/u);
  await expect(rebarLine).toContainText(/0,16\s*₽/u);
  await expect(vgpLine).toContainText(/18\s*м\s*\/\s*0,02304\s*т/u);
  await expect(vgpLine).toContainText(/1\s*235,87\s*₽/u);
  expect(await storedItems(page)).toEqual(before);
});

test("format-only changes and decimal steps preserve exact stored fractions", async ({page}) => {
  await openCart(page, [{productId: samples.shveller.id, quantity: 1.234567}, measuredItem(rebar6, 10)]);
  const genericRow = cartRow(page, samples.shveller.id), input = metersInput(genericRow);
  const before = await storedItems(page);
  await input.focus();
  await expect(input).toHaveValue("1,234567");
  await input.press("End");
  await input.pressSequentially("0");
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await input.press("Enter");
  expect(await storedItems(page)).toEqual(before);
  await genericRow.getByRole("button", {name: "Увеличить количество", exact: true}).click();
  await expect.poll(async () => (await storedItem(page, samples.shveller.id))!.quantity).toBe(2.234567);
  const row = cartRow(page, rebar6.id), tons = tonsInput(row);
  await tons.focus();
  await row.getByRole("group", {name: /^Масса /}).getByRole("button", {name: "Увеличить количество", exact: true}).click();
  await expectMeasurement(page, rebar6.id, 14.5045045045045, 0.00322, "ton");
  await expect(tons).toHaveValue("0,00322");
});

test("whole quantities round up, zero cannot delete, and the explicit removal action empties the cart", async ({page}) => {
  const item = samples.shtaketnik;
  await openCart(page, [{productId: item.id, quantity: 3}]);
  const row = cartRow(page, item.id), input = row.getByRole("textbox", {name: /^Количество /});
  await expect(input).toHaveAttribute("inputmode", "numeric");
  await input.fill("2,3");
  expect((await storedItem(page, item.id))!.quantity).toBe(3);
  await input.press("Enter");
  await expectNumber(input, 3);
  await input.fill("0");
  await input.press("Enter");
  await expect.poll(async () => (await storedItem(page, item.id))!.quantity).toBe(1);
  await expect(row).toBeVisible();
  await row.getByRole("button", {name: "Удалить", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Корзина пуста", exact: true})).toBeVisible();
  await expect.poll(() => storedItems(page)).toEqual([]);
});

test("keyboard commit, Escape, accessible groups and +/- remain usable", async ({page}) => {
  await openCart(page, [{productId: samples.shveller.id, quantity: 3}]);
  const row = cartRow(page, samples.shveller.id), input = metersInput(row);
  await expect(input).toHaveAttribute("aria-label", `Длина ${samples.shveller.name}, м`);
  const statusId = await input.getAttribute("aria-describedby");
  expect(statusId).toBeTruthy();
  await expect(page.locator(`[id="${statusId}"]`)).toHaveAttribute("aria-live", "polite");
  const group = row.getByRole("group", {name: `Длина ${samples.shveller.name}, м`, exact: true});
  await input.fill("4");
  await input.press("Escape");
  await expect(input).toHaveValue("3");
  await input.fill("4");
  await input.press("Enter");
  await expect(input).not.toBeFocused();
  await expect.poll(async () => (await storedItem(page, samples.shveller.id))!.quantity).toBe(4);
  await input.focus();
  await input.press("Tab");
  const plus = group.getByRole("button", {name: "Увеличить количество", exact: true});
  await expect(plus).toBeFocused();
  await plus.press("Space");
  await expect.poll(async () => (await storedItem(page, samples.shveller.id))!.quantity).toBe(5);
});

test("reload retains both fields and saved pieces, while quote-only pipe data never invents a price", async ({page}) => {
  const pipeItem: CartItem = {productId: rangePipe.id, quantity: 15, pieceOrder: {pieces: 2, lengthMeters: 7.5}};
  await openCart(page, [measuredItem(rebar6, 12.5), pipeItem]);
  await page.reload();
  const measured = cartRow(page, rebar6.id), pipe = cartRow(page, rangePipe.id);
  await expectNumber(metersInput(measured), 12.5);
  await expectNumber(tonsInput(measured), 0.002775);
  await expect(pipe.getByRole("textbox", {name: /^Количество труб /})).toHaveValue("2");
  await expectNumber(pipe.getByRole("textbox", {name: /^Длина одной трубы /}), 7.5);
  await expect(pipe.getByRole("alert")).toContainText("Цена уточняется");
  await expect(pipe.getByText("Расчёт недоступен", {exact: true})).toBeVisible();
  expect((await storedItem(page, rangePipe.id))!.pieceOrder).toEqual({pieces: 2, lengthMeters: 7.5});
});

test("unknown products remain visible and removable, and clear survives reload", async ({page}) => {
  const unknown = "unavailable-cart-fixture";
  await openCart(page, [{productId: samples.shveller.id, quantity: 3}, {productId: unknown, quantity: 2}]);
  const row = cartRow(page, unknown);
  await expect(row.getByText("Позиция больше не доступна в каталоге", {exact: true})).toBeVisible();
  await expect(row.getByRole("textbox")).toBeDisabled();
  await row.getByRole("button", {name: "Удалить", exact: true}).click();
  await expect(row).toHaveCount(0);
  await expect(cartRow(page, samples.shveller.id)).toBeVisible();
  await page.getByRole("button", {name: "Очистить корзину", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Корзина пуста", exact: true})).toBeVisible();
  await expect.poll(() => storedItems(page)).toEqual([]);
  await page.reload();
  await expect(page.getByRole("heading", {name: "Корзина пуста", exact: true})).toBeVisible();
  expect(await storedItems(page)).toEqual([]);
});

test("unavailable localStorage keeps the in-memory cart editable during client navigation", async ({page}) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", {
    configurable: true, get() {throw new DOMException("Blocked for this isolated test", "SecurityError");},
  }));
  await openProduct(page, samples.shveller);
  const productRow = visibleProduct(page, samples.shveller.id);
  await productRow.getByRole("textbox", {name: /^Количество /}).fill("3");
  await productRow.getByRole("button", {name: "В корзину", exact: true}).click();
  await expect(productRow.getByRole("button", {name: "В корзине", exact: true})).toBeDisabled();
  await page.locator("header").getByRole("link", {name: /Корзина/}).click();
  const row = cartRow(page, samples.shveller.id);
  await expectNumber(metersInput(row), 3);
  await row.getByRole("button", {name: "Увеличить количество", exact: true}).click();
  await expectNumber(metersInput(row), 4);
  await page.getByRole("link", {name: "Продолжить покупки", exact: true}).click();
  await page.locator("header").getByRole("link", {name: /Корзина/}).click();
  await expectNumber(metersInput(cartRow(page, samples.shveller.id)), 4);
  await page.reload();
  await expect(page.getByRole("heading", {name: "Корзина пуста", exact: true})).toBeVisible();
});

for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`high-value cart prices and fields remain readable without overlap at ${width}px`, async ({page, isMobile}, testInfo) => {
    test.skip(isMobile !== (width < 640), "Use mobile projects for narrow widths and desktop projects for wide widths.");
    await page.setViewportSize({width, height: 1000});
    await openCart(page, [measuredTonneItem(heavyBeam, 999), measuredTonneItem(rebar6, 999), {productId: samples.shtaketnik.id, quantity: 999}]);
    await expect(page.locator("[data-cart-row]").getByRole("alert")).toHaveCount(0);
    await page.evaluate(async () => {await document.fonts.ready;});
    await expect(page.locator("html")).toHaveAttribute("data-theme", testInfo.project.name.includes("dark") ? "dark" : "light");
    const geometry = await page.evaluate(() => {
      const issues: string[] = [];
      const right = (box: DOMRect) => box.x + box.width;
      const viewport = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > viewport + 1) issues.push("document overflows horizontally");
      for (const element of document.querySelectorAll<HTMLElement>("[data-cart-amount]")) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
        const box = element.getBoundingClientRect();
        if (rects.some(rect => Math.abs(rect.top - rects[0].top) > 1)) issues.push(`amount wraps: ${element.textContent}`);
        if (getComputedStyle(element).whiteSpace !== "nowrap") issues.push(`amount is not nowrap: ${element.textContent}`);
        if (box.left < -1 || right(box) > viewport + 1) issues.push(`amount outside viewport: ${element.textContent}`);
        const container = element.closest<HTMLElement>("[data-cart-row],aside")?.getBoundingClientRect();
        if (container && (box.left < container.left - 1 || right(box) > right(container) + 1)) {
          issues.push(`amount outside its cart container: ${element.textContent}`);
        }
      }
      for (const row of document.querySelectorAll<HTMLElement>("[data-cart-row]")) {
        const rowBox = row.getBoundingClientRect();
        for (const group of row.querySelectorAll<HTMLElement>('[role="group"]')) {
          const fields = [...group.querySelectorAll<HTMLElement>("button,input")];
          const boxes = fields.map(field => field.getBoundingClientRect());
          boxes.forEach((box, index) => {
            if (box.left < rowBox.left - 1 || right(box) > right(rowBox) + 1) issues.push("quantity control outside its row");
            if (index && boxes[index - 1].right > box.left + 1) issues.push("quantity controls overlap");
            if (fields[index].tagName === "BUTTON" && (box.width < 43.5 || box.height < 43.5)) issues.push("quantity button below 44px");
          });
        }
        const inputs = [...row.querySelectorAll<HTMLInputElement>("[data-cart-input]")];
        for (const input of inputs) {
          if (Number.parseFloat(getComputedStyle(input).fontSize) < 16) issues.push("quantity text below 16px");
          if (input.scrollWidth > input.clientWidth + 1) issues.push(`resting quantity is clipped: ${input.value}`);
        }
        const amounts = [...row.querySelectorAll<HTMLElement>("[data-cart-amount]")];
        const controls = [...row.querySelectorAll<HTMLElement>('[role="group"],button')];
        for (const control of controls) for (const amount of amounts) {
          const a = control.getBoundingClientRect(), b = amount.getBoundingClientRect();
          if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
            && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) issues.push("cart control overlaps a price");
        }
      }
      return {issues, amounts: document.querySelectorAll("[data-cart-amount]").length,
        rows: document.querySelectorAll("[data-cart-row]").length};
    });
    expect(geometry.rows).toBe(3);
    expect(geometry.amounts).toBeGreaterThanOrEqual(4);
    expect(geometry.issues).toEqual([]);
  });
}
