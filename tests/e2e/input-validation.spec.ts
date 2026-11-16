import {test, expect, seedCart, fillCheckout, openProduct, samples, visibleProduct} from "../browser";

test("checkout rejects malformed contact details and INN, and scopes company details to company orders", async ({page}) => {
  await seedCart(page);
  await page.goto("/checkout");
  await fillCheckout(page);
  await expect(page.getByRole("radio", {name: /Банковская карта/})).toBeDisabled();
  const submissions: {customer: Record<string, unknown>}[] = [];
  await page.route("**/api/orders", async route => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({status: 503, json: {ok: false, error: "Тестовый отказ сервиса"}});
  });
  await page.getByRole("radio", {name: "Организация", exact: true}).check();
  const name = page.getByLabel("ФИО *", {exact: true});
  const email = page.getByLabel("Электронная почта *", {exact: true});
  const phone = page.getByLabel("Телефон *", {exact: true});
  const inn = page.getByLabel("ИНН *", {exact: true});
  const submit = page.getByRole("button", {name: /^Создать заказ на/});
  await page.getByLabel("Название компании *", {exact: true}).fill("ООО Тест");
  await page.getByLabel("Юридический адрес *", {exact: true}).fill("Тестовый юридический адрес");
  await name.fill("12345");
  await email.fill("audit@-example.invalid");
  await phone.fill("+7)900(0000000");
  await inn.fill("abc");
  await submit.click();
  for (const field of [name, email, phone, inn]) {
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAttribute("aria-describedby", /error$/);
  }
  await expect(name).toBeFocused();
  expect(submissions).toHaveLength(0);

  await fillCheckout(page);
  await inn.fill("1234567890");
  await submit.click();
  await expect(inn).toBeFocused();
  await expect(inn).toHaveAttribute("aria-invalid", "true");
  expect(submissions).toHaveLength(0);

  await inn.fill("1234567894");
  await submit.click();
  await expect(page.getByRole("alert").filter({hasText: "Тестовый отказ сервиса"})).toBeVisible();
  expect(submissions[0].customer).toMatchObject({type: "COMPANY", taxNumber: "1234567894"});

  await page.getByRole("radio", {name: "Физическое лицо", exact: true}).check();
  await expect(inn).toHaveCount(0);
  const request = page.waitForRequest(req => req.url().endsWith("/api/orders") && req.method() === "POST");
  await submit.click();
  const {customer} = (await request).postDataJSON();
  expect(customer.type).toBe("INDIVIDUAL");
  for (const field of ["taxNumber", "companyName", "legalAddress"]) expect(customer).not.toHaveProperty(field);
});

test("contact form points to invalid fields and accepts a corrected message with an empty optional phone", async ({page}) => {
  await page.goto("/contacts");
  const form = page.getByRole("form", {name: "Связаться с нами"});
  const name = form.getByLabel("Имя *", {exact: true});
  const email = form.getByLabel("Электронная почта *", {exact: true});
  const phone = form.getByLabel("Телефон", {exact: true});
  const submit = form.getByRole("button", {name: "Отправить", exact: true});
  const submissions: {phone: string}[] = [];
  await page.route("**/api/contact", async route => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({status: 200, json: {ok: true}});
  });
  await name.fill("12345");
  await email.fill("a..b@example.invalid");
  await phone.fill("тест");
  await form.getByLabel("Сообщение *", {exact: true}).fill("Проверка формы");
  await form.getByRole("checkbox").check();
  await submit.click();
  for (const field of [name, email, phone]) await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();
  expect(submissions).toHaveLength(0);

  await name.fill("Анна-Мария");
  await email.fill("audit@example.invalid");
  await phone.fill("");
  await submit.click();
  await expect(form.getByRole("status")).toHaveText("Сообщение принято.");
  expect(submissions).toEqual([expect.objectContaining({phone: ""})]);
});

