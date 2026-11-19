import {randomInt} from "node:crypto";
import {getProductVariantById} from "@/lib/catalog";
import {revalidateCartPrice} from "@/lib/cartPricing";
import {isVgpVariant} from "@/lib/vgp";
import {FIRST_INVOICE_NUMBER} from "@/lib/invoiceNumber";
import type {CreateOrderInput, Order, OrderItem, PaymentStatus} from "@/types/order";
import type {InvoiceEmailStatus} from "@/types/invoice";
import {FileOrderRepository} from "./fileOrderRepository";
import {PostgresOrderRepository} from "./postgresOrderRepository";
import path from "node:path";

export interface OrderRepository {
  reserveInvoiceNumber(): Promise<number>;

  save(order: Order): Promise<void>;

  findByReference(reference: string): Promise<Order | null>;

  updatePaymentStatus(reference: string, status: PaymentStatus): Promise<void>;
  updateInvoiceEmailStatus(reference: string, status: InvoiceEmailStatus): Promise<void>;
}

class DevelopmentOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();
  private nextInvoiceNumber = FIRST_INVOICE_NUMBER;

  async reserveInvoiceNumber() {
    return this.nextInvoiceNumber++;
  }

  async save(order: Order) {
    if (this.orders.has(order.reference)) throw Object.assign(new Error("ORDER_REFERENCE_EXISTS"), {code: "EEXIST"});
    this.orders.set(order.reference, order);
  }

  async findByReference(reference: string) {
    return this.orders.get(reference) ?? null;
  }

  async updatePaymentStatus(reference: string, status: PaymentStatus) {
    const order = this.orders.get(reference);
    if (order) this.orders.set(reference, {...order, paymentStatus: status});
  }

  async updateInvoiceEmailStatus(reference: string, status: InvoiceEmailStatus) {
    const order = this.orders.get(reference);
    if (order?.invoice) this.orders.set(reference, {...order, invoice: {...order.invoice, emailStatus: status}});
  }
}

class UnconfiguredOrderRepository implements OrderRepository {
  async reserveInvoiceNumber() {
    return this.unavailable();
  }

  async save(order: Order) {
    void order;
    this.unavailable();
  }

  async findByReference(reference: string): Promise<Order | null> {
    void reference;
    return this.unavailable();
  }

  async updatePaymentStatus(reference: string, status: PaymentStatus) {
    void reference;
    void status;
    this.unavailable();
  }

  async updateInvoiceEmailStatus(reference: string, status: InvoiceEmailStatus) {
    void reference;
    void status;
    this.unavailable();
  }

  private unavailable(): never {
    throw new Error("ORDER_STORAGE_NOT_CONFIGURED");
  }
}

const developmentRepository = process.env.NODE_ENV === "development"
  ? new FileOrderRepository(path.join(process.cwd(), ".local/orders")) : new DevelopmentOrderRepository();

function createOrderRepository(): OrderRepository {
  const {ORDER_STORAGE_DIR, ORDER_DATABASE_URL, ORDER_DATABASE_CA, NODE_ENV} = process.env;
  if (ORDER_STORAGE_DIR) return new FileOrderRepository(ORDER_STORAGE_DIR);
  if (ORDER_DATABASE_URL) return new PostgresOrderRepository(ORDER_DATABASE_URL, ORDER_DATABASE_CA);
  return NODE_ENV === "production" ? new UnconfiguredOrderRepository() : developmentRepository;
}

export const orderRepository = createOrderRepository();

function newOrderReference() {
  return String(randomInt(1_000_000_000, 10_000_000_000));
}

export async function saveNewOrder(order: Order) {
  for (let attempt = 0; ; attempt++) {
    try {
      await orderRepository.save(order);
      return;
    } catch (error) {
      const code = (error as {code?: string} | undefined)?.code;
      if (attempt >= 3 || (code !== "EEXIST" && code !== "23505")) throw error;
      order.reference = newOrderReference();
    }
  }
}

export function createTrustedOrder(input: CreateOrderInput, lookupProduct = getProductVariantById): Order | null {
  if (input.consent !== true) return null;
  const items: OrderItem[] = [];
  for (const item of input.items) {
    const product = lookupProduct(item.productId);
    if (!product) return null;
    const {measurement, pieceOrder, estimatedTotal: subtotal, invalidReason} = revalidateCartPrice(product, item);
    if (invalidReason) return null;
    if (measurement) {
      const {meters, weightTons} = measurement;
      items.push({
        productId: product.id,
        quantity: measurement.inputMode === "meter" ? meters : weightTons,
        measurement: {inputMode: measurement.inputMode, meters, weightTons},
        ...(measurement.inputMode === "meter" || isVgpVariant(product) ? {weightPerMeterKg: product.weightPerMeterKg} : {}),
        name: product.name,
        sku: product.sku,
        unitPrice: measurement.pricePerTon,
        priceUnit: product.priceUnit,
        subtotal,
      });
      continue;
    }
    items.push({
      productId: product.id,
      quantity: item.quantity,
      ...(pieceOrder ? {pieceOrder} : {}),
      name: product.name,
      sku: product.sku,
      unitPrice: product.price!,
      priceUnit: product.priceUnit,
      subtotal,
    });
  }
  const totalAmount = items.reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0) / 100;
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return null;
  return {
    reference: newOrderReference(),
    items,
    customer: input.customer,
    delivery: input.delivery,
    paymentMethod: input.paymentMethod,
    totalAmount,
    status: "SUBMITTED",
    paymentStatus: "PENDING",
    createdAt: new Date().toISOString(),
    pricingVersion: "decimal",
  };
}
