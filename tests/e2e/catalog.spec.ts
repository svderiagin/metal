import {test, expect, openProduct, samples, visibleProduct, productPath, openFilters} from "../browser";
import {getAllCategories, getAllProductTypes, getAllProductVariants} from "../../lib/catalog";

test("every category and product-family route responds without a missing page", async ({request}) => {
  const paths = new Set([...getAllCategories().map(category => `/catalog/${category.slug}`),
    ...getAllProductTypes().map(type => productPath({...samples.shveller, productTypeId: type.id}, false))]);
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
});

for (const family of ["shveller", "ugolok", "kvadrat", "armatura", "balka", "profile", "vgp", "profnastil", "mesh", "shtaketnik"] as const) {
  test(`${family}: linked product is visible and filters reset`, async ({page}) => {
    const product = samples[family];
    await openProduct(page, product);
    const productItem = visibleProduct(page, product.id);
    if (await productItem.evaluate(element => element.tagName === "TR")) {
      const headers = productItem.locator("xpath=ancestor::table").getByRole("columnheader");
      if (family === "armatura") {
        await expect(headers).toHaveText([
          "Диаметр, мм", "Форма", "Марка стали", "Цена, ₽/т", "Масса, кг/м", "Длина, м", "Заказ, м", "Заказ, т", "Сумма", "Действие",
        ]);
        await expect(productItem.getByRole("cell").first()).toHaveText(String(product.diameterMm));
      } else {
        await expect(headers).toHaveText([
          "Наименование", "Изображение", "Характеристики", "Цена",
          ...(family === "balka" || family === "vgp" ? ["Заказ, м", "Заказ, т"] : [/^Кол-во(?:, м)?$/]),
          "Сумма", "Действие",
        ]);
        await expect(productItem.getByRole("rowheader")).toBeVisible();
      }
      await expect(headers.first()).toHaveCSS("padding-inline-start", "16px");
    } else {
      await expect(productItem.getByRole("heading", {level: 3})).toBeVisible();
    }
    if (family === "armatura") {
      await expect(page.getByRole("region", {name: "Продукция"}).locator("img")).toHaveCount(0);
      await expect(productItem.getByRole("textbox")).toHaveCount(2);
    }
    await expect(productItem.getByRole("textbox").first()).toBeVisible();
    await expect(productItem.getByLabel(/^Сумма заказа для/)).toBeVisible();
    const query = page.getByLabel("Поиск товаров", {exact: true}).filter({visible: true});
    await expect(query).toHaveValue(product.name);
    await query.fill("нет-такого-товара-zzzzzz");
    await expect(page.getByText("Варианты не найдены", {exact: true})).toBeVisible();
    if (family !== "armatura" || product.subcategoryId === "cat-arm-sub-1") {
      await expect(page.getByRole("status").filter({hasText: /Найдено: 0 из/}).filter({visible: true}).first()).toBeVisible();
    }
    await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
    await expect(query).toHaveValue("");
    await expect(productItem).toBeVisible();
  });
}

test("channel section filter contains profile numbers and is independent of length", async ({page}) => {
  await openProduct(page);
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  await openFilters(page);
  const section = page.getByRole("combobox", {name: "Номер профиля", exact: true});
  await section.selectOption("6,5");
  await expect(visibleProduct(page, "rozmet-2236")).toBeVisible();
  await expect(visibleProduct(page, "rozmet-2235")).toHaveCount(0);
  await expect(page.getByRole("combobox", {name: "Длина по каталогу", exact: true})).toBeVisible();
});

