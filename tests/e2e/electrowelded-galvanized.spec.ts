import {test, expect, openFilters, openProduct, productPath, visibleProduct, settleImages} from "../browser";
import {getAllProductVariants} from "../../lib/catalog";

const products = getAllProductVariants();
const galvanizedPipe = products.find(p => p.id === "local-443")!;
const rangedPipe = products.find(p => p.id === "local-58627")!;
const fixedPipe = products.find(p => p.id === "local-316")!;

test("galvanized 89×3.5 pipe converts while typing and retains the same measurements in the cart", async ({page, isMobile}, testInfo) => {
  await openProduct(page, galvanizedPipe);
  const row = visibleProduct(page, galvanizedPipe.id);
  if (isMobile) {
    await expect(row.getByText("89 × 3,5", {exact: true})).toBeVisible();
    await expect(row.getByText("7,8 м (±150 мм)", {exact: true})).toBeVisible();
  } else {
    const table = row.locator("xpath=ancestor::table");
    await expect(row.getByRole("rowheader")).toContainText("89 × 3,5");
    await expect(row.getByRole("cell", {name: "7,8 ±150 мм", exact: true})).toBeVisible();
    await expect(table.getByRole("columnheader", {name: "Сталь", exact: true})).toBeVisible();
    await expect(page.getByText(/^Для пересчёта используется масса стальной трубы без цинкового покрытия/)).toBeVisible();
  }
  const detailsButton = isMobile ? row.getByText("Подробнее", {exact: true})
    : row.getByRole("button", {name: /^Подробности:/});
  await detailsButton.click();
  const details = isMobile ? row.locator("details") : page.locator(`#${await detailsButton.getAttribute("aria-controls")}`);
  await expect(details.getByText("Теоретическая масса без покрытия", {exact: true})).toBeVisible();
  await expect(details.getByText("7,38 кг/м", {exact: true})).toBeVisible();
  await expect(details.getByText(/ГОСТ 10705-80/).first()).toBeVisible();
  await detailsButton.click();

  const meters = row.getByRole("textbox", {name: /^Длина заказа для/});
  const tons = row.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  await meters.fill("7,8");
  await expect(meters).toBeFocused();
  await expect(tons).toHaveValue("0,057564");
  await meters.fill("15,6");
  await expect(tons).toHaveValue("0,115128");
  await tons.fill("0,057564");
  await expect(meters).toHaveValue("7,8");
  await tons.blur();
  await expect(tons).toHaveValue("0,057564");
  await meters.fill("7,81");
  await meters.blur();
  await expect(meters).toHaveValue("15,6");
  await expect(row.getByRole("status", {name: "", exact: true})).toHaveText("2 шт.");
  await meters.fill("");
  await expect(tons).toHaveValue("");
  await meters.fill("-1");
  await expect(meters).toHaveAttribute("aria-invalid", "true");
  await expect(row.getByRole("button", {name: "В корзину", exact: true})).toBeDisabled();
  await meters.fill("15,6");
  await meters.blur();
  await settleImages(page, row);
  await row.screenshot({path: testInfo.outputPath("electrowelded-galvanized-row.png")});
  await row.getByRole("button", {name: "В корзину", exact: true}).click();
  await expect(row.getByRole("button", {name: "В корзине", exact: true})).toBeVisible();

  await page.goto("/cart");
  const cartRow = page.locator(`[data-cart-row="${galvanizedPipe.id}"]`);
  const cartMeters = cartRow.getByRole("textbox", {name: /^Длина /});
  const cartTons = cartRow.getByRole("textbox", {name: /^Масса /});
  await expect(cartMeters).toHaveValue("15,6");
  await expect(cartTons).toHaveValue("0,115128");
  await cartMeters.fill("7,8");
  await cartMeters.blur();
  await expect(cartTons).toHaveValue("0,057564");
  await cartTons.fill("0,115128");
  await cartTons.blur();
  await expect(cartMeters).toHaveValue("15,6");
  await page.reload();
  await expect(cartMeters).toHaveValue("15,6");
  await expect(cartTons).toHaveValue("0,115128");
  await expect(cartRow.getByRole("alert")).toHaveCount(0);
  await expect(cartRow).toContainText(/9\s*739,83/);
  await cartRow.screenshot({path: testInfo.outputPath("electrowelded-galvanized-cart.png")});
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1") ?? "[]"));
  expect(stored).toHaveLength(1);
  expect(stored[0].measurement.weightTons).toBeCloseTo(0.115128, 10);
});

test("ordinary electrowelded pipes match both ends of the length range and convert without rounding to whole pipes", async ({page}) => {
  await page.goto(productPath(rangedPipe, false));
  const ranged = visibleProduct(page, rangedPipe.id);
  await expect(ranged).toBeVisible();
  await openFilters(page);
  await expect(page.getByRole("combobox", {name: "Наружный Ø, мм", exact: true})).toHaveCount(0);
  await page.getByLabel("Поиск товаров", {exact: true}).fill("Ø273");
  await page.getByRole("combobox", {name: "Стенка, мм", exact: true}).selectOption("8");
  const length = page.getByRole("combobox", {name: "Длина, м", exact: true});
  await length.selectOption("11");
  await expect(ranged).toContainText("11–12");
  await length.selectOption("12");
  await expect(ranged).toContainText("11–12");
  await length.selectOption("6");
  await expect(ranged).toHaveCount(0);
  await expect(page.getByText("Варианты не найдены", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  await expect(ranged).toBeVisible();

  const fixed = visibleProduct(page, fixedPipe.id);
  const meters = fixed.getByRole("textbox", {name: /^Длина заказа для/});
  const tons = fixed.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  await meters.fill("7,5");
  await expect(tons).toHaveValue("0,05535");
  await meters.blur();
  await expect(meters).toHaveValue("7,5");
  await expect(fixed.getByLabel(/^Сумма заказа для/)).toContainText(/2\s*819,53/);
  await tons.fill("0,0738");
  await tons.blur();
  await expect(meters).toHaveValue("10");
  await expect(tons).toHaveValue("0,0738");
  await fixed.getByRole("button", {name: "В корзину", exact: true}).click();
  await expect(fixed.getByRole("button", {name: "В корзине", exact: true})).toBeVisible();

  await page.goto("/cart");
  const cartRow = page.locator(`[data-cart-row="${fixedPipe.id}"]`);
  await expect(cartRow.getByRole("textbox", {name: /^Длина /})).toHaveValue("10");
  await expect(cartRow.getByRole("textbox", {name: /^Масса /})).toHaveValue("0,0738");
});
