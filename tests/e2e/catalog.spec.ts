import {test, expect, openProduct, samples, visibleProduct, productPath, openFilters} from "../browser";
import {getAllProductVariants} from "../../lib/catalog";

for (const family of ["shveller", "ugolok", "kvadrat", "armatura", "balka", "profile", "vgp", "profnastil", "mesh", "shtaketnik"] as const) {
  test(`${family}: linked product is visible and filters reset`, async ({page}) => {
    const product = samples[family];
    await page.goto(productPath(product));
    const query = page.getByLabel("Поиск товаров", {exact: true}).filter({visible: true});
    await expect(query).toHaveValue(product.name);
    const productItem = visibleProduct(page, product.id);
    await expect(productItem).toBeInViewport();
    if (await productItem.evaluate(element => element.tagName === "TR")) {
      const headers = productItem.locator("xpath=ancestor::table").getByRole("columnheader");
      if (family === "armatura") {
        await expect(headers).toHaveText([
          "Диаметр, мм", "Форма", "Марка стали", "Цена, ₽/т", "Масса, кг/м", "Длина, м", "Заказ, м", "Заказ, т", "Сумма", "Действие",
        ]);
        await expect(productItem.getByRole("rowheader")).toHaveText(String(product.diameterMm));
      } else if (family === "vgp") {
        await expect(headers).toHaveText([
          "Ду × стенка, мм", "Фото", "Наружный Ø, мм", "Длина, м", "Цена, ₽/т", "Заказ, м", "Заказ, т", "Сумма", "Действие",
        ]);
        await expect(productItem.getByRole("rowheader")).toBeVisible();
      } else {
        await expect(headers).toHaveText([
          "Наименование", "Изображение", "Характеристики", "Цена",
          ...(family === "balka" ? ["Заказ, м", "Заказ, т"] : [/^Кол-во(?:, м)?$/]),
          "Сумма", "Действие",
        ]);
        await expect(productItem.getByRole("rowheader")).toBeVisible();
      }
    } else {
      await expect(productItem.getByRole("heading", {level: 3})).toBeVisible();
    }
    if (family === "armatura") {
      await expect(page.getByRole("region", {name: "Продукция"}).locator("img")).toHaveCount(0);
      await expect(productItem.getByRole("textbox")).toHaveCount(2);
    }
    if (family === "mesh") {
      for (const label of ["Размер ячейки:", "Диаметр проволоки:", "Размер рулона / карты:"]) {
        await expect(productItem.getByText(label, {exact: true})).toBeVisible();
      }
    }
    if (family === "profnastil") {
      for (const label of ["Толщина, мм:", "Цвет / покрытие:", "Размер листа, м:"]) {
        await expect(productItem.getByText(label, {exact: true})).toBeVisible();
      }
    }
    await expect(productItem.getByRole("textbox").first()).toBeVisible();
    await expect(productItem.getByLabel(/^Сумма заказа для/)).toBeVisible();
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
  {family: "shveller", high: "1 000.51234", normalizedHigh: "1000,51", low: "500"},
  {family: "vgp", high: "54 000.51234", normalizedHigh: "54000,51", low: "53000"},
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
    for (const [field, value] of [[minimum, low], [maximum, normalizedHigh]] as const) {
      const accepted = await field.evaluate(element => {
        const clipboardData = new DataTransfer();
        clipboardData.setData("text/plain", "1\t2");
        return element.dispatchEvent(new ClipboardEvent("paste", {clipboardData, bubbles: true, cancelable: true}));
      });
      expect(accepted).toBe(false);
      await expect(field).toHaveValue(value);
    }

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

test("tread plate filters use the table dimensions and keep the ordering units", async ({page, isMobile}) => {
  await page.goto(productPath(samples.treadPlate, false));
  await expect(page.getByRole("heading", {name: "Лист рифлёный", level: 1})).toBeVisible();
  await openFilters(page);
  const format = page.getByRole("combobox", {name: "Размер листа", exact: true});
  const thickness = page.getByRole("combobox", {name: "Толщина", exact: true});
  const sheet = visibleProduct(page, "rozmet-28952");
  const area = visibleProduct(page, samples.treadPlate.id);
  await expect(sheet.getByRole(isMobile ? "heading" : "rowheader", {
    name: isMobile ? "Лист № 3 ТУ рифленый" : "№ 3 ТУ", exact: true,
  })).toBeVisible();
  await expect(sheet.getByRole("textbox", {name: /^Количество .+, шт\.$/})).toBeVisible();
  await format.selectOption("1500 × 6000 мм");
  await expect(sheet).toHaveCount(0);
  await expect(area.getByText("1500 × 6000 мм", {exact: true})).toBeVisible();
  await expect(area.getByRole("textbox", {name: /^Количество .+, м²$/})).toBeVisible();
  await thickness.selectOption("3 мм");
  await expect(page.getByText("Варианты не найдены", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  await expect(sheet).toBeVisible();
  await expect(area).toBeVisible();
});

test("galvanized sheets filter decimal thickness and keep per-sheet ordering", async ({page, isMobile}) => {
  await page.goto(productPath(samples.galvanizedSheet, false));
  await expect(page.getByRole("heading", {name: "Лист оцинкованный", level: 1})).toBeVisible();
  const thickness = page.getByRole("combobox", {name: "Толщина", exact: true});
  await openFilters(page);
  const format = page.getByRole("combobox", {name: "Размер листа", exact: true});
  const thin = visibleProduct(page, "rozmet-2181");
  const selected = visibleProduct(page, samples.galvanizedSheet.id);
  const thick = visibleProduct(page, "rozmet-2184");
  await format.selectOption("1250 × 2500 мм");
  await thickness.selectOption("0,7 мм");
  await expect(thin).toHaveCount(0);
  await expect(thick).toHaveCount(0);
  await expect(selected.getByRole(isMobile ? "heading" : "rowheader", {
    name: isMobile ? "Лист № 0,7 оцинкованный" : "№ 0,7", exact: true,
  })).toBeVisible();
  await expect(selected.getByText("1250 × 2500 мм", {exact: true})).toBeVisible();
  await expect(selected.getByRole("textbox", {name: /^Количество .+, шт\.$/})).toHaveAttribute("inputmode", "numeric");
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
  await expect(visibleProduct(page, id)).toBeInViewport();
});

test("catalog search ignores whitespace and keeps a long no-result query readable", async ({page, isMobile}) => {
  if (isMobile) await page.setViewportSize({width: 320, height: 568});
  await page.goto("/catalog");
  const query = page.getByRole("searchbox", {name: "Поисковый запрос"});
  await expect(query).toBeInViewport({ratio: 1});
  const results = page.getByRole("heading", {name: "Результаты поиска", exact: true});
  await query.fill("   ");
  await expect(results).toHaveCount(0);
  await query.press("Enter");
  await expect(query).toHaveValue("");
  const longQuery = "я".repeat(250);
  await query.fill(longQuery);
  await expect(page.getByRole("heading", {name: "Товары не найдены", exact: true})).toBeVisible();
  const status = page.getByRole("status").filter({hasText: "Найдено товаров"});
  await expect(status).toHaveText("Найдено товаров: 0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  await page.getByRole("button", {name: "Очистить поиск", exact: true}).click();
  await expect(query).toHaveValue("");
  await expect(query).toBeFocused();
  await expect(results).toHaveCount(0);
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
  const openMenu = page.getByRole("button", {name: "Открыть меню", exact: true});
  const menu = page.getByRole("navigation", {name: "Мобильная навигация"});
  await openMenu.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(openMenu).toBeFocused();
  await openMenu.click();
  await page.getByRole("heading", {name: "Швеллер", exact: true, level: 1}).click();
  await expect(menu).toBeHidden();
  await openMenu.click();
  const quoteLink = menu.getByRole("link", {name: "Запросить расчёт", exact: true});
  await quoteLink.press("Tab");
  await expect(menu).toBeHidden();
  await openMenu.click();
  await quoteLink.click();
  await expect(page).toHaveURL(/\/#request$/u);
  await expect(page.locator("#request")).toBeInViewport();
});

test("profile-sheet guidance follows product families in the rendered page", async ({page}) => {
  await page.goto("/catalog/profnastil");
  const families = page.getByRole("region", {name: "Типы продукции", exact: true});
  await expect(families.getByRole("heading", {level: 2})).toHaveText(["Профнастил С8", "Профнастил С20", "Профнастил Н75"]);
  await expect(families.getByText("Уточняется", {exact: true})).toHaveCount(0);
  const details = page.getByRole("region", {name: "Как подобрать профнастил", exact: true});
  await expect(details.getByRole("heading", {level: 3})).toHaveText(["Профиль и толщина", "Полезная ширина", "Покрытие и цвет"]);
  await expect(details.getByRole("paragraph")).toHaveText([
    /Для кровли и несущего настила дополнительно проверяют схему опирания, пролёты и расчётные нагрузки/,
    /Для расчёта площади учитывайте полезную ширину и нахлёсты/,
    /Для окрашенных листов сверьте код RAL и цвет видимой стороны/,
  ]);
  const familiesBox = await families.boundingBox();
  const detailsBox = await details.boundingBox();
  expect(familiesBox!.y + familiesBox!.height).toBeLessThanOrEqual(detailsBox!.y);
});

for (const family of ["armatura", "balka", "profile", "vgp", "profnastil", "mesh", "shveller", "ugolok", "kvadrat", "shtaketnik", "treadPlate", "galvanizedSheet", "coldRolledSheet", "hotRolledSheet"] as const) {
  test(`${family}: compact introduction keeps filters and results near the top`, async ({page, isMobile}) => {
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
    const parameters = page.getByRole("button", {name: "Параметры подбора", exact: true});
    if (isMobile) await expect(parameters).toHaveAttribute("aria-expanded", "false");
    else await expect(parameters).toBeHidden();
    const results = page.locator('[id^="variant-"]:visible').first();
    expect((await results.boundingBox())!.y).toBeLessThan(isMobile ? 1300 : 1200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