for (const {family, high, normalizedHigh, low} of [
  {family: "shveller", high: "1 000.5", normalizedHigh: "1000,5", low: "500"},
  {family: "vgp", high: "54 000.5", normalizedHigh: "54000,5", low: "53000"},
] as const) {
  test(`${family}: price filters normalize input and correct invalid ranges`, async ({page}) => {
    const product = samples[family];
    await openProduct(page, product);
    await openFilters(page);
    const minimum = page.getByRole("textbox", {name: /^Минимальная цена/});
    const maximum = page.getByRole("textbox", {name: /^Максимальная цена/});
    const row = visibleProduct(page, product.id);

    await minimum.fill(high);
    await expect(row).toHaveCount(0);
    await minimum.press("Enter");
    await expect(minimum).toHaveValue(normalizedHigh);

    await maximum.fill(low);
    await maximum.blur();
    await expect(minimum).toHaveValue(low);
    await expect(maximum).toHaveValue(normalizedHigh);
    await expect(page.getByText("Границы цены поменялись местами.")).toBeVisible();
    await expect(row).toBeVisible();

    await minimum.fill("-1");
    await minimum.blur();
    await expect(minimum).toHaveValue("");
    await expect(maximum).toHaveValue(normalizedHigh);
    await expect(page.getByText(/^Некорректная граница цены сброшена/)).toBeVisible();

    await maximum.fill("1e3");
    await maximum.press("Enter");
    await expect(maximum).toHaveValue("");
    await expect(row).toBeVisible();
    await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
    await expect(page.getByText(/^Некорректная граница цены сброшена/)).toHaveCount(0);
  });
}

test("tread plate filters use the table dimensions and keep the ordering units", async ({page}) => {
  await page.goto(productPath(samples.treadPlate, false));
  await expect(page.getByRole("heading", {name: "Лист рифлёный", level: 1})).toBeVisible();
  await openFilters(page);
  const format = page.getByRole("combobox", {name: "Размер листа", exact: true});
  const thickness = page.getByRole("combobox", {name: "Толщина", exact: true});
  const sheet = visibleProduct(page, "rozmet-28952");
  const area = visibleProduct(page, samples.treadPlate.id);
  await expect(sheet.getByText("№ 3 ТУ", {exact: true})).toBeVisible();
  await expect(sheet.getByText("Только при оплате наличными", {exact: true})).toHaveCount(0);
  await expect(sheet.getByText("шт.", {exact: true})).toBeVisible();
  await format.selectOption("1500 × 6000 мм");
  await expect(sheet).toHaveCount(0);
  await expect(area.getByText("1500 × 6000 мм", {exact: true})).toBeVisible();
  await expect(area.getByText("м²", {exact: true})).toBeVisible();
  await thickness.selectOption("3 мм");
  await expect(page.getByText("Варианты не найдены", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  await expect(sheet).toBeVisible();
  await expect(area).toBeVisible();
});

test("galvanized sheets filter decimal thickness and keep per-sheet ordering without cash conditions", async ({page}) => {
  await page.goto(productPath(samples.galvanizedSheet, false));
  await expect(page.getByRole("heading", {name: "Лист оцинкованный", level: 1})).toBeVisible();
  const thickness = page.getByRole("combobox", {name: "Толщина", exact: true});
  await openFilters(page);
  const format = page.getByRole("combobox", {name: "Размер листа", exact: true});
  const thin = visibleProduct(page, "rozmet-2181");
  const selected = visibleProduct(page, samples.galvanizedSheet.id);
  const thick = visibleProduct(page, "rozmet-2184");
  await expect(thin.getByText("Только при оплате наличными", {exact: true})).toHaveCount(0);
  await expect(thick.getByText("Только при оплате наличными", {exact: true})).toHaveCount(0);
  await format.selectOption("1250 × 2500 мм");
  await thickness.selectOption("0,7 мм");
  await expect(thin).toHaveCount(0);
  await expect(thick).toHaveCount(0);
  await expect(selected.getByText("№ 0,7", {exact: true})).toBeVisible();
  await expect(selected.getByText("1250 × 2500 мм", {exact: true})).toBeVisible();
  await expect(selected.getByText("шт.", {exact: true})).toBeVisible();
  await expect(selected.getByRole("textbox")).toHaveAttribute("inputmode", "numeric");
  await expect(selected.getByText("Только при оплате наличными", {exact: true})).toHaveCount(0);
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  await expect(thin).toBeVisible();
  await expect(thick).toBeVisible();
});

test("supplier cash conditions are absent from every affected product table and card", async ({page}) => {
  const affected = getAllProductVariants().filter(product =>
    product.specifications.some(item => /наличн/iu.test(item.value)));
  const paths = new Set(affected.map(product => productPath(product, false)));
  expect(paths.size).toBeGreaterThan(0);
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole("heading", {level: 1})).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/Только при оплате наличными|Акция действует только при наличной оплате/u);
  }
});

