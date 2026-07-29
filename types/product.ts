export interface ProductSpecification {
  name: string;
  value: string;
}

export interface ProductAttribute {
  key: "material" | "standard" | "size" | "grade" | "length";
  label: string;
  value: string;
}

export interface Product {
  id: string;
  categoryId: string;
  subcategoryId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  priceUnit: string;
  inStock: boolean;
  featured: boolean;
  imageUrls: string[];
  attributes: ProductAttribute[];
  specifications: ProductSpecification[];
}
