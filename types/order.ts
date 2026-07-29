export type CustomerType = "INDIVIDUAL" | "COMPANY";
export type PaymentMethod = "CARD" | "INVOICE";
export type OrderStatus = "SUBMITTED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  customer: {
    type: CustomerType;
    fullName: string;
    email: string;
    phone: string;
    companyName?: string;
    taxNumber?: string;
    legalAddress?: string;
  };
  delivery: {
    address: string;
    comment?: string;
  };
  paymentMethod: PaymentMethod;
}

export interface OrderItem extends OrderItemInput {
  name: string;
  sku: string;
  unitPrice: number;
  priceUnit: string;
  subtotal: number;
}

export interface Order {
  reference: string;
  items: OrderItem[];
  customer: CreateOrderInput["customer"];
  delivery: CreateOrderInput["delivery"];
  paymentMethod: PaymentMethod;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
}

export interface CreateOrderResponse {
  ok: true;
  order: {
    reference: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
  };
}

export interface CreatePaymentResponse {
  ok: true;
  redirectUrl: string;
}

export interface CheckoutFormData {
  customerType: CustomerType;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  taxNumber: string;
  legalAddress: string;
  deliveryAddress: string;
  comment: string;
  paymentMethod: PaymentMethod;
  consentAccepted: boolean;
}

export interface OrderConfirmation {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  email: string;
  paymentPending: boolean;
}