test("search resolves a technical query to a visible linked product", async ({page}) => {
  await page.goto("/catalog");
  await page.getByLabel("Поисковый запрос", {exact: true}).fill("арматура 12");
  await expect(page.getByRole("heading", {name: "Результаты поиска", exact: true})).toBeVisible();
  const result = page.locator('main a[href*="#variant-"]').first();
  await expect(result).toBeVisible();
  await expect(result).toContainText(/12/);
  const href = await result.getAttribute("href");
  await result.click();
  await expect(page).toHaveURL(new RegExp(href!.split("#")[1] + "$"));
  const id = href!.split("#variant-")[1];
  await expect(visibleProduct(page, id)).toBeVisible();
});

test("mobile category navigation is compact and menu supports Escape", async ({page, isMobile}) => {
  test.skip(!isMobile, "mobile navigation contract");
  await page.goto("/catalog/shveller");
  const categoryToggle = page.locator("details").filter({has: page.locator("summary", {hasText: "Все разделы"})}).first();
  await expect(categoryToggle).not.toHaveAttribute("open");
  const heading = await page.getByRole("heading", {name: "Швеллер", exact: true, level: 1}).boundingBox();
  expect(heading!.y).toBeLessThan(600);
  await categoryToggle.locator("summary").click();
  await expect(categoryToggle.getByRole("link", {name: "Арматура", exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Открыть меню", exact: true}).click();
  await expect(page.getByRole("navigation", {name: "Мобильная навигация"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", {name: "Открыть меню", exact: true})).toBeFocused();
});

test("profile-sheet guidance follows product families in the rendered page", async ({page}) => {
  await page.goto("/catalog/profnastil");
  const families = await page.getByRole("region", {name: "Типы продукции", exact: true}).boundingBox();
  const details = await page.getByRole("heading", {name: "Как подобрать профнастил", exact: true}).boundingBox();
  expect(families!.y + families!.height).toBeLessThanOrEqual(details!.y);
});

for (const family of ["armatura", "balka", "profile", "vgp", "profnastil", "mesh", "shveller", "ugolok", "kvadrat", "shtaketnik", "treadPlate", "galvanizedSheet", "coldRolledSheet", "hotRolledSheet"] as const) {
  test(`${family}: compact introduction brings products forward with collapsed parameters`, async ({page, isMobile}) => {
    const route = ["shveller", "ugolok", "kvadrat"].includes(family)
      ? `/catalog/${family}` : productPath(samples[family], false);
    await page.goto(route);
    const photo = page.getByRole("main").locator('button[aria-haspopup="dialog"]').first();
    await expect(photo).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const imageBox = (await photo.boundingBox())!;
    expect(imageBox.width).toBeLessThanOrEqual(isMobile ? 192 : 320);
    const headingBox = (await page.getByRole("heading", {level: 1}).boundingBox())!;
    expect(headingBox.y).toBeLessThan(imageBox.y + imageBox.height);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    const filters = page.locator("details").filter({has: page.locator("summary", {hasText: "Параметры подбора"})}).first();
    await expect(filters).not.toHaveAttribute("open");
    const results = page.locator('[id^="variant-"]:visible').first();
    expect((await results.boundingBox())!.y).toBeLessThan(isMobile ? 1300 : 1200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
