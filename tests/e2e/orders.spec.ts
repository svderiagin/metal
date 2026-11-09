import {test, expect, openProduct, samples, visibleProduct, seedCart, fillCheckout} from "../browser";
import {PDFDocument} from "pdf-lib";
import path from "node:path";

test("order drafts and totals survive table and card breakpoints before adding to cart", async ({page}) => {
  const product = samples.shveller;
  const formatTotal = (quantity: number) => new Intl.NumberFormat("ru-RU", {
    style: "currency", currency: "RUB",
  }).format(product.price! * quantity);
  await page.setViewportSize({width: 1440, height: 1000});
  await openProduct(page, product);
  const row = visibleProduct(page, product.id);
  const quantity = row.getByRole("textbox", {name: /^Количество /});
  const total = row.getByLabel(/^Сумма заказа для/);
  await expect(row).toHaveJSProperty("tagName", "TR");
  await quantity.fill("2.5");
  await expect(total).toHaveText(formatTotal(2.5));

  await page.setViewportSize({width: 390, height: 844});
  await expect(row).toHaveJSProperty("tagName", "ARTICLE");
  await expect(quantity).toHaveValue("2.5");
  await expect(total).toHaveText(formatTotal(2.5));
  await quantity.fill("4.5");

  await page.setViewportSize({width: 1440, height: 1000});
  await expect(row).toHaveJSProperty("tagName", "TR");
  await expect(quantity).toHaveValue("4.5");
  await expect(total).toHaveText(formatTotal(4.5));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1") ?? "[]"))).toEqual([]);
});

test("cart adds a product, updates its quantity and survives reload", async ({page}) => {
  await openProduct(page);
  const row = visibleProduct(page, samples.shveller.id);
  await row.getByRole("textbox", {name: /Количество Швеллер № 5/}).fill("3");
  await expect(row.getByLabel(/^Сумма заказа для/)).toHaveText(/1\s605,00\s₽/);
  await row.getByRole("button", {name: "В корзину", exact: true}).click();
  await page.goto("/cart");
  await expect(page.getByRole("link", {name: "Швеллер № 5", exact: true})).toBeVisible();
  const cartRow = page.locator(`[data-cart-row="${samples.shveller.id}"]`);
  const cartQuantity = cartRow.getByRole("textbox", {name: /^Длина /});
  await cartRow.getByRole("button", {name: "Увеличить количество", exact: true}).click();
  await expect(cartQuantity).toHaveValue("4");
  await expect.poll(() => page.evaluate(id => {
    const items = JSON.parse(localStorage.getItem("metal-store-cart-v1") ?? "[]");
    return items.find((item: {productId: string; quantity: number}) => item.productId === id)?.quantity;
  }, samples.shveller.id)).toBe(4);
  await page.reload();
  await expect(cartQuantity).toHaveValue("4");
  for (const control of [page.getByRole("button", {name: "Очистить корзину", exact: true}), page.getByRole("link", {name: "Продолжить покупки", exact: true})]) {
    const contrast = await control.evaluate(element => {
      const style = getComputedStyle(element);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", {willReadFrequently: true})!;
      const luminance = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
          const channel = value / 255;
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        });
        return .2126 * r + .7152 * g + .0722 * b;
      };
      const text = luminance(style.color), background = luminance(style.backgroundColor);
      return (Math.max(text, background) + .05) / (Math.min(text, background) + .05);
    });
    expect(contrast, "secondary action text contrast").toBeGreaterThanOrEqual(4.5);
  }
  await page.getByRole("button", {name: "Очистить корзину", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Корзина пуста", exact: true})).toBeVisible();
});

test("galvanized sheet limits quantity while typing and pasting, before blur", async ({page}) => {
  const product = samples.galvanizedSheet;
  await openProduct(page, product);
  const row = visibleProduct(page, product.id);
  const quantity = row.getByRole("textbox", {name: /^Количество /});
  await quantity.fill("");
  await quantity.pressSequentially("0000000");
  await expect(quantity).toBeFocused();
  await expect(quantity).toHaveValue("0");
  await expect(row.getByRole("button", {name: "В корзину", exact: true})).toBeEnabled();
  await quantity.fill("");
  await quantity.pressSequentially("99999");
  await expect(quantity).toBeFocused();
  await expect(quantity).toHaveValue("999");
  await expect(row.getByText("Значение ограничено максимумом 999.")).toBeVisible();
  await quantity.fill("0003");
  await expect(quantity).toHaveValue("3");
  await row.getByRole("button", {name: "В корзину", exact: true}).click();
  await quantity.fill("9".repeat(400));
  await expect(quantity).toHaveValue("999");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1")!)[0].quantity)).toBe(3);
});

