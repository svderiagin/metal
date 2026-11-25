import type {CartPieceOrder} from "./cart";
import type {InvoiceReceipt, StoredInvoice} from "./invoice";

export type CustomerType = "INDIVIDUAL" | "COMPANY";
export type PaymentMethod = "CARD" | "INVOICE";
export type OrderStatus = "SUBMITTED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface OrderItemInput {
  productId: string;
  quantity: number;
  pieceOrder?: CartPieceOrder;
  measurement?: {
    inputMode: "meter" | "ton";
    meters: number;
    weightTons: number;
  };
}

export interface CreateOrderInput {
  consent: boolean;
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
  paymentMethod: "INVOICE";
}

export interface OrderItem extends OrderItemInput {
  name: string;
  unitPrice: number;
  priceUnit: string;
  subtotal: number;
  weightPerMeterKg?: number;
  deliveryEstimate?: string;
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
  pricingVersion?: "decimal";
  checkout?: {keyHash: string; fingerprint: string};
  invoice?: StoredInvoice;
}

export interface CreateOrderResponse {
  ok: true;
  order: {
    reference: string;
    totalAmount: number;
    paymentMethod: "INVOICE";
    invoice?: InvoiceReceipt;
  };
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
  paymentMethod: "INVOICE";
  consentAccepted: boolean;
}

export interface OrderConfirmation {
  orderNumber: string;
  totalAmount?: number;
  paymentMethod: PaymentMethod;
  email: string;
  paymentPending: boolean;
  invoice?: InvoiceReceipt;
}
