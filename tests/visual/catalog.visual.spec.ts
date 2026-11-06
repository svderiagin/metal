import {test, expect, openProduct, samples, seedCart, settleImages, visibleProduct} from "../browser";
import {getProductIllustration} from "../../lib/productPreviewImage";

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

test("profile pipe uses a clean thumbnail and shows the annotated product in its viewer", async ({page}) => {
  const product = samples.profile;
  const illustration = getProductIllustration(product)!;
  await openProduct(page, product);
  const thumbnail = visibleProduct(page, product.id).getByRole("button", {name: `Увеличить изображение: ${product.name}`, exact: true});
  await expect.poll(() => thumbnail.getByRole("img").evaluate(element => {
    const address = new URL((element as HTMLImageElement).src);
    return decodeURI((address.searchParams.get("url") ?? address.pathname).split("?")[0]);
  })).toBe(illustration.photoUrl);
  await thumbnail.click();
  const dialog = page.getByRole("dialog", {name: `Просмотр изображения: ${product.name}`, exact: true});
  const image = dialog.getByRole("img");
  await expect.poll(() => image.evaluate(element => decodeURI(new URL((element as HTMLImageElement).src).pathname))).toBe(illustration.imageUrl);
  await expect(dialog.getByRole("button", {name: "Увеличение изображения", exact: true})).toBeEnabled();
  await image.evaluate(element => (element as HTMLImageElement).decode());
  await page.mouse.move(0, 0);
  // Isolate the dialog corners from unrelated scroll and content behind the overlay.
  await page.addStyleTag({content: "dialog[open]::backdrop { background-color: #000; }"});
  await expect(dialog).toHaveScreenshot("annotated-profile-viewer.png");
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
