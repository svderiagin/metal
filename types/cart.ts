export type OrderInputMode = "meter" | "ton";

export interface CartMeasurement {
  inputMode: OrderInputMode;
  meters: number;
  weightTons: number;
  pricePerTon: number;
  estimatedTotal: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  measurement?: CartMeasurement;
}

export interface CartLine extends CartItem {
  name: string;
  slug: string;
  categorySlug: string;
  subcategorySlug: string;
  productTypeSlug: string;
  sku: string;
  price: number;
  priceUnit: string;
  estimatedTotal: number;
}
