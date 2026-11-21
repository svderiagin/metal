import {test, expect, openProduct, productPath, samples, seedCart, settleImages, visibleProduct} from "../browser";
import {ORDER_STORAGE_KEY} from "../../lib/constants";

for (const [path, name] of [["/", "home"], ["/catalog", "catalog"]]) {
  test(`${name} first-screen layout`, async ({page}) => {
    await page.goto(path);
    await expect(page.getByRole("heading", {level: 1})).toBeVisible();
    if (name === "home") await expect(page.getByRole("button", {name: "Следующая фотография", exact: true})).toBeVisible();
    await settleImages(page);
    await expect(page).toHaveScreenshot(`${name}.png`);
  });
}

test("armatura category cover and introduction", async ({page}) => {
  await page.goto("/catalog/armatura");
  await expect(page.getByRole("heading", {level: 1, name: "Арматура", exact: true})).toBeVisible();
  await settleImages(page);
  await expect(page).toHaveScreenshot("armatura-category.png");
});

test("title photo viewer uses a rounded frame and the original aspect ratio", async ({page}) => {
  await page.goto("/catalog/armatura");
  await page.getByRole("button", {name: "Увеличить титульное изображение: Арматура", exact: true}).click();
  const dialog = page.getByRole("dialog", {name: "Просмотр титульных фотографий: Арматура", exact: true});
  await expect(dialog.getByRole("button", {name: "Показать титульное фото в масштабе 1:1", exact: true})).toBeEnabled();
  await settleImages(page);
  await expect(page).toHaveScreenshot("cover-viewer.png");
});

for (const family of ["shveller", "ugolok", "kvadrat", "armatura", "balka", "profile", "vgp", "profnastil", "mesh"] as const) {
  test(`${family} table or card geometry`, async ({page}) => {
    const regionName = family === "mesh" ? "Сетка металлическая" : family === "profnastil" ? "Профнастил" : "Продукция";
    const region = page.getByRole("region", {name: regionName, exact: true});
    if (family === "vgp") {
      // Capture the header in table flow. The product anchor can scroll it into its sticky position.
      await page.goto(productPath(samples.vgp, false));
      await page.getByLabel("Поиск товаров", {exact: true}).filter({visible: true}).fill(samples.vgp.sku);
      await expect(region.locator('tbody tr[id^="variant-"]:visible, article[id^="variant-mobile-"]:visible')).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      await region.evaluate(element => element.scrollIntoView({block: "center", behavior: "instant"}));
    } else {
      await openProduct(page, samples[family]);
      await region.scrollIntoViewIfNeeded();
    }
    await settleImages(page, region);
    if (family === "shveller" && process.env.VISUAL_REGRESSION_PROBE === "1") {
      await page.addStyleTag({content: "table th:first-child, table td:first-child { padding-left: 48px !important; }"});
    }
    await expect(region).toHaveScreenshot(`${family}-products.png`);
  });
}

test("rounded product viewer fits the original and zooms 1:1", async ({page}) => {
  await openProduct(page);
  await visibleProduct(page, samples.shveller.id).getByRole("button", {name: "Увеличить изображение: Швеллер № 5", exact: true}).click();
  const dialog = page.getByRole("dialog", {name: "Просмотр изображения: Швеллер № 5", exact: true});
  const zoom = dialog.getByRole("button", {name: "Увеличение изображения", exact: true});
  await expect(zoom).toBeEnabled();
  await settleImages(page, dialog);
  await expect(dialog).toHaveScreenshot("image-viewer-fit.png");
  await zoom.click();
  await expect(zoom).toHaveAttribute("aria-pressed", "true");
  await settleImages(page, dialog);
  await expect(dialog).toHaveScreenshot("image-viewer-native.png");
});

test("profile pipe illustration in the viewer", async ({page}) => {
  const product = samples.profile;
  await openProduct(page, product);
  const thumbnail = visibleProduct(page, product.id).getByRole("button", {name: `Увеличить изображение: ${product.name}`, exact: true});
  await thumbnail.click();
  const dialog = page.getByRole("dialog", {name: `Просмотр изображения: ${product.name}`, exact: true});
  await expect(dialog.getByRole("button", {name: "Увеличение изображения", exact: true})).toBeEnabled();
  await settleImages(page, dialog);
  // Isolate the dialog corners from unrelated scroll and content behind the overlay.
  await page.addStyleTag({content: "dialog[open]::backdrop { background-color: #000; }"});
  await expect(dialog).toHaveScreenshot("annotated-profile-viewer.png");
});

for (const [path, name] of [["/cart", "cart"], ["/checkout", "checkout"]]) {
  test(`${name} layout with a catalog product`, async ({page}) => {
    await seedCart(page);
    await page.goto(path);
    await expect(page.getByRole("heading", {level: 1})).toBeVisible();
    if (name === "cart") await expect(page.locator(`[data-cart-row="${samples.shveller.id}"]`).getByRole("textbox", {name: /^Длина /})).toHaveValue("3");
    else await expect(page.getByLabel("ФИО *", {exact: true})).toBeVisible();
    await settleImages(page);
    await expect(page.getByRole("main")).toHaveScreenshot(`${name}.png`);
  });
}

test("invoice confirmation with separate numbers and download action", async ({page}) => {
  await page.addInitScript(key => {
    sessionStorage.setItem(key, JSON.stringify({orderNumber: "3645789245", paymentMethod: "INVOICE",
      email: "audit@example.invalid", invoice: {number: "2677024476", downloadToken: "a".repeat(64), emailStatus: "FAILED", isPreview: false}}));
  }, ORDER_STORAGE_KEY);
  await page.goto("/order/success");
  await expect(page.getByRole("button", {name: "Скачать счёт PDF", exact: true})).toBeVisible();
  const main = page.getByRole("main");
  await settleImages(page, main);
  await expect(main).toHaveScreenshot("invoice-confirmation.png");
});
