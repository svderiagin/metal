import {test as base, expect, type Locator, type Page} from "@playwright/test";
import {getAllProductTypes, getAllProductVariants} from "../lib/catalog";
import {catalogProductPath} from "../lib/catalogLinks";

export {expect};
export const test = base.extend({
  page: async ({page}, providePage) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    // All browser submissions stay local and mocked, including unforeseen API calls.
    await page.route("**/api/**", route => route.fulfill({status: 503, json: {ok: false, error: "Тестовый отказ сервиса"}}));
    await providePage(page);
    expect(errors, "uncaught browser errors").toEqual([]);
  },
});

const products = getAllProductVariants();
const types = getAllProductTypes();
export const samples = {
  shveller: products.find(p => p.id === "rozmet-2235")!,
  ugolok: products.find(p => p.id === "rozmet-2209")!,
  kvadrat: products.find(p => p.id === "rozmet-2204")!,
  treadPlate: products.find(p => p.id === "rozmet-2202")!,
  galvanizedSheet: products.find(p => p.id === "rozmet-2199")!,
  coldRolledSheet: products.find(p => p.id === "rozmet-2185")!,
  hotRolledSheet: products.find(p => p.id === "rozmet-2190")!,
  armatura: products.find(p => p.id === "rebar-a500c-12-coil")!,
  balka: products.find(p => p.categoryId === "cat-bal" && p.imported)!,
  profile: products.find(p => p.categoryId === "cat-trp" && p.profileWidthMm === 40 && p.profileHeightMm === 40 && p.wallThicknessMm === 2)!,
  vgp: products.find(p => p.categoryId === "cat-trk" && p.weightPerMeterKg)!,
  profnastil: products.find(p => p.categoryId === "cat-pnf")!,
  mesh: products.find(p => p.categoryId === "cat-mesh")!,
  shtaketnik: products.find(p => p.categoryId === "rozmet-cat-shtaketnik")!,
};

export function productPath(product: typeof samples.shveller, linked = true) {
  const type = types.find(type => type.id === product.productTypeId)!;
  return catalogProductPath(type.categorySlug, type.subcategorySlug, type.slug, linked ? product.id : undefined);
}

export function visibleProduct(page: Page, id: string) {
  return page.locator(`#variant-${id}:visible, #variant-mobile-${id}:visible`);
}

export async function openProduct(page: Page, product = samples.shveller) {
  await page.goto(productPath(product));
  await expect(visibleProduct(page, product.id)).toBeVisible();
  await page.getByLabel("Поиск товаров", {exact: true}).filter({visible: true}).fill(product.name);
  await expect(visibleProduct(page, product.id)).toBeVisible();
}

export async function seedCart(page: Page, quantity = 3) {
  await page.addInitScript(({id, quantity}) => {
    if (localStorage.getItem("metal-store-cart-v1") === null) localStorage.setItem("metal-store-cart-v1", JSON.stringify([{productId: id, quantity}]));
  }, {id: samples.shveller.id, quantity});
}

export async function fillCheckout(page: Page) {
  await page.getByLabel("ФИО *", {exact: true}).fill("Анна Тестовая");
  await page.getByLabel("Электронная почта *", {exact: true}).fill("audit@example.invalid");
  await page.getByLabel("Телефон *", {exact: true}).fill("+79000000000");
  await page.getByLabel("Адрес доставки *", {exact: true}).fill("Тестовый адрес доставки");
  await page.getByRole("radio", {name: /Счёт на оплату/}).check();
  await page.getByRole("checkbox").check();
}

export async function settleImages(page: Page, area: Locator = page.locator("body")) {
  await page.mouse.move(0, 0);
  await expect.poll(() => area.evaluate(element => {
    const visible = [...element.querySelectorAll("img")].filter(image => {
      const rect = image.getBoundingClientRect();
      return image.checkVisibility({opacityProperty: true, visibilityProperty: true})
        && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight
        && rect.right > 0 && rect.left < innerWidth;
    });
    // Request only the images included in the snapshot, even in a lazy-loaded table.
    for (const image of visible) if (image.loading === "lazy") image.loading = "eager";
    const pending = visible.filter(image => !image.complete || !image.naturalWidth)
      .map(image => image.currentSrc || image.src);
    if (document.fonts.status !== "loaded") pending.push("web fonts");
    return pending;
  }), {message: "visible screenshot assets are loaded"}).toEqual([]);
}

export async function openFilters(page: Page) {
  const collapsed = page.getByRole("button", {name: /^Параметры подбора/, expanded: false});
  if (await collapsed.isVisible()) await collapsed.click();
}
