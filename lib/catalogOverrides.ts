import type {ProductSpecification, ProductVariant} from "@/types/product";
import channelSpecifications from "@/data/channel-specifications.json";
import angleImages from "@/data/angle-images.json";
import squareImages from "@/data/square-images.json";
import treadPlateImages from "@/data/tread-plate-images.json";
import galvanizedSheetImages from "@/data/galvanized-sheet-images.json";
import coldRolledSheetImages from "@/data/cold-rolled-sheet-images.json";
import hotRolledSheetImages from "@/data/hot-rolled-sheet-images.json";
import {flatSteelDimensions, flatSteelTitle} from "./flatSteel";
import {coldRolledSheetSubcategoryId, galvanizedSheetSubcategoryId, hotRolledSheetSubcategoryId, treadPlateSubcategoryId} from "./sheetPresentation";

type ImageOverride = {sourceUrl: string; imageUrl: string};
type ChannelOverride = {sourceUrl: string; imageUrl?: string; specifications: ProductSpecification[]};
const sheetImageOverrides = new Map<string, Record<string, ImageOverride>>([
  [treadPlateSubcategoryId, treadPlateImages.products],
  [galvanizedSheetSubcategoryId, galvanizedSheetImages.products],
  [coldRolledSheetSubcategoryId, coldRolledSheetImages.products],
  [hotRolledSheetSubcategoryId, hotRolledSheetImages.products],
]);

// The saved supplier catalog remains reproducible. Display corrections and
// approved illustrations are applied only to the matching identity and source.
export function applyCatalogOverrides(product: ProductVariant): ProductVariant {
  const flatSteel = flatSteelDimensions(product);
  if (flatSteel) return {...product, name: `${flatSteelTitle} ${flatSteel.width}×${flatSteel.thickness} мм`};
  const sheetImages = sheetImageOverrides.get(product.subcategoryId);
  if (sheetImages) {
    const image = sheetImages[product.id];
    return image && image.sourceUrl === product.sourceReference ? {...product, imageUrls: [image.imageUrl]} : product;
  }
  if (product.categoryId === "rozmet-cat-kvadrat") {
    const image = (squareImages.products as Record<string, ImageOverride>)[product.id];
    return image && image.sourceUrl === product.sourceReference ? {...product, imageUrls: [image.imageUrl]} : product;
  }
  if (product.categoryId === "rozmet-cat-ugolok") {
    const image = (angleImages.products as Record<string, ImageOverride>)[product.id];
    if (!image || image.sourceUrl !== product.sourceReference) return product;
    return {...product, imageUrls: [image.imageUrl], specifications: product.specifications.map(item =>
      item.name === "Вес" ? {...item, name: "Теоретическая масса"} : item)};
  }
  const details = (channelSpecifications.products as Record<string, ChannelOverride>)[product.id];
  if (product.categoryId !== "rozmet-cat-shveller" || !details || details.sourceUrl !== product.sourceReference) return product;
  const other = product.specifications.filter(item => !channelSpecifications.replacedSpecificationNames.includes(item.name));
  return {...product, imageUrls: details.imageUrl ? [details.imageUrl] : product.imageUrls,
    specifications: [...details.specifications, ...other]};
}