for (const endpoint of ["orders", "contact"] as const) {
  test(`${endpoint} keeps all 16 inserted phone digits and rejects the number before sending`, async ({page, isMobile}) => {
    if (isMobile) await page.setViewportSize({width: 320, height: 844});
    if (endpoint === "orders") {
      await seedCart(page);
      await page.goto("/checkout");
      await fillCheckout(page);
    } else {
      await page.goto("/contacts");
      const form = page.getByRole("form", {name: "Связаться с нами"});
      await form.getByLabel("Имя *", {exact: true}).fill("Анна Тестовая");
      await form.getByLabel("Электронная почта *", {exact: true}).fill("audit@example.invalid");
      await form.getByLabel("Сообщение *", {exact: true}).fill("Проверка телефона");
      await form.getByRole("checkbox").check();
    }
    const phone = page.locator('main [name="phone"]');
    const submit = page.getByRole("button", {name: endpoint === "orders" ? /^Создать заказ на/ : /^Отправить$/});
    let requests = 0;
    await page.route(`**/api/${endpoint}`, async route => {
      requests++;
      await route.fulfill({status: 503, json: {ok: false, error: "Тестовый отказ сервиса"}});
    });

    const overlong = "+7 (900)   123  -  4567 - 89012";
    await phone.fill("");
    await page.keyboard.insertText(overlong);
    await expect(phone).toHaveValue(overlong);
    await submit.click();
    await expect(phone).toHaveAttribute("aria-invalid", "true");
    await expect(phone).toBeFocused();
    expect(requests).toBe(0);

    const corrected = "+7 (900) 000-00-00";
    await phone.fill(corrected);
    const pending = page.waitForRequest(req => req.method() === "POST" && req.url().endsWith(`/api/${endpoint}`));
    await submit.click();
    const body = (await pending).postDataJSON();
    expect(endpoint === "orders" ? body.customer.phone : body.phone).toBe(corrected);
    await expect(phone).not.toHaveAttribute("aria-invalid", "true");
  });
}

test("checkout sends a valid international address without expanding its local part", async ({page}) => {
  await seedCart(page);
  await page.goto("/checkout");
  await fillCheckout(page);
  const email = "İ".repeat(32) + "@example.invalid";
  await page.getByLabel("Электронная почта *", {exact: true}).fill(email);
  await page.route("**/api/orders", route => route.fulfill({status: 503, json: {ok: false, error: "Тестовый отказ сервиса"}}));
  const pending = page.waitForRequest(req => req.method() === "POST" && req.url().endsWith("/api/orders"));
  await page.getByRole("button", {name: /^Создать заказ на/}).click();
  expect((await pending).postDataJSON().customer.email).toBe(email);
});

test("quote requires correction of an overlong pasted phone and normalizes a valid formatted number", async ({page}) => {
  await page.goto("/#request");
  const submit = page.getByRole("button", {name: "Отправить заявку", exact: true});
  const form = page.locator("form").filter({has: submit});
  await form.getByLabel("Имя *", {exact: true}).fill("Анна Тестовая");
  await form.getByLabel("Электронная почта *", {exact: true}).fill("audit@example.invalid");
  await form.getByLabel(/Что требуется рассчитать/).fill("Тест формы");
  await form.getByRole("checkbox").check();
  const phone = form.getByLabel("Телефон *", {exact: true});
  const pastePhone = (value: string) => phone.evaluate((input, pasted) => {
    const data = new DataTransfer();
    data.setData("text/plain", pasted);
    input.dispatchEvent(new ClipboardEvent("paste", {clipboardData: data, bubbles: true, cancelable: true}));
  }, value);
  let submissions = 0;
  await page.route("**/api/quote", async route => {
    submissions++;
    await route.fulfill({status: 200, json: {ok: true}});
  });

  const invalid = "+7 900 000-00-00 1";
  await phone.focus();
  await pastePhone(invalid);
  await expect(phone).toHaveValue(invalid);
  await submit.click();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  expect(submissions).toBe(0);

  await pastePhone("8 (900) 000-00-00");
  await expect(phone).toHaveValue("+79000000000");
  const request = page.waitForRequest(req => req.url().endsWith("/api/quote") && req.method() === "POST");
  await submit.click();
  expect((await request).postDataJSON().phone).toBe("+79000000000");
  await expect(page.getByRole("status").filter({hasText: "Заявка принята."})).toBeVisible();
});

