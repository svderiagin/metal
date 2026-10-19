import catalog from "@/data/cart-catalog.json";
import {cartPricingVariant, type CartProductData} from "./cartProjection";

// Generated from the public catalog before build/dev/test; never an independently edited price list.
const products = new Map((catalog.products as CartProductData[]).map(product => [product.id, cartPricingVariant(product)]));
const categories = new Map(catalog.categories.map(category => [category.id, category]));
const subcategories = new Map(catalog.subcategories.map(subcategory => [subcategory.id, subcategory]));
const types = new Map(catalog.types.map(type => [type.id, type]));

export const getProductVariantById = (id: string) => products.get(id);
export const getCategoryById = (id: string) => categories.get(id);
export const getSubcategoryById = (id: string) => subcategories.get(id);
export const getProductTypeById = (id: string) => types.get(id);
