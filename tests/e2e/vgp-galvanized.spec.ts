import {test, expect, openFilters, openProduct, productPath, visibleProduct} from "../browser";
import {getAllProductVariants} from "../../lib/catalog";

const products = getAllProductVariants();
const product = products.find(p => p.id === "local-984")!;
const ordinary = products.find(p => p.id === "local-258")!;

test("galvanized VGP shows audited facts and converts length and mass while typing", async ({page, isMobile}, testInfo) => {
  await openProduct(page, product);
  const row = visibleProduct(page, product.id);
  await expect(row).toContainText("33,5");
  await expect(row).toContainText("25 × 2,8");
  await expect(row).toContainText("Лёгкая");
  if (isMobile) {
    await expect(row.getByText("7,8 м (±150 мм)", {exact: true})).toBeVisible();
    await expect(row.getByText("2,18 кг/м", {exact: true})).toBeVisible();
  } else {
    const table = row.locator("xpath=ancestor::table");
    await expect(table.getByRole("columnheader", {name: "Ду × стенка, мм", exact: true})).toBeVisible();
    await expect(table.getByRole("columnheader", {name: "Наружный Ø, мм", exact: true})).toBeVisible();
    await expect(table.getByRole("columnheader", {name: "Масса, кг/м", exact: true})).toBeVisible();
    await expect(row.getByRole("cell", {name: "7,8 ±150 мм", exact: true})).toBeVisible();
    await expect(row.getByRole("cell", {name: "2,18", exact: true})).toBeVisible();
  }
  const detailsButton = isMobile ? row.locator("summary") : row.getByRole("button", {name: /^Подробности:/});
  await detailsButton.click();
  const details = isMobile ? row.locator("details") : page.locator(`#${await detailsButton.getAttribute("aria-controls")}`);
  await expect(details).toContainText("Допуск ±150 мм указан поставщиком");
  await expect(details).not.toContainText(/2,1836|2,184/);
  await detailsButton.click();
  const meters = row.getByRole("textbox", {name: /^Длина заказа для/});
  const tons = row.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  await meters.fill("7,8");
  await expect(meters).toBeFocused();
  await expect(tons).toHaveValue("0,017032");
  await meters.fill("15,6");
  await expect(tons).toHaveValue("0,034064");
  await tons.fill("0,03406416");
  await expect(meters).toHaveValue("15,6");
  await tons.blur();
  await expect(tons).toHaveValue("0,034064");
  await meters.fill("7,81");
  await meters.blur();
  await expect(meters).toHaveValue("15,6");
  await expect(row).toContainText("Объём округлён вверх до целых труб");
  await expect(row.getByRole("button", {name: "В корзину", exact: true})).toHaveCount(0);
  await row.locator("img").evaluate(image => (image as HTMLImageElement).decode());
  await row.screenshot({path: testInfo.outputPath("vgp-galvanized-row.png")});

  await row.getByRole("button", {name: /Увеличить изображение:/}).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("img").evaluate(image => (image as HTMLImageElement).decode());
  await expect(dialog.getByRole("img")).toHaveAttribute("src", /vgp_ocinkovannaya_2400_1800_marked\.jpg/);
  await dialog.screenshot({path: testInfo.outputPath("vgp-galvanized-image.png")});
  await page.keyboard.press("Escape");

  await row.getByRole("link", {name: "Запросить цену", exact: true}).click();
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Общая длина: 15,6 м/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Вес: 0,034 т/);
  await meters.fill("");
  await expect(tons).toHaveValue("");
  await meters.fill("-1");
  await expect(meters).toHaveAttribute("aria-invalid", "true");
  await expect(tons).toHaveValue("");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1") ?? "[]"))).toEqual([]);
});

test("ordinary VGP filters by nominal bore and series and adds whole pipes to the cart", async ({page}) => {
  await page.goto(productPath(ordinary, false));
  await openFilters(page);
  const size = page.getByRole("combobox", {name: "Ду × стенка, мм", exact: true});
  const series = page.getByRole("combobox", {name: "Серия", exact: true});
  await size.selectOption({label: "32 × 2,8"});
  const lightPipe = visibleProduct(page, "local-6224");
  await expect(lightPipe).toContainText("42,3");
  await expect(lightPipe).toContainText("2,73");
  await expect(visibleProduct(page, "local-54870")).toHaveCount(0);
  await series.selectOption({label: "Обыкновенная"});
  await expect(page.getByText("Варианты не найдены", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();

  const row = visibleProduct(page, ordinary.id);
  const meters = row.getByRole("textbox", {name: /^Длина заказа для/});
  const tons = row.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  await meters.fill("6,01");
  await meters.blur();
  await expect(meters).toHaveValue("12");
  await expect(tons).toHaveValue("0,01536");
  await expect(row.getByLabel(/^Сумма заказа для/)).toContainText(/823,91/);
  await row.getByRole("button", {name: "В корзину", exact: true}).click();
  await page.goto("/cart");
  const cart = page.locator(`[data-cart-row="${ordinary.id}"]`);
  await expect(cart.getByRole("textbox", {name: /^Длина /})).toHaveValue("12");
  await expect(cart.getByRole("textbox", {name: /^Масса /})).toHaveValue("0,01536");
  await expect(cart).toContainText(/823,91/);
});
