import type {ProductVariant} from "@/types/product";

export const flatSteelCategoryId = "rozmet-cat-polosa";
export const flatSteelTitle = "Полоса стальная";

// Accept both the saved supplier designation and the public display name.
export function flatSteelDimensions(product: Pick<ProductVariant, "categoryId" | "name">) {
  if (product.categoryId !== flatSteelCategoryId) return null;
  const dimensions = /^Полоса(?: стальная)?(?: №)?\s+(\d+)\s*[хx×]\s*(\d+)(?:\s*мм)?$/iu.exec(product.name);
  return dimensions ? {width: dimensions[1], thickness: dimensions[2]} : null;
}
