import {test, expect, openProduct, visibleProduct} from "../browser";
import {getAllProductVariants} from "../../lib/catalog";

const product = getAllProductVariants().find(p => p.id === "local-984")!;

test("galvanized VGP shows audited facts and converts length and mass while typing", async ({page}, testInfo) => {
  await openProduct(page, product);
  const row = visibleProduct(page, product.id);
  await expect(row).toContainText("33,5");
  await expect(row).toContainText("2,18 кг/м");
  await expect(row).toContainText("25×2,8");
  const meters = row.getByRole("textbox", {name: /^Длина заказа для/});
  const tons = row.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  await meters.fill("7,8");
  await expect(meters).toBeFocused();
  await expect(tons).toHaveValue("0,017032");
  await meters.fill("15,6");
  await expect(tons).toHaveValue("0,034064");
  await tons.fill("0,03406416");
  await expect(meters).toHaveValue("15,6");
  await tons.blur();
  await expect(tons).toHaveValue("0,034064");
  await meters.fill("7,81");
  await meters.blur();
  await expect(meters).toHaveValue("15,6");
  await expect(row).toContainText("Объём округлён вверх до целых труб");
  await expect(row.getByRole("button", {name: "В корзину", exact: true})).toHaveCount(0);
  await row.locator("img").evaluate(image => (image as HTMLImageElement).decode());
  await row.screenshot({path: testInfo.outputPath("vgp-galvanized-row.png")});

  await row.getByRole("button", {name: /Увеличить изображение:/}).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("img").evaluate(image => (image as HTMLImageElement).decode());
  await expect(dialog.getByRole("img")).toHaveAttribute("src", /vgp_ocinkovannaya_2400_1800_marked\.jpg/);
  await dialog.screenshot({path: testInfo.outputPath("vgp-galvanized-image.png")});
  await page.keyboard.press("Escape");

  await row.getByRole("link", {name: "Запросить цену", exact: true}).click();
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Общая длина: 15,6 м/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Вес: 0,034 т/);
  await meters.fill("");
  await expect(tons).toHaveValue("");
  await meters.fill("-1");
  await expect(meters).toHaveAttribute("aria-invalid", "true");
  await expect(tons).toHaveValue("");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("metal-store-cart-v1") ?? "[]"))).toEqual([]);
});
