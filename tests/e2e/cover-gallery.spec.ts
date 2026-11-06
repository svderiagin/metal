import {test, expect, productPath, samples} from "../browser";
import {getCategoryBySlug, getProductTypesByCategoryId} from "../../lib/catalog";
import {getCatalogCoverImages} from "../../lib/catalogCoverImages";

const titleButton = "button[aria-label^='Увеличить титульное изображение:']";
const titleDialog = {name: /^Просмотр титульных фотографий:/};

for (const [layout, route, hasGallery] of [
  ["banner", "/catalog/armatura", true], ["compact with one photo", "/catalog/polosa", false],
  ["direct products", "/catalog/shveller", true], ["product family", productPath(samples.armatura, false), true],
] as const) {
  test(`${layout}: title opens above the page and closes with photo, Escape and close control`, async ({page, context}) => {
    await page.goto(route);
    const trigger = page.locator(titleButton);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveCSS("cursor", "zoom-in");
    const url = page.url();
    const overflow = await page.evaluate(() => document.documentElement.style.overflow);
    await trigger.click();
    const dialog = page.getByRole("dialog", titleDialog);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("border-radius", "28px");
    await expect(dialog.getByRole("button", {name: "Следующее фото", exact: true})).toHaveCount(hasGallery ? 1 : 0);
    expect(context.pages()).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
    const photo = dialog.getByRole("button", {name: /^Вернуть изображение на страницу:/});
    await expect(photo).toBeFocused();
    await expect(photo).toHaveCSS("cursor", "zoom-out");
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", {name: "Закрыть просмотр титульного фото", exact: true})).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(photo).toBeFocused();
    await photo.click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe(overflow);
    await trigger.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole("button", {name: "Закрыть просмотр титульного фото", exact: true}).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(page.url()).toBe(url);
  });
}

test("title viewer fits narrow and landscape screens, pans at 1:1 and closes on the backdrop", async ({page}) => {
  await page.goto("/catalog/armatura");
  await page.locator(titleButton).click();
  const dialog = page.getByRole("dialog", titleDialog);
  const picture = dialog.getByRole("img");
  const zoom = dialog.getByRole("button", {name: "Показать титульное фото в масштабе 1:1", exact: true});
  await expect(zoom).toBeEnabled();
  const nativeWidth = await picture.evaluate(image => (image as HTMLImageElement).naturalWidth);
  await zoom.click();
  await expect.poll(async () => (await picture.boundingBox())!.width).toBe(nativeWidth);
  const transform = () => picture.evaluate(image => image.parentElement!.style.transform);
  const before = await transform();
  await page.keyboard.press("ArrowRight");
  await expect.poll(transform).not.toBe(before);
  const keyboardPan = await transform();
  const surface = dialog.getByRole("button", {name: /^Вернуть изображение на страницу:/});
  const box = (await surface.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2, {steps: 5});
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await expect.poll(transform).not.toBe(keyboardPan);
  await dialog.getByRole("button", {name: "Вписать титульное фото в окно", exact: true}).click();
  for (const viewport of [{width: 320, height: 700}, {width: 844, height: 390}]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const bounds = (await dialog.boundingBox())!;
      return bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width && bounds.y + bounds.height <= viewport.height;
    }).toBe(true);
  }
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(titleButton)).toBeFocused();
});

test("failed full-size title photo remains dismissible", async ({page}) => {
  await page.goto("/catalog/armatura");
  await page.route(url => url.pathname.startsWith("/images/catalog/"), route => route.abort());
  await page.locator(titleButton).click();
  const dialog = page.getByRole("dialog", titleDialog);
  await expect(dialog.getByRole("alert")).toContainText("Не удалось загрузить фото");
  await dialog.getByRole("button", {name: /^Вернуть изображение на страницу:/}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(titleButton)).toBeFocused();
});

