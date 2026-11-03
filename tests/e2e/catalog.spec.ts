import {test, expect, openProduct, samples, visibleProduct, productPath} from "../browser";
import {getAllCategories, getAllProductTypes} from "../../lib/catalog";

test("every category and product-family route responds without a missing page", async ({request}) => {
  const paths = new Set([...getAllCategories().map(category => `/catalog/${category.slug}`),
    ...getAllProductTypes().map(type => productPath({...samples.shveller, productTypeId: type.id}, false))]);
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
});

for (const family of ["shveller", "ugolok", "kvadrat", "armatura", "balka", "profile", "vgp", "profnastil", "mesh"] as const) {
  test(`${family}: linked product is visible and filters reset`, async ({page}) => {
    const product = samples[family];
    await openProduct(page, product);
    const query = page.getByLabel("Поиск товаров", {exact: true}).filter({visible: true});
    await expect(query).toHaveValue(product.name);
    await query.fill("нет-такого-товара-zzzzzz");
    await expect(page.getByText("Варианты не найдены", {exact: true})).toBeVisible();
    await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
    await expect(query).toHaveValue("");
    await expect(visibleProduct(page, product.id)).toBeVisible();
  });
}

test("channel section filter contains profile numbers and is independent of length", async ({page}) => {
  await openProduct(page);
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  const section = page.getByRole("combobox", {name: "Номер профиля", exact: true});
  await section.selectOption("6,5");
  await expect(visibleProduct(page, "rozmet-2236")).toBeVisible();
  await expect(visibleProduct(page, "rozmet-2235")).toHaveCount(0);
  await expect(page.getByRole("combobox", {name: "Длина по каталогу", exact: true})).toBeVisible();
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
  const categoryToggle = page.locator("details").filter({has: page.locator("summary", {hasText: "Разделы каталога"})}).first();
  await expect(categoryToggle).not.toHaveAttribute("open");
  const heading = await page.getByRole("heading", {name: "Швеллер", exact: true, level: 1}).boundingBox();
  expect(heading!.y).toBeLessThan(600);
  await categoryToggle.locator("summary").click();
  await expect(categoryToggle.getByRole("navigation", {name: "Категории"})).toBeVisible();
  await page.getByRole("button", {name: "Открыть меню", exact: true}).click();
  await expect(page.getByRole("navigation", {name: "Мобильная навигация"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", {name: "Открыть меню", exact: true})).toBeFocused();
});

test("profile-sheet guidance follows product families in the rendered page", async ({page}) => {
  await page.goto("/catalog/profnastil");
  const families = await page.getByRole("region", {name: "Типы продукции", exact: true}).boundingBox();
  const details = await page.getByRole("heading", {name: "Как выбрать профнастил", exact: true}).boundingBox();
  expect(families!.y + families!.height).toBeLessThanOrEqual(details!.y);
});
