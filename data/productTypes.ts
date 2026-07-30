import {categories} from "./categories";
import {subcategories} from "./subcategories";
import type {ProductType} from "@/types/product";

export const productTypes: ProductType[] = subcategories.flatMap((subcategory) => {
  const category = categories.find((item) => item.id === subcategory.categoryId);
  if (!category) return [];

  return [{
    id: `type-${subcategory.id}`,
    categoryId: subcategory.categoryId,
    categorySlug: category.slug,
    subcategoryId: subcategory.id,
    subcategorySlug: subcategory.slug,
    name: subcategory.name,
    slug: subcategory.slug,
    shortDescription: subcategory.shortDescription,
    description: subcategory.description,
  }];
});
