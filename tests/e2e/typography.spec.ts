import {test, expect} from "../browser";

test("local Cyrillic font loads and catalog controls keep readable text", async ({page}) => {
  const fontRequests: string[] = [];
  page.on("request", request => {
    if (request.resourceType() === "font") fontRequests.push(request.url());
  });
  await page.goto("/catalog/shveller");
  await expect(page.getByLabel("Поиск товаров", {exact: true})).toBeVisible();
  const typography = await page.evaluate(async () => {
    await document.fonts.ready;
    const family = getComputedStyle(document.body).fontFamily.split(",")[0].trim().replace(/["']/g, "");
    const loaded = [...document.fonts].some(face => face.family.replace(/["']/g, "") === family && face.status === "loaded");
    const sizes = [...document.querySelectorAll("input:not([type=checkbox]):not([type=radio]), select, textarea")]
      .filter(element => element.getBoundingClientRect().width > 0)
      .map(element => Number.parseFloat(getComputedStyle(element).fontSize));
    return {family, loaded, sizes, origin: location.origin};
  });
  expect(typography.loaded, `primary font ${typography.family} loaded`).toBe(true);
  expect(typography.sizes.length).toBeGreaterThan(0);
  expect(typography.sizes.every(size => size >= 16), "visible inputs and selects are at least 16 px").toBe(true);
  expect(fontRequests.length).toBeGreaterThan(0);
  expect(fontRequests.every(url => new URL(url).origin === typography.origin)).toBe(true);
});

test("font fallback preserves the category and products", async ({page}) => {
  await page.route("**/*.woff2", route => route.abort());
  await page.goto("/catalog/armatura");
  await expect(page.getByRole("heading", {level: 1, name: "Арматура", exact: true})).toBeVisible();
  const products = page.getByRole("region", {name: "Типы продукции", exact: true});
  await expect(products.getByRole("article")).toHaveCount(4);
  await expect(products.getByRole("link").first()).toBeVisible();
  await page.getByRole("link", {name: "Подробнее о категории", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Подробнее о категории «Арматура»", exact: true})).toBeInViewport();
});

test("enlarged and spaced text preserves category content and actions", async ({page}) => {
  await page.goto("/catalog/armatura");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({content: `
    html { font-size: 200% !important; }
    body * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
    p { margin-bottom: 2em !important; }
  `});
  await expect(page.getByRole("heading", {name: "Арматура", exact: true, level: 1})).toBeVisible();
  const overflow = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth > innerWidth,
    elements: [...document.querySelectorAll("body *")]
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 20 && rect.height > 0 && rect.right > innerWidth + 1;
      })
      .slice(0, 8).map(element => ({tag: element.tagName, text: element.textContent?.slice(0, 80)})),
  }));
  expect(overflow.page, JSON.stringify(overflow.elements)).toBe(false);
  const products = page.getByRole("region", {name: "Типы продукции", exact: true});
  await expect(products.getByRole("article")).toHaveCount(4);
  const descriptionLink = page.getByRole("link", {name: "Подробнее о категории", exact: true});
  await descriptionLink.focus();
  await descriptionLink.press("Enter");
  await expect(page.getByRole("heading", {name: "Подробнее о категории «Арматура»", exact: true})).toBeInViewport();
  await expect(page.getByRole("region", {name: "Подробнее о категории «Арматура»", exact: true}))
    .toContainText("При выборе учитывают класс прочности, диаметр, длину и требования проекта.");
});