test("galvanized sheet title gallery cycles through its own photographs", async ({page}) => {
  await page.goto(productPath(samples.galvanizedSheet, false));
  const trigger = page.locator(titleButton);
  await trigger.click();
  const dialog = page.getByRole("dialog", titleDialog);
  const picture = dialog.getByRole("img");
  await expect(picture).toHaveAttribute("src", /\/harcelik\.webp\?v=[a-f0-9]{12}$/);
  await dialog.getByRole("button", {name: "Предыдущее фото", exact: true}).click();
  await expect(dialog.getByRole("status").filter({hasText: /8\s*\/\s*из\s*8/})).toBeVisible();
  await expect(picture).toHaveAttribute("src", /\/marketstal-surface\.webp\?v=[a-f0-9]{12}$/);
  await page.keyboard.press("ArrowRight");
  await expect(picture).toHaveAttribute("src", /\/harcelik\.webp\?v=[a-f0-9]{12}$/);
  await dialog.getByRole("button", {name: "Следующее фото", exact: true}).click();
  await expect(picture).toHaveAttribute("src", /\/marketstal-warehouse\.webp\?v=[a-f0-9]{12}$/);
  await dialog.getByRole("button", {name: /^Вернуть изображение на страницу:/}).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger.locator("img")).toHaveAttribute("alt", "Лист оцинкованный — фото 2");
});

const nestedGallerySlugs = ["armatura", "truby-profilnye", "truba-kruglaya", "profnastil", "setka-metallicheskaya", "balka"];
const nestedGalleryPages = nestedGallerySlugs.flatMap(slug => {
  const {id} = getCategoryBySlug(slug)!;
  return getProductTypesByCategoryId(id).map(type => {
    const subcategoryRoute = `/catalog/${slug}/${type.subcategorySlug}`;
    return {name: type.name, route: `${subcategoryRoute}/${type.slug}`, subcategoryRoute, id: type.id, cover: type.imageUrl ?? ""};
  });
});

const coverGalleryPages = [
  ...(["coldRolledSheet", "treadPlate", "hotRolledSheet"] as const).map(family => {
    const sample = samples[family];
    return {name: family, route: productPath(sample, false), id: sample.productTypeId, cover: ""};
  }),
  ...["shveller", "ugolok", "kvadrat", ...nestedGallerySlugs].map(slug => {
    const category = getCategoryBySlug(slug)!;
    const cover = slug === "truby-profilnye" ? "/images/catalog/truby-profilnye/trubi-main.jpg" : category.imageUrl;
    return {name: category.name, route: `/catalog/${slug}`, id: category.id, cover};
  }),
  ...nestedGalleryPages,
];

for (const {name, route, id, cover} of coverGalleryPages) {
  test(`${name}: title gallery opens and cycles through all photos`, async ({page}) => {
    const frames = getCatalogCoverImages(id, cover);
    expect(frames.length).toBeGreaterThan(1);
    await page.goto(route);
    const trigger = page.locator(titleButton);
    await trigger.click();
    const dialog = page.getByRole("dialog", titleDialog);
    const picture = dialog.getByRole("img");
    const next = dialog.getByRole("button", {name: "Следующее фото", exact: true});
    const source = async () => decodeURI(await picture.getAttribute("src") ?? "");
    for (const frame of frames) {
      await expect.poll(source).toContain(`${frame}?v=`);
      await expect.poll(() => picture.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await next.click();
    }
    await expect.poll(source).toContain(`${frames[0]}?v=`);
    await page.keyboard.press("ArrowLeft");
    await expect.poll(source).toContain(`${frames.at(-1)}?v=`);
    await dialog.getByRole("button", {name: /^Вернуть изображение на страницу:/}).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test("subcategory overview shows the same title gallery as its product family", async ({page}) => {
  const family = nestedGalleryPages.find(entry => entry.id === samples.armatura.productTypeId)!;
  const frames = getCatalogCoverImages(family.id, family.cover);
  await page.goto(family.subcategoryRoute);
  const trigger = page.locator(titleButton);
  await trigger.click();
  const dialog = page.getByRole("dialog", titleDialog);
  const picture = dialog.getByRole("img");
  const source = async () => decodeURI(await picture.getAttribute("src") ?? "");
  await expect.poll(source).toContain(`${frames[0]}?v=`);
  await dialog.getByRole("button", {name: "Следующее фото", exact: true}).click();
  await expect.poll(source).toContain(`${frames[1]}?v=`);
});
