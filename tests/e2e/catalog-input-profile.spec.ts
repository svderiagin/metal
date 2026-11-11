import {expect, openProduct, test, visibleProduct} from "../browser";
import {getAllProductVariants} from "../../lib/catalog";

test("ranged profile pipe uses the corrected length and whole pipes in the quote", async ({page}) => {
  const pipe = getAllProductVariants().find(variant => variant.id === "profile-pipe-square-80x80x2")!;
  await openProduct(page, pipe);
  const row = visibleProduct(page, pipe.id);
  const length = row.getByRole("textbox", {name: /^Длина одной трубы для/});
  const quantity = row.getByRole("textbox", {name: /^Количество целых труб для/});

  await expect(length).toHaveValue("");
  await length.fill("-3");
  await expect(length).toHaveAttribute("aria-invalid", "true");
  await length.press("Tab");
  await expect(length).toHaveValue("6");
  await expect(row.getByText("Длина трубы скорректирована до 6 м.", {exact: true})).toBeVisible();
  await length.fill("20");
  await length.press("Tab");
  await expect(length).toHaveValue("12");
  await expect(row.getByText("Длина трубы скорректирована до 12 м.", {exact: true})).toBeVisible();

  await quantity.fill("1,5");
  await expect(quantity).toHaveValue("1,5");
  await quantity.press("Tab");
  await expect(quantity).toHaveValue("2");
  await expect(row.getByLabel(/^Заказ в метрах для/)).toHaveText("24");
  await row.getByRole("link", {name: "Запросить цену", exact: true}).click();
  const message = page.getByRole("textbox", {name: /^Что требуется рассчитать\?/});
  await expect(message).toHaveValue(/длина 12 м\nОбщая длина: 24 м\nКоличество: 2 шт\./u);
});
