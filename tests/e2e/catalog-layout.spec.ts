import {test, expect, openProduct, openFilters, seedCart} from "../browser";
import {getProductTypesByCategoryId} from "../../lib/catalog";

for (const type of getProductTypesByCategoryId("cat-arm")) {
  test(`${type.name}: rebar uses the text-only table and mobile cards`, async ({page, isMobile}) => {
    await page.goto(`/catalog/${type.categorySlug}/${type.subcategorySlug}/${type.slug}`);
    const products = page.getByRole("region", {name: "Продукция", exact: true});
    await expect(products.locator("img")).toHaveCount(0);
    if (isMobile) await expect(products.locator('article').first()).toBeVisible();
    else await expect(products.getByRole("columnheader")).toHaveCount(10);
  });
}

test("collapsed parameters show selected filters and reset them without reopening", async ({page}) => {
  await openProduct(page);
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  const parameters = page.locator("details").filter({has: page.locator("summary", {hasText: /^Параметры подбора/})});
  await expect(parameters).not.toHaveAttribute("open");
  await openFilters(page);
  await page.getByRole("combobox", {name: "Номер профиля", exact: true}).selectOption("6,5");
  await parameters.locator("summary").click();
  await expect(parameters).not.toHaveAttribute("open");
  await expect(parameters.locator("summary")).toContainText("Выбрано: 1");
  await page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first().click();
  await expect(parameters.locator("summary")).not.toContainText("Выбрано:");
  await expect(parameters).not.toHaveAttribute("open");
});

test("sales email is available while card payment remains an explicit placeholder", async ({page}) => {
  await seedCart(page);
  await page.goto("/contacts");
  await expect(page.getByRole("main").getByRole("link", {name: "sales@rwb-metal.ru", exact: true}).first()).toHaveAttribute("href", "mailto:sales@rwb-metal.ru");
  await expect(page.getByRole("main").getByText("Телефон скоро появится", {exact: true})).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("radio", {name: /Банковская карта/})).toBeDisabled();
  await expect(page.getByRole("radio", {name: /Счёт на оплату/})).toBeChecked();
  await expect(page.getByText(/Онлайн-оплата пока недоступна/)).toBeVisible();
});