for (const family of ["mesh", "profnastil"] as const) {
  test(`${family}: the total follows whole quantities, and zero removes the saved line`, async ({page}) => {
    const product = samples[family];
    await openProduct(page, product);
    const row = visibleProduct(page, product.id);
    const quantity = row.getByRole("textbox");
    const total = row.getByLabel(/^Сумма заказа для/);
    const formattedTotal = new Intl.NumberFormat("ru-RU", {style: "currency", currency: "RUB"}).format(product.price! * 2);
    await expect(quantity).toHaveAttribute("inputmode", "numeric");
    await quantity.fill("1,5");
    await expect(row.getByRole("button", {name: "В корзину", exact: true})).toBeEnabled();
    await quantity.press("Tab");
    await expect(quantity).toHaveValue("2");
    await expect(row.getByText("Количество округлено вверх до 2.")).toBeVisible();
    await expect(total).toHaveText(formattedTotal);
    await row.getByRole("button", {name: "В корзину", exact: true}).click();
    await expect(row.getByRole("button", {name: "В корзине", exact: true})).toBeDisabled();
    await quantity.fill("3");
    await expect(row.getByText("Не сохранено", {exact: true})).toBeVisible();
    await row.getByRole("button", {name: "Обновить", exact: true}).click();
    await expect(row.getByRole("button", {name: "В корзине", exact: true})).toBeDisabled();
    await quantity.fill("-5");
    await quantity.blur();
    await expect(quantity).toHaveValue("1");
    await expect(row.getByRole("button", {name: "Удалить", exact: true})).toHaveCount(0);
    await quantity.fill("1 000");
    await quantity.blur();
    await expect(quantity).toHaveValue("999");
    await expect(row.getByText("Значение ограничено максимумом 999.")).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1")!)[0].quantity)).toBe(3);
    await quantity.fill("0");
    await row.getByRole("button", {name: "Удалить", exact: true}).click();
    await expect(row.getByRole("button", {name: "Удалено", exact: true})).toBeDisabled();
    await page.goto("/cart");
    await expect(page.getByRole("heading", {name: "Корзина пуста", exact: true})).toBeVisible();
  });
}

test("VGP keeps separate order fields, rounds to whole pipes and recalculates the total", async ({page}) => {
  await openProduct(page, samples.vgp);
  const row = visibleProduct(page, samples.vgp.id);
  const meters = row.getByRole("textbox", {name: /^Длина заказа для/});
  const tons = row.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  await meters.fill("0,0000000001");
  await meters.blur();
  await expect(meters).toHaveValue("6");
  await meters.fill("6,001");
  await meters.blur();
  await expect(meters).toHaveValue("12");
  await expect(tons).toHaveValue("0.01536");
  await expect(row.getByLabel(/^Сумма заказа для/)).toHaveText(/823,91\s₽/);
  await tons.fill("0,02");
  await tons.blur();
  await expect(meters).toHaveValue("18");
  await expect(tons).toHaveValue("0.02304");
  await row.getByRole("button", {name: "В корзину", exact: true}).click();
  const measurement = await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1")!)[0].measurement);
  expect(measurement.inputMode).toBe("ton");
  expect(measurement.meters).toBe(18);
  expect(measurement.weightTons).toBeCloseTo(0.02304);
});

test("checkout refusal preserves the entered data and the real cart", async ({page}) => {
  await seedCart(page);
  await page.goto("/checkout");
  await fillCheckout(page);
  await page.getByRole("button", {name: /^Создать заказ на/}).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Тестовый отказ");
  await expect(page.getByLabel("ФИО *", {exact: true})).toHaveValue("Анна Тестовая");
  await page.goto("/cart");
  await expect(page.locator(`[data-cart-row="${samples.shveller.id}"]`).getByRole("textbox", {name: /^Длина /})).toHaveValue("3");
});