test("quote validates consent on its first click from an invalid phone and clears a sent message", async ({page, isMobile}) => {
  if (isMobile) await page.setViewportSize({width: 320, height: 844});
  await page.goto("/#request");
  const submit = page.getByRole("button", {name: "Отправить заявку", exact: true});
  const form = page.locator("form").filter({has: submit});
  const name = form.getByLabel("Имя *", {exact: true});
  const message = form.getByLabel(/Что требуется рассчитать/);
  const phone = form.getByLabel("Телефон *", {exact: true});
  const consent = form.getByRole("checkbox");
  let requests = 0;
  await page.route("**/api/quote", async route => {
    requests++;
    await route.fulfill({json: {ok: true}});
  });
  await name.fill("Анна Тестовая");
  await form.getByLabel("Электронная почта *", {exact: true}).fill("audit@example.invalid");
  await message.fill("Арматура для первого запроса");
  await phone.fill("123");
  await expect(phone).toBeFocused();
  await expect(phone).toHaveAttribute("aria-invalid", "false");
  if (isMobile) await submit.tap();
  else await submit.click();
  await expect(consent).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toBeFocused();
  expect(requests).toBe(0);

  await phone.fill("8 (900) 000-00-00");
  await consent.press("Space");
  await expect(consent).toBeChecked();
  if (isMobile) await submit.tap();
  else await submit.click();
  const repeat = page.getByRole("button", {name: "Отправить ещё одну", exact: true});
  await expect(repeat).toBeVisible();
  expect(requests).toBe(1);
  await repeat.click();
  await expect(name).toHaveValue("");
  await expect(message).toHaveValue("");
  await expect(consent).not.toBeChecked();
});

test("catalog blocks malformed quantities and positive quantities that round to zero", async ({page}) => {
  await openProduct(page);
  const row = visibleProduct(page, samples.shveller.id);
  const quantity = row.getByRole("textbox", {name: /^Количество /});
  const add = row.getByRole("button", {name: "В корзину", exact: true});
  for (const input of ["abc", "-2", "0", "0,000001"]) {
    await quantity.fill(input);
    await quantity.blur();
    await expect(quantity).toHaveAttribute("aria-invalid", "true");
    await expect(add).toBeDisabled();
  }
  await expect(row.getByText("Сумма позиции должна быть больше 0 ₽.", {exact: false})).toBeVisible();
  await quantity.fill("2,5");
  await expect(add).toBeEnabled();
  await add.click();
  await page.goto("/cart");
  const saved = page.locator(`[data-cart-row="${samples.shveller.id}"]`).getByRole("textbox", {name: /^Длина /});
  await expect(saved).toHaveValue("2,5");
});

test("rows already saved with a zero total are blocked at checkout", async ({page}) => {
  await seedCart(page, 0.000001);
  await page.goto("/cart");
  await expect(page.getByRole("main").getByRole("link", {name: "Перейти к оформлению", exact: true})).toHaveCount(0);
  await page.goto("/checkout");
  await expect(page.getByRole("heading", {name: "Расчёт заказа требует уточнения"})).toBeVisible();
  await expect(page.getByRole("button", {name: /^Создать заказ на/})).toHaveCount(0);
  await expect(page.getByRole("link", {name: "Проверить корзину"})).toHaveAttribute("href", "/cart");
});

test("cart explains why a positive quantity with a zero total was rejected and allows correction", async ({page}) => {
  await seedCart(page, 3);
  await page.goto("/cart");
  const row = page.locator(`[data-cart-row="${samples.shveller.id}"]`);
  const quantity = row.getByRole("textbox", {name: /^Длина /});
  await expect(quantity).toHaveValue("3");
  await quantity.fill("0,000001");
  await quantity.press("Enter");
  await expect(quantity).toHaveValue("3");
  await expect(row.getByText(/Сумма позиции должна быть больше 0 ₽/)).toBeVisible();

  await quantity.fill("2,5");
  await quantity.press("Enter");
  await expect(quantity).toHaveValue("2,5");
  await expect(row.getByText(/Сумма позиции должна быть больше 0 ₽/)).toHaveCount(0);
  await page.reload();
  await expect(quantity).toHaveValue("2,5");
});

test("measured catalog rejects malformed input and still rounds a valid VGP length to whole pipes", async ({page}) => {
  await openProduct(page, samples.vgp);
  const row = visibleProduct(page, samples.vgp.id);
  const meters = row.getByRole("textbox", {name: /^Длина заказа для/});
  const add = row.getByRole("button", {name: "В корзину", exact: true});
  await meters.fill("abc");
  await meters.blur();
  await expect(meters).toHaveValue("abc");
  await expect(meters).toHaveAttribute("aria-invalid", "true");
  await expect(add).toBeDisabled();
  await meters.fill("7");
  await meters.blur();
  await expect(meters).toHaveValue("12");
  await expect(add).toBeEnabled();
});
