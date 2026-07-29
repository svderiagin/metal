export interface CartItem { productId: string; quantity: number; }
export interface CartLine extends CartItem { name: string; slug: string; categorySlug: string; sku: string; price: number; priceUnit: string; }