for (const storageBlocked of [false, true]) {
  test(`accepted invoice clears cart and displays the receipt${storageBlocked ? " when session storage is blocked" : ""}`, async ({page}, testInfo) => {
    await seedCart(page);
    if (storageBlocked) await page.addInitScript(() => Object.defineProperty(window, "sessionStorage", {get() {throw new Error("blocked");}}));
    let submissions = 0;
    await page.route("**/api/orders", async route => {
      const body = route.request().postDataJSON();
      expect(body.consent).toBe(true);
      expect(body.items).toHaveLength(1);
      submissions++;
      await route.fulfill({status: 201, json: {ok: true, order: {reference: "MS-A1B2C3D4E5F6", totalAmount: 1605, paymentMethod: "INVOICE",
        invoice: {number: "MS-A1B2C3D4E5F6", downloadToken: "a".repeat(64), emailStatus: storageBlocked ? "SENT" : "FAILED", isPreview: true}}}});
    });
    await page.goto("/checkout");
    await fillCheckout(page);
    await page.getByRole("button", {name: /^Создать заказ на/}).click();
    await expect(page).toHaveURL(/\/order\/success$/);
    await expect(page.getByRole("heading", {name: "Заказ создан", exact: true})).toBeVisible();
    await expect(page.getByText("MS-A1B2C3D4E5F6", {exact: true})).toBeVisible();
    expect(submissions).toBe(1);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1")!))).toEqual([]);
    await expect(page.getByText("Образец счёта — не для оплаты", {exact: true})).toBeVisible();
    const button = page.getByRole("button", {name: "Скачать счёт PDF", exact: true});
    await expect(button).toBeVisible();
    if (!storageBlocked) {
      await expect(page.getByText(/Письмо отправить не удалось/)).toBeVisible();
      await page.reload();
      await expect(button).toBeVisible();
    } else await expect(page.getByText(/передан почтовому сервису/)).toBeVisible();
    await button.click();
    const downloadError = page.getByRole("main").getByRole("alert");
    await expect(downloadError).toContainText("Не удалось скачать счёт");
    const pdf = await PDFDocument.create();
    pdf.addPage();
    await page.route("**/api/orders/MS-A1B2C3D4E5F6/invoice", async route => {
      expect(route.request().headers().authorization).toBe(`Bearer ${"a".repeat(64)}`);
      expect(route.request().url()).not.toContain("token=");
      await route.fulfill({status: 200, contentType: "application/pdf", body: Buffer.from(await pdf.save())});
    });
    const downloading = page.waitForEvent("download");
    await button.focus();
    await page.keyboard.press("Enter");
    expect((await downloading).suggestedFilename()).toBe("invoice-MS-A1B2C3D4E5F6.pdf");
    await expect(downloadError).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path: path.join("output/invoice-review-2026-11-09", `${testInfo.project.name}-${storageBlocked ? "sent" : "failed"}.png`), fullPage: true});
    if (testInfo.project.name.startsWith("mobile") && !storageBlocked) {
      await page.setViewportSize({width: 320, height: 844});
      await expect(button).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({path: path.join("output/invoice-review-2026-11-09", `${testInfo.project.name}-320.png`), fullPage: true});
    }
  });
}

test("visiting a receipt URL directly does not claim an order exists", async ({page}) => {
  await page.goto("/order/success");
  await expect(page.getByText(/Данные заказа в этой вкладке не найдены/)).toBeVisible();
  await expect(page.getByRole("heading", {name: "Заказ создан", exact: true})).toHaveCount(0);
});

test("contact error preserves the message and remains announced", async ({page}) => {
  await page.goto("/contacts");
  const form = page.locator("form").filter({has: page.getByRole("heading", {name: "Написать нам", exact: true})});
  await form.getByLabel("Имя", {exact: true}).fill("Анна");
  await form.getByLabel("Электронная почта", {exact: true}).fill("audit@example.invalid");
  await form.getByLabel("Сообщение", {exact: true}).fill("Тестовый расчёт поставки");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", {name: "Отправить", exact: true}).click();
  await expect(form.getByRole("alert")).toContainText("Тестовый отказ");
  await expect(form.getByLabel("Сообщение", {exact: true})).toHaveValue("Тестовый расчёт поставки");
});
