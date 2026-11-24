import type {ProductVariant} from "@/types/product";
import angleImages from "@/data/angle-images.json";
import squareImages from "@/data/square-images.json";
import treadPlateImages from "@/data/tread-plate-images.json";
import galvanizedSheetImages from "@/data/galvanized-sheet-images.json";
import coldRolledSheetImages from "@/data/cold-rolled-sheet-images.json";
import hotRolledSheetImages from "@/data/hot-rolled-sheet-images.json";
import {applyFlatSteelSpecifications, flatSteelCategoryId} from "./flatSteel";
import {applySectionSpecifications} from "./sectionSpecifications";
import {channelCategoryId, normalizeChannelVariant} from "./channel";
import {coldRolledSheetSubcategoryId, galvanizedSheetSubcategoryId, hotRolledSheetSubcategoryId, treadPlateSubcategoryId} from "./sheetPresentation";

type ImageOverride = {imageUrl: string};
const sheetImageOverrides = new Map<string, Record<string, ImageOverride>>([
  [treadPlateSubcategoryId, treadPlateImages.products],
  [galvanizedSheetSubcategoryId, galvanizedSheetImages.products],
  [coldRolledSheetSubcategoryId, coldRolledSheetImages.products],
  [hotRolledSheetSubcategoryId, hotRolledSheetImages.products],
]);

// Apply approved display corrections and illustrations to the matching catalog position.
export function applyCatalogOverrides(product: ProductVariant): ProductVariant {
  if (product.categoryId === channelCategoryId) return normalizeChannelVariant(product);
  if (product.categoryId === flatSteelCategoryId) return applyFlatSteelSpecifications(product);
  const sheetImages = sheetImageOverrides.get(product.subcategoryId);
  if (sheetImages) {
    const image = sheetImages[product.id];
    return image ? {...product, imageUrls: [image.imageUrl]} : product;
  }
  if (product.categoryId === "catalog-cat-kvadrat") {
    const image = (squareImages.products as Record<string, ImageOverride>)[product.id];
    return image ? applySectionSpecifications({...product, imageUrls: [image.imageUrl]}) : product;
  }
  if (product.categoryId === "catalog-cat-ugolok") {
    const image = (angleImages.products as Record<string, ImageOverride>)[product.id];
    if (!image) return product;
    return applySectionSpecifications({...product, imageUrls: [image.imageUrl], specifications: product.specifications.map(item =>
      item.name === "Вес" ? {...item, name: "Теоретическая масса"} : item)});
  }
  return product;
}
