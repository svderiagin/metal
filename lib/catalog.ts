import {categories} from "@/data/categories";
import {productTypes} from "@/data/productTypes";
import {productVariants} from "@/data/products";
import {subcategories} from "@/data/subcategories";

export const getAllCategories = () => categories;
export const getCategoryBySlug = (slug: string) =>
  categories.find((item) => item.slug === slug);
export const getCategoryById = (id: string) =>
  categories.find((item) => item.id === id);

export const getSubcategoryById = (id: string) =>
  subcategories.find((item) => item.id === id);
export const getSubcategoryBySlug = (categoryId: string, slug: string) =>
  subcategories.find((item) => item.categoryId === categoryId && item.slug === slug);
export const getSubcategoriesByCategoryId = (categoryId: string) =>
  subcategories.filter((item) => item.categoryId === categoryId);

export const getAllProductTypes = () => productTypes;
export const getProductTypeById = (id: string) =>
  productTypes.find((item) => item.id === id);
export const getProductTypeBySlug = (subcategoryId: string, slug: string) =>
  productTypes.find((item) => item.subcategoryId === subcategoryId && item.slug === slug);
export const getProductTypesByCategoryId = (categoryId: string) =>
  productTypes.filter((item) => item.categoryId === categoryId);
export const getProductTypesBySubcategoryId = (subcategoryId: string) =>
  productTypes.filter((item) => item.subcategoryId === subcategoryId);
export const getProductTypeCountByCategoryId = (categoryId: string) =>
  productTypes.filter((item) => item.categoryId === categoryId).length;

export const getAllProductVariants = () => productVariants;
export const getProductVariantBySlug = (slug: string) =>
  productVariants.find((item) => item.slug === slug);
export const getProductVariantById = (id: string) =>
  productVariants.find((item) => item.id === id);
export const getProductVariantsByTypeId = (productTypeId: string) =>
  productVariants.filter((item) => item.productTypeId === productTypeId);
export const getProductVariantsByCategoryId = (categoryId: string) =>
  productVariants.filter((item) => item.categoryId === categoryId);
