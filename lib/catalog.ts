import { categories } from "@/data/categories";
import { subcategories } from "@/data/subcategories";
import { products } from "@/data/products";

export const getAllCategories = () => categories;
export const getCategoryBySlug = (slug: string) => categories.find((item) => item.slug === slug);
export const getCategoryById = (id: string) => categories.find((item) => item.id === id);
export const getAllSubcategories = () => subcategories;
export const getSubcategoryById = (id: string) => subcategories.find((item) => item.id === id);
export const getSubcategoryBySlug = (categoryId: string, slug: string) => subcategories.find((item) => item.categoryId === categoryId && item.slug === slug);
export const getSubcategoriesByCategoryId = (categoryId: string) => subcategories.filter((item) => item.categoryId === categoryId);
export const getAllProducts = () => products;
export const getProductBySlug = (slug: string) => products.find((item) => item.slug === slug);
export const getProductById = (id: string) => products.find((item) => item.id === id);
export const getProductsByCategoryId = (categoryId: string) => products.filter((item) => item.categoryId === categoryId);
export const getProductCountByCategoryId = (categoryId: string) => products.filter((item) => item.categoryId === categoryId).length;
export const getProductsBySubcategoryId = (subcategoryId: string) => products.filter((item) => item.subcategoryId === subcategoryId);
export const getFeaturedProducts = () => products.filter((item) => item.featured);
export const getRelatedProducts = (productId: string, categoryId: string, limit = 3) => products.filter((item) => item.categoryId === categoryId && item.id !== productId).slice(0, limit);
