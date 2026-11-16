import type {Page} from "@playwright/test";
import {test, expect, openProduct, samples, visibleProduct} from "../browser";
import {AUTO_ROTATE_MS, HERO_SLIDES} from "../../data/hero-slides";
import {getProductIllustration} from "../../lib/productPreviewImage";

const heroSelector = 'section[aria-labelledby="home-hero-title"]';
const heroFrameRequest = /\/images\/prepared\/hero\/(\d+)\/[^/]+$/;
const activeFrame = (page: Page) => page.locator(`${heroSelector} img[data-active="true"]`);
const activeSource = (page: Page) => activeFrame(page).evaluateAll(images => (images[0] as HTMLImageElement | undefined)?.currentSrc ?? "");
const nextFrame = (page: Page) => page.getByRole("button", {name: "Следующая фотография", exact: true});

test("landing photos use responsive static AVIF and WebP files", async ({page, request}) => {
  await page.goto("/");
  const hero = activeFrame(page);
  await expect(hero).toHaveAttribute("fetchpriority", "high");
  const heroSource = await hero.evaluate(async element => {
    const image = element as HTMLImageElement;
    await image.decode();
    return {avif: image.currentSrc, webp: image.src};
  });
  expect(heroSource.avif).toMatch(/\/images\/prepared\/hero\/1\/\d+-[a-f0-9]+\.avif$/);
  expect(heroSource.webp).toMatch(/\/images\/prepared\/hero\/1\/\d+-[a-f0-9]+\.webp$/);
  for (const [format, url] of Object.entries(heroSource)) {
    const response = await request.get(url);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toBe(`image/${format}`);
    expect(response.headers()["cache-control"]).toContain("immutable");
  }

  for (const path of ["/", "/catalog", "/catalog/armatura"]) {
    await page.goto(path);
    const photo = page.locator('main img[loading="lazy"]').first();
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate(async element => {
      const image = element as HTMLImageElement;
      await image.decode();
      return image.currentSrc;
    })).toContain("/images/prepared/catalog/");
  }
});

test("carousel recovers a first frame that loaded before hydration", async ({page}) => {
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve; });
  await page.route("**/_next/static/**/*.js", async route => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto("/", {waitUntil: "commit"});
    await activeFrame(page).evaluate(image => (image as HTMLImageElement).decode());
    await expect(page.locator(`${heroSelector} img`)).toHaveCount(1);
    await expect(nextFrame(page)).toHaveCount(0);
  } finally {
    releaseScripts();
  }
  await expect(nextFrame(page)).toBeVisible();
  await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/1/");
});

test("carousel rotates through every frame, pauses on focus and supports keyboard navigation", async ({page}) => {
  await page.emulateMedia({reducedMotion: "no-preference"});
  await page.clock.install();
  await page.goto("/");
  for (const index of HERO_SLIDES.keys()) {
    await expect.poll(() => activeSource(page)).toContain(`/images/prepared/hero/${index + 1}/`);
  }
  await nextFrame(page).focus();
  await expect(nextFrame(page)).toBeFocused();
  const paused = await activeSource(page);
  await page.clock.fastForward(AUTO_ROTATE_MS * 2);
  expect(await activeSource(page)).toBe(paused);
  await nextFrame(page).press("Enter");
  await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/1/");
});

test("reduced motion prepares the next frame without requesting the rest or advancing", async ({page}) => {
  await page.clock.install();
  const loaded = new Set<number>();
  page.on("request", request => {
    const frame = request.url().match(heroFrameRequest);
    if (frame) loaded.add(Number(frame[1]));
  });
  await page.goto("/");
  await expect(nextFrame(page)).toBeVisible();
  await page.clock.fastForward(AUTO_ROTATE_MS * 2);
  await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/1/");
  expect([...loaded]).toEqual([1, 2]);
  await nextFrame(page).click();
  await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/2/");
});

for (const usable of [[], [2], [2, 4, 5]]) {
  test(`carousel recovers with ${usable.length} decodable frames`, async ({page}) => {
    const requests = new Set<number>();
    await page.route(heroFrameRequest, async route => {
      const index = Number(route.request().url().match(heroFrameRequest)![1]);
      requests.add(index);
      if (usable.includes(index)) await route.continue();
      else await route.fulfill({contentType: "image/avif", body: "Undecodable photo"});
    });
    await page.goto("/");
    const hero = page.locator(heroSelector);
    await expect(hero.getByRole("heading", {level: 1})).toBeVisible();
    await expect(hero.getByRole("link", {name: "Каталог", exact: true})).toBeVisible();
    if (usable.length < 2) {
      await expect.poll(() => requests.size).toBe(HERO_SLIDES.length);
      await expect(hero.locator("img")).toHaveCount(usable.length);
      await expect(nextFrame(page)).toHaveCount(0);
      if (usable.length) await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/2/");
      return;
    }

    await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/2/");
    await nextFrame(page).click();
    await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/4/");
    await expect.poll(() => hero.locator("img").evaluateAll(images =>
      images.filter(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0).length)).toBe(usable.length);
    await nextFrame(page).click();
    await expect.poll(() => activeSource(page)).toContain("/images/prepared/hero/5/");
  });
}

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

for (const family of ["balka", "profile", "vgp", "profnastil", "mesh", "shtaketnik"] as const) {
  test(`${family}: the illustrated table shows the SKU dimensions in its thumbnail and viewer`, async ({page}) => {
    const product = samples[family];
    const illustration = getProductIllustration(product)!;
    expect(illustration, "an approved illustration exists for the sample SKU").toBeTruthy();
    await openProduct(page, product);
    const thumbnail = visibleProduct(page, product.id).getByRole("button", {name: `Увеличить изображение: ${product.name}`, exact: true});
    await expect.poll(() => thumbnail.getByRole("img").evaluate(element => {
      const url = new URL((element as HTMLImageElement).src);
      return (url.searchParams.get("url") ?? url.pathname).split("?")[0];
    })).toBe(illustration.imageUrl);
    await thumbnail.click();
    const dialog = page.getByRole("dialog", {name: `Просмотр изображения: ${product.name}`, exact: true});
    await expect.poll(() => dialog.getByRole("img").evaluate(element => decodeURI(new URL((element as HTMLImageElement).src).pathname))).toBe(illustration.imageUrl);
    await page.keyboard.press("Escape");
    await expect(thumbnail).toBeFocused();
  });
}
