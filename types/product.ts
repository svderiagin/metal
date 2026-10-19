export type ProductAttributeKey =
  | "material"
  | "standard"
  | "size"
  | "wallThickness"
  | "grade"
  | "class"
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
  materialDescription?: string;
  referenceStandard?: string;
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
  price: number | null;
  quoteOnly?: boolean;
  priceQualifier?: "from" | "exact";
  currency?: string;
  imported?: boolean;
  /** Original demonstration data; its technical attributes are not category guidance. */
  demo?: boolean;
  /** Price explicitly confirmed by the owner, including an offer based on a demo record. */
  priceConfirmed?: boolean;
  unit: "meter" | "square_meter" | "ton" | "sheet" | "piece" | "kg";
  priceUnit: string;
  material: string;
  standard: string;
  diameterMm?: number;
  nominalBoreMm?: number;
  wallThicknessMm?: number;
  profileWidthMm?: number;
  profileHeightMm?: number;
  channelNumber?: number;
  channelSeries?: "П" | "У";
  profileMark?: "С8" | "С20" | "Н75";
  sheetSizeMeters?: string;
  colorName?: string;
  ralCode?: string;
  coatingType?: "galvanized" | "painted";
  lengthRangeMeters?: [number, number];
  weightConfirmed?: boolean;
  form?: "coil" | "bar";
  steelGrade?: string;
  pricePerTon?: number;
  weightPerMeterKg?: number;
  lengthMeters?: number;
  sourceProductName?: string;
  sourceReference?: string;
  availability: "IN_STOCK" | "ON_ORDER" | "UNKNOWN";
  inStock: boolean;
  featured: boolean;
  imageUrls: string[];
  attributes: ProductAttribute[];
  specifications: ProductSpecification[];
  weight?: ProductWeight;
}

/**
 * Shape kept only in the editable source files under data/products.
 * data/products/index.ts normalizes these records into ProductVariant objects.
 */
export type ProductVariantSource = Omit<
  ProductVariant,
  "productTypeId" | "unit" | "material" | "standard" | "availability" | "weight"
> & {availability?: ProductVariant["availability"]};
