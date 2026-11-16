import {test, expect, productPath, samples} from "../browser";
import {getCategoryBySlug, getProductTypesByCategoryId} from "../../lib/catalog";
import {getCatalogCoverImages} from "../../lib/catalogCoverImages";

const nestedGallerySlugs = ["armatura", "truby-profilnye", "truba-kruglaya", "profnastil", "setka-metallicheskaya", "balka"];
const coverGalleryPages = [
  ...(["coldRolledSheet", "treadPlate", "hotRolledSheet"] as const).map(family => {
    const sample = samples[family];
    return {name: family, route: productPath(sample, false), id: sample.productTypeId, cover: ""};
  }),
  ...["shveller", "ugolok", "kvadrat", "polosa", ...nestedGallerySlugs].map(slug => {
    const category = getCategoryBySlug(slug)!;
    const cover = slug === "truby-profilnye" ? "/images/catalog/truba-profilnia/truba-main.jpg" : category.imageUrl;
    return {name: category.name, route: `/catalog/${slug}`, id: category.id, cover};
  }),
  ...nestedGallerySlugs.flatMap(slug => {
    const {id} = getCategoryBySlug(slug)!;
    return getProductTypesByCategoryId(id).map(type => ({
      name: type.name, route: `/catalog/${slug}/${type.subcategorySlug}/${type.slug}`, id: type.id, cover: type.imageUrl ?? "",
    }));
  }),
];

for (const {name, route, id, cover} of coverGalleryPages) {
  test(`${name}: every title photo loads in gallery order`, async ({page}) => {
    const frames = getCatalogCoverImages(id, cover);
    expect(frames.length).toBeGreaterThan(1);
    await page.goto(route);
    await page.getByRole("button", {name: /^Увеличить титульное изображение:/}).click();
    const dialog = page.getByRole("dialog", {name: /^Просмотр титульных фотографий:/});
    const picture = dialog.getByRole("img");
    const next = dialog.getByRole("button", {name: "Следующее фото", exact: true});
    for (const [index, frame] of frames.entries()) {
      if (index > 0) await next.click();
      await expect.poll(async () => decodeURI(await picture.getAttribute("src") ?? "")).toContain(`${frame}?v=`);
      await picture.evaluate(image => (image as HTMLImageElement).decode());
    }
  });
}
