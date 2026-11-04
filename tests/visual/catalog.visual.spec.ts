import {test, expect, openProduct, samples, seedCart, settleImages, visibleProduct} from "../browser";

test("home and catalog first-screen layout", async ({page}) => {
  for (const [path, name] of [["/", "home"], ["/catalog", "catalog"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", {level: 1})).toBeVisible();
    if (name === "home") await expect(page.getByRole("button", {name: "Следующая фотография", exact: true})).toBeVisible();
    await settleImages(page);
    await expect(page).toHaveScreenshot(`${name}.png`);
  }
});

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
    await openProduct(page, samples[family]);
    const regionName = family === "mesh" ? "Сетка металлическая" : family === "profnastil" ? "Профнастил" : "Продукция";
    const region = page.getByRole("region", {name: regionName, exact: true});
    await region.scrollIntoViewIfNeeded();
    await settleImages(page);
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
  await settleImages(page);
  await expect(dialog).toHaveScreenshot("image-viewer-fit.png");
  await zoom.click();
  await expect(zoom).toHaveAttribute("aria-pressed", "true");
  await settleImages(page);
  await expect(dialog).toHaveScreenshot("image-viewer-native.png");
});

test("cart and checkout layout with a real catalog product", async ({page}) => {
  await seedCart(page);
  for (const [path, name] of [["/cart", "cart"], ["/checkout", "checkout"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", {level: 1})).toBeVisible();
    if (name === "cart") await expect(page.getByLabel("Количество товара", {exact: true})).toHaveValue("3");
    else await expect(page.getByLabel("ФИО *", {exact: true})).toBeVisible();
    await settleImages(page);
    await expect(page.getByRole("main")).toHaveScreenshot(`${name}.png`);
  }
});
