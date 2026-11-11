import {test, expect, openProduct, samples, visibleProduct} from "../browser";
import type {Locator} from "@playwright/test";

async function readable(control: Locator, mode: "text" | "placeholder" | "border" = "text") {
  const colors = await control.evaluate((element, mode) => {
    const context = document.createElement("canvas").getContext("2d", {willReadFrequently: true})!;
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const style = getComputedStyle(element, mode === "placeholder" ? "::placeholder" : null);
    const foreground = rgba(mode === "border" ? style.borderTopColor : style.color);
    if (mode === "placeholder" && Number(style.opacity) !== 1) throw new Error("Placeholder opacity must preserve its measured contrast");
    let parent: Element | null = mode === "border" ? element.parentElement : element;
    let background: number[] = [255, 255, 255, 255];
    while (parent) {
      const color = rgba(getComputedStyle(parent).backgroundColor);
      if (color[3] === 255) {background = color; break;}
      parent = parent.parentElement;
    }
    const luminance = (color: number[]) => color.slice(0, 3).map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
    const front = luminance(foreground), back = luminance(background);
    return {contrast: (Math.max(front, back) + .05) / (Math.min(front, back) + .05), foreground, background};
  }, mode);
  expect(colors.contrast, JSON.stringify(colors)).toBeGreaterThanOrEqual(mode === "border" ? 3 : 4.5);
}

test("primary and secondary actions keep contrast and restrained corners in both themes", async ({page}) => {
  await page.goto("/");
  const hero = page.getByRole("region", {name: /^Металлопрокат/});
  const primary = hero.getByRole("link", {name: "Каталог", exact: true});
  const secondary = hero.getByRole("link", {name: "Расчёт заказа", exact: true});
  for (const action of [primary, secondary]) {
    await readable(action);
    expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await action.evaluate(element => parseFloat(getComputedStyle(element).borderRadius))).toBeLessThanOrEqual(6);
  }
});

test("table actions preserve contrast across add, saved, update and remove states", async ({page}) => {
  await openProduct(page);
  const row = visibleProduct(page, samples.shveller.id);
  const quantity = row.getByRole("textbox", {name: /^Количество /});
  await readable(row.getByRole("button", {name: "В корзину", exact: true}));
  await row.getByRole("button", {name: "В корзину", exact: true}).click();
  await readable(row.getByRole("button", {name: "В корзине", exact: true}));
  await quantity.fill("2");
  await readable(row.getByRole("button", {name: "Обновить", exact: true}));
  await quantity.fill("0");
  await readable(row.getByRole("button", {name: "Удалить", exact: true}));
  const filters = page.getByRole("heading", {name: "Фильтры", exact: true}).locator("..");
  const products = page.getByRole("region", {name: "Продукция", exact: true});
  expect(Math.abs((await filters.boundingBox())!.width - (await products.boundingBox())!.width)).toBeLessThan(1);
});

test("table and card boundaries fit narrow and intermediate screens", async ({page}) => {
  await openProduct(page);
  for (const width of [320, 1024, 1279, 1280]) {
    await page.setViewportSize({width, height: 1000});
    await expect(visibleProduct(page, samples.shveller.id)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("quote placeholders and input boundaries remain readable", async ({page}) => {
  await page.goto("/");
  const name = page.getByRole("textbox", {name: /^Имя \*/});
  const message = page.getByRole("textbox", {name: /^Что требуется рассчитать/});
  for (const input of [name, message]) {
    await readable(input, "placeholder");
    await readable(input, "border");
  }
});
