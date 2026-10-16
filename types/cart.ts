export type OrderInputMode = "meter" | "ton";

export interface CartPieceOrder {
  pieces: number;
  lengthMeters: number;
}

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
  pieceOrder?: CartPieceOrder;
}

export interface CartLine extends CartItem {
  invalidReason?: string;
  name: string;
  slug: string;
  categorySlug: string;
  subcategorySlug: string;
  productTypeSlug: string;
  sku: string;
  price: number;
  priceUnit: string;
  quantityUnit: string;
  estimatedTotal: number;
  wholeQuantity?: boolean;
}
