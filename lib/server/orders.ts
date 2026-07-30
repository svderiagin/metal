import {randomBytes} from "node:crypto";
import {getProductVariantById} from "@/lib/catalog";
import {calculateLineTotal, metersToTons, tonsToMeters} from "@/lib/orderMeasurement";
import type {CreateOrderInput, Order, OrderItem, PaymentStatus} from "@/types/order";

export interface OrderRepository {
  save(order: Order): Promise<void>;

  findByReference(reference: string): Promise<Order | null>;

  updatePaymentStatus(reference: string, status: PaymentStatus): Promise<void>;
}

class DevelopmentOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order) {
    this.orders.set(order.reference, order);
  }

  async findByReference(reference: string) {
    return this.orders.get(reference) ?? null;
  }

  async updatePaymentStatus(reference: string, status: PaymentStatus) {
    const order = this.orders.get(reference);
    if (order) this.orders.set(reference, {...order, paymentStatus: status});
  }
}

class UnconfiguredOrderRepository implements OrderRepository {
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

  private unavailable(): never {
    throw new Error("ORDER_STORAGE_NOT_CONFIGURED");
  }
}

const developmentRepository = new DevelopmentOrderRepository();
export const orderRepository: OrderRepository =
  process.env.NODE_ENV === "production" ? new UnconfiguredOrderRepository() : developmentRepository;

export function createTrustedOrder(input: CreateOrderInput): Order | null {
  const items: OrderItem[] = [];
  for (const item of input.items) {
    const product = getProductVariantById(item.productId);
    if (!product) return null;
    if (item.measurement) {
      if (product.pricePerTon === undefined || product.weightPerMeterKg === undefined) return null;
      const meters = item.measurement.inputMode === "meter"
        ? item.measurement.meters
        : tonsToMeters(item.measurement.weightTons, product.weightPerMeterKg);
      const weightTons = item.measurement.inputMode === "ton"
        ? item.measurement.weightTons
        : metersToTons(item.measurement.meters, product.weightPerMeterKg);
      if (meters === null || weightTons === null) return null;
      const subtotal = calculateLineTotal(weightTons, product.pricePerTon);
      if (subtotal === null) return null;
      items.push({
        productId: product.id,
        quantity: item.measurement.inputMode === "meter" ? meters : weightTons,
        measurement: {inputMode: item.measurement.inputMode, meters, weightTons},
        name: product.name,
        sku: product.sku,
        unitPrice: product.pricePerTon,
        priceUnit: product.priceUnit,
        subtotal,
      });
      continue;
    }
    items.push({
      productId: product.id,
      quantity: item.quantity,
      name: product.name,
      sku: product.sku,
      unitPrice: product.price,
      priceUnit: product.priceUnit,
      subtotal: product.price * item.quantity,
    });
  }
  return {
    reference: `MS-${randomBytes(6).toString("hex").toUpperCase()}`,
    items,
    customer: input.customer,
    delivery: input.delivery,
    paymentMethod: input.paymentMethod,
    totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
    status: "SUBMITTED",
    paymentStatus: "PENDING",
    createdAt: new Date().toISOString(),
  };
}
