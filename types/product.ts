export type ProductAttributeKey =
  | "material"
  | "standard"
  | "size"
  | "grade"
  | "length";

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface ProductAttribute {
  key: ProductAttributeKey;
  label: string;
  value: string;
}

export interface ProductWeight {
  value: number;
  unit: "кг/м" | "кг/м²";
}

export interface ProductType {
  id: string;
  categoryId: string;
  categorySlug: string;
  subcategoryId: string;
  subcategorySlug: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl?: string;
}

export interface ProductVariant {
  id: string;
  categoryId: string;
  subcategoryId: string;
  productTypeId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  unit: "meter" | "ton" | "sheet" | "piece";
  priceUnit: string;
  material: string;
  standard: string;
  diameterMm?: number;
  form?: "coil" | "bar";
  steelGrade?: string;
  pricePerTon?: number;
  weightPerMeterKg?: number;
  lengthMeters?: number;
  sourceProductName?: string;
  sourceReference?: string;
  availability: "IN_STOCK" | "ON_ORDER";
  inStock: boolean;
  featured: boolean;
  imageUrls: string[];
  attributes: ProductAttribute[];
  specifications: ProductSpecification[];
  weight: ProductWeight;
}

/**
 * Shape kept only in the editable source files under data/products.
 * data/products/index.ts normalizes these records into ProductVariant objects.
 */
export type ProductVariantSource = Omit<
  ProductVariant,
  "productTypeId" | "unit" | "material" | "standard" | "availability" | "weight"
>;
