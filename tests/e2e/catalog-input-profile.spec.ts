import {expect, openProduct, test, visibleProduct} from "../browser";
import {getAllProductVariants} from "../../lib/catalog";

test("ranged profile pipe uses the corrected length and whole pipes in the quote", async ({page}) => {
  const pipe = getAllProductVariants().find(variant => variant.id === "profile-pipe-square-80x80x2")!;
  await openProduct(page, pipe);
  const row = visibleProduct(page, pipe.id);
  const length = row.getByRole("textbox", {name: /^Длина одной трубы для/});
  const quantity = row.getByRole("textbox", {name: /^Длина заказа для/});

  if (await row.evaluate(element => element.tagName === "ARTICLE")) {
    await expect(row.getByRole("heading", {level: 3})).toHaveText(pipe.name);
    await expect(row.getByRole("term").filter({visible: true})).toHaveText(["Стенка", "Длина", "Цена"]);
    await expect(row.getByRole("definition").filter({visible: true}).nth(1).getByRole("textbox")).toBeVisible();
    await expect(row.getByRole("definition").filter({visible: true}).last()).toHaveText("По запросу");
  }
  await expect(length).toHaveValue("");
  await length.fill("-3");
  await expect(length).toHaveAttribute("aria-invalid", "true");
  await length.press("Tab");
  await expect(length).toHaveValue("-3");
  await expect(length).toHaveAttribute("aria-invalid", "true");
  await length.fill("3");
  await length.press("Tab");
  await expect(length).toHaveValue("6");
  await expect(row.getByText("Длина трубы скорректирована до 6 м.", {exact: true})).toBeVisible();
  await length.fill("20");
  await length.press("Tab");
  await expect(length).toHaveValue("12");
  await expect(row.getByText("Длина трубы скорректирована до 12 м.", {exact: true})).toBeVisible();

  await quantity.fill("13,5");
  await expect(quantity).toHaveValue("13,5");
  await quantity.press("Tab");
  await expect(quantity).toHaveValue("24");
  await expect(row.getByRole("status", {name: "", exact: true})).toHaveText("2 шт.");
  await row.getByRole("link", {name: "Запросить цену", exact: true}).press("Enter");
  await expect(page.getByRole("region", {name: "Запросите расчёт поставки", exact: true})).toBeFocused();
  const message = page.getByRole("textbox", {name: /^Что требуется рассчитать\?/});
  await expect(message).toHaveValue(/длина 12 м\nЗапрошенный объём: 13,5 м\nОбщая длина: 24 м\nРасчётная масса: 0,116256 т\nКоличество: 2 шт\./u);
});

test("square profile pipe converts metres and tonnes to whole pipes and keeps the requested amount in the quote", async ({page}) => {
  const pipe = getAllProductVariants().find(variant => variant.id === "profile-pipe-square-40x40x2")!;
  await openProduct(page, pipe);
  const row = visibleProduct(page, pipe.id);
  const length = row.getByRole("textbox", {name: /^Длина заказа для/});
  const weight = row.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  await length.fill("13");
  await expect(row.getByRole("status", {name: "", exact: true})).toHaveText("3 шт.");
  await expect(weight).toHaveValue("0,04194");
  await length.press("Tab");
  await expect(length).toHaveValue("18");
  await weight.fill("0.04194");
  await expect(weight).toHaveValue("0,04194");
  await expect(row.getByRole("status", {name: "", exact: true})).toHaveText("3 шт.");
  await row.getByRole("link", {name: "Запросить цену", exact: true}).click();
  const message = page.getByRole("textbox", {name: /^Что требуется рассчитать\?/});
  await expect(message).toHaveValue(/Запрошенный объём: 13 м\nОбщая длина: 18 м\nРасчётная масса: 0,04194 т\nКоличество: 3 шт\./u);

  await weight.fill("0,01398");
  await expect(length).toHaveValue("6");
  await expect(row.getByRole("status", {name: "", exact: true})).toHaveText("1 шт.");
  await weight.fill("0,013981");
  await expect(length).toHaveValue("12");
  await expect(row.getByRole("status", {name: "", exact: true})).toHaveText("2 шт.");
  await row.getByRole("link", {name: "Запросить цену", exact: true}).click();
  await expect(message).toHaveValue(/Запрошенный объём: 0,013981 т\nОбщая длина: 12 м\nРасчётная масса: 0,02796 т\nКоличество: 2 шт\./u);
  await weight.fill("1000");
  await expect(weight).toHaveValue("13,96602");
  await expect(length).toHaveValue("5994");
  await expect(row.getByRole("status", {name: "", exact: true})).toHaveText("999 шт.");
  await expect(row.getByRole("link", {name: "Запросить цену", exact: true})).toBeVisible();
});

test("rectangular profile pipes accept metres and tonnes and quote whole stock lengths", async ({page}) => {
  const pipe = getAllProductVariants().find(variant => variant.id === "profile-pipe-rectangular-40x20x2")!;
  await openProduct(page, pipe);
  const row = visibleProduct(page, pipe.id);
  const meters = row.getByRole("textbox", {name: /^Длина заказа для/});
  const tons = row.getByRole("textbox", {name: /^Вес заказа в тоннах для/});
  const count = row.getByRole("status", {name: "", exact: true});
  await meters.fill("6.001");
  await expect(count).toHaveText("2 шт.");
  await expect(tons).toHaveValue("0,0204");
  await meters.press("Enter");
  await expect(meters).toHaveValue("12");
  await tons.fill("0,0102");
  await expect(count).toHaveText("1 шт.");
  await tons.press("End");
  await tons.pressSequentially("x");
  await expect(tons).toHaveValue("0,0102");
  await tons.pressSequentially("01");
  await expect(count).toHaveText("2 шт.");
  await row.getByRole("link", {name: "Запросить цену", exact: true}).click();
  await expect(page.getByRole("textbox", {name: /^Что требуется рассчитать/})).toHaveValue(
    /Запрошенный объём: 0,010201 т\nОбщая длина: 12 м\nРасчётная масса: 0,0204 т\nКоличество: 2 шт\./u);
});
