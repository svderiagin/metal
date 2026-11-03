import type {ProductSpecification, ProductVariant} from "@/types/product";
import channelSpecifications from "@/data/channel-specifications.json";
import angleImages from "@/data/angle-images.json";
import squareImages from "@/data/square-images.json";

type ImageOverride = {sourceUrl: string; imageUrl: string};
type ChannelOverride = {sourceUrl: string; imageUrl?: string; specifications: ProductSpecification[]};

// The saved supplier catalog remains reproducible. Display corrections and
// approved illustrations are applied only to the matching identity and source.
export function applyCatalogOverrides(product: ProductVariant): ProductVariant {
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
