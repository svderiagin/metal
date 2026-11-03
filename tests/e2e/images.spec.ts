import {test, expect, openProduct, samples, visibleProduct} from "../browser";

test("thumbnail has no fractional gap; modal retains native zoom, keyboard pan and focus", async ({page}) => {
  await openProduct(page);
  const thumbnail = visibleProduct(page, samples.shveller.id).getByRole("button", {name: "Увеличить изображение: Швеллер № 5", exact: true});
  const imageBox = await thumbnail.locator("img").boundingBox();
  expect(Math.abs(imageBox!.width - imageBox!.height * 4 / 3)).toBeLessThan(.05);
  await thumbnail.click();
  const dialog = page.getByRole("dialog", {name: "Просмотр изображения: Швеллер № 5", exact: true});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", {name: "Следующее изображение", exact: true})).toHaveCount(0);
  await expect(dialog.getByRole("button", {name: "Увеличение изображения", exact: true})).toBeEnabled();
  const picture = dialog.getByRole("img", {name: "Швеллер № 5", exact: true});
  expect(await picture.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(2400);
  await dialog.getByRole("button", {name: "Увеличение изображения", exact: true}).click();
  await expect(dialog.getByRole("button", {name: "Увеличение изображения", exact: true})).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await picture.boundingBox())!.width).toBe(2400);
  const before = await picture.evaluate(image => image.parentElement!.style.transform);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => picture.evaluate(image => image.parentElement!.style.transform)).not.toBe(before);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(thumbnail).toBeFocused();
});

test("open modal survives table/card breakpoints and restores the visible thumbnail", async ({page}) => {
  await openProduct(page);
  await visibleProduct(page, samples.shveller.id).getByRole("button", {name: "Увеличить изображение: Швеллер № 5", exact: true}).click();
  await page.setViewportSize({width: 320, height: 700});
  const dialog = page.getByRole("dialog", {name: "Просмотр изображения: Швеллер № 5", exact: true});
  await expect(dialog).toBeVisible();
  let bounds = await dialog.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.height).toBeLessThanOrEqual(700);
  await page.setViewportSize({width: 844, height: 390});
  bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(visibleProduct(page, samples.shveller.id).getByRole("button", {name: "Увеличить изображение: Швеллер № 5", exact: true})).toBeFocused();
});
