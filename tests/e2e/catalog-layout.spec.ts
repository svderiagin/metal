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

test("selected filters are counted and reset from the responsive parameters panel", async ({page, isMobile}) => {
  await openProduct(page);
  const reset = page.getByRole("button", {name: "Сбросить фильтры", exact: true}).first();
  await reset.click();
  const parameters = page.getByRole("button", {name: /^Параметры подбора/});
  const profile = page.getByRole("combobox", {name: "Номер профиля", exact: true});
  if (isMobile) {
    await expect(parameters).toHaveAttribute("aria-expanded", "false");
    await expect(profile).toBeHidden();
  } else {
    await expect(parameters).toBeHidden();
    await expect(profile).toBeVisible();
  }
  await openFilters(page);
  await profile.selectOption("6,5");
  if (isMobile) {
    await parameters.click();
    await expect(parameters).toHaveAttribute("aria-expanded", "false");
    await expect(profile).toBeHidden();
  }
  await expect(page.getByText("Выбрано: 1", {exact: true}).filter({visible: true})).toBeVisible();
  await reset.click();
  await expect(page.getByText(/^Выбрано:/)).toHaveCount(0);
  if (isMobile) await expect(parameters).toHaveAttribute("aria-expanded", "false");
  await openFilters(page);
  await expect(profile).toHaveValue("");
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
