import {test, expect, openProduct, samples, visibleProduct, seedCart, fillCheckout} from "../browser";

test("cart adds a product, updates its quantity and survives reload", async ({page}) => {
  await openProduct(page);
  const row = visibleProduct(page, samples.shveller.id);
  await row.getByRole("spinbutton", {name: /Количество Швеллер № 5/}).fill("3");
  await row.getByRole("button", {name: "В корзину", exact: true}).click();
  await page.goto("/cart");
  await expect(page.getByRole("link", {name: "Швеллер № 5", exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Увеличить количество", exact: true}).click();
  await expect(page.getByLabel("Количество товара", {exact: true})).toHaveValue("4");
  await page.reload();
  await expect(page.getByLabel("Количество товара", {exact: true})).toHaveValue("4");
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

test("checkout refusal preserves the entered data and the real cart", async ({page}) => {
  await seedCart(page);
  await page.goto("/checkout");
  await fillCheckout(page);
  await page.getByRole("button", {name: /^Создать заказ на/}).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Тестовый отказ");
  await expect(page.getByLabel("ФИО *", {exact: true})).toHaveValue("Анна Тестовая");
  await page.goto("/cart");
  await expect(page.getByLabel("Количество товара", {exact: true})).toHaveValue("3");
});

for (const storageBlocked of [false, true]) {
  test(`accepted invoice clears cart and displays the receipt${storageBlocked ? " when session storage is blocked" : ""}`, async ({page}) => {
    await seedCart(page);
    if (storageBlocked) await page.addInitScript(() => Object.defineProperty(window, "sessionStorage", {get() {throw new Error("blocked");}}));
    let submissions = 0;
    await page.route("**/api/orders", async route => {
      const body = route.request().postDataJSON();
      expect(body.consent).toBe(true);
      expect(body.items).toHaveLength(1);
      submissions++;
      await route.fulfill({status: 201, json: {ok: true, order: {reference: "MS-A1B2C3D4E5F6", totalAmount: 1605, paymentMethod: "INVOICE"}}});
    });
    await page.goto("/checkout");
    await fillCheckout(page);
    await page.getByRole("button", {name: /^Создать заказ на/}).click();
    await expect(page).toHaveURL(/\/order\/success$/);
    await expect(page.getByRole("heading", {name: "Заказ создан", exact: true})).toBeVisible();
    await expect(page.getByText("MS-A1B2C3D4E5F6", {exact: true})).toBeVisible();
    expect(submissions).toBe(1);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1")!))).toEqual([]);
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
