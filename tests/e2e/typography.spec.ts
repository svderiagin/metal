import {test, expect, openProduct, samples, visibleProduct, seedCart} from "../browser";
import type {Locator} from "@playwright/test";

test("fields use a blue-gray focus underline and reserve red for validation errors", async ({page}, testInfo) => {
  const dark = testInfo.project.name.endsWith("dark");
  const neutral = dark ? "rgb(148, 163, 184)" : "rgb(71, 85, 105)";
  const error = dark ? "rgb(248, 113, 113)" : "rgb(220, 38, 38)";
  const underline = (color: string) => new RegExp(`${color.replace(/[()]/g, "\\$&")} 0px -2px 0px 0px inset`);
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "* { transition: none !important; }";
      document.head.append(style);
    });
  });
  async function checkPointerFocus(control: Locator) {
    await control.blur();
    await control.hover();
    const before = await control.evaluate(element => {
      const style = getComputedStyle(element);
      const {width, height} = element.getBoundingClientRect();
      return {border: style.borderColor, width, height};
    });
    await control.click();
    if (await control.evaluate(element => element.tagName === "SELECT")) await control.press("Escape");
    await expect(control).toBeFocused();
    await expect(control).toHaveCSS("outline-style", "none");
    const active = await control.evaluate(element => {
      const style = getComputedStyle(element);
      const {width, height} = element.getBoundingClientRect();
      return {border: style.borderColor, width, height};
    });
    expect(active).toEqual(before);
    const accent = await control.getAttribute("aria-invalid") === "true" ? error : neutral;
    await expect(control).toHaveCSS("box-shadow", underline(accent));
  }

  await seedCart(page);
  await openProduct(page, samples.treadPlate);
  const quantity = visibleProduct(page, samples.treadPlate.id).getByRole("textbox");
  await checkPointerFocus(quantity);
  await testInfo.attach("focused-product-field", {body: await visibleProduct(page, samples.treadPlate.id).screenshot(), contentType: "image/png"});
  await quantity.fill("-1");
  await expect(quantity).toHaveCSS("box-shadow", underline(error));
  await quantity.fill("2");
  await expect(quantity).toHaveCSS("box-shadow", underline(neutral));
  await quantity.blur();
  await expect(quantity).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\) 0px -2px 0px 0px inset/);
  await quantity.click();
  await quantity.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(quantity).toBeFocused();
  await expect(quantity).toHaveCSS("outline-style", "solid");
  await expect(quantity).toHaveCSS("outline-width", "3px");
  await expect(quantity).toHaveCSS("outline-color", neutral);
  await checkPointerFocus(quantity);
  await checkPointerFocus(page.getByLabel("Поиск товаров", {exact: true}));
  await checkPointerFocus(page.getByRole("combobox", {name: "Сортировка", exact: true}));
  const quoteName = page.getByRole("textbox", {name: /^Имя \*/});
  await quoteName.fill("1");
  await quoteName.blur();
  await expect(quoteName).toHaveAttribute("aria-invalid", "true");
  await checkPointerFocus(quoteName);
  await checkPointerFocus(page.getByRole("textbox", {name: /^Что требуется рассчитать/}));

  await page.goto("/contacts");
  await checkPointerFocus(page.getByRole("textbox", {name: "Сообщение *", exact: true}));
  await page.goto("/cart");
  const cartLine = page.locator(`[data-cart-row="${samples.shveller.id}"]`);
  await checkPointerFocus(cartLine.getByRole("textbox", {name: `Длина ${samples.shveller.name}, м`, exact: true}));
  await page.goto("/checkout");
  await checkPointerFocus(page.getByLabel("ФИО *", {exact: true}));
  await checkPointerFocus(page.getByLabel("Комментарий", {exact: true}));
});

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
  await page.getByRole("link", {name: "Как выбрать", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Как выбрать арматуру", exact: true})).toBeInViewport();
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
  const descriptionLink = page.getByRole("link", {name: "Как выбрать", exact: true});
  await descriptionLink.focus();
  await descriptionLink.press("Enter");
  const detailsHeading = page.getByRole("heading", {name: "Как выбрать арматуру", exact: true});
  await expect(detailsHeading).toBeInViewport();
  await expect(page.getByRole("region").filter({has: detailsHeading}))
    .toContainText("Сопоставьте класс, профиль поверхности, диаметр и длину с проектом.");
});
