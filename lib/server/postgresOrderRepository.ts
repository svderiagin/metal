import postgres, {type Sql} from "postgres";
import type {InvoiceEmailStatus} from "@/types/invoice";
import type {Order, PaymentStatus} from "@/types/order";
import type {OrderRepository} from "./orders";
import {FIRST_INVOICE_NUMBER} from "@/lib/invoiceNumber";

export class PostgresOrderRepository implements OrderRepository {
  private readonly sql: Sql;
  private schemaReady?: Promise<void>;

  constructor(databaseUrl: string, ca?: string) {
    try {
      if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) throw new Error();
      this.sql = postgres(databaseUrl, {
        ssl: {rejectUnauthorized: true, ca: ca?.trim().replaceAll("\\n", "\n") || undefined},
        max: 3,
        connect_timeout: 5,
        idle_timeout: 30,
        connection: {application_name: "rwb-metal-orders", statement_timeout: 8000},
        onnotice: () => {},
      });
    } catch {
      throw new Error("ORDER_DATABASE_CONFIGURATION_INVALID");
    }
  }

  async reserveInvoiceNumber() {
    await this.ensureSchema();
    const [row] = await this.sql<{number: string}[]>`
      INSERT INTO public.rwb_invoice_counter (singleton, last_number)
      VALUES (true, ${FIRST_INVOICE_NUMBER})
      ON CONFLICT (singleton) DO UPDATE SET last_number = rwb_invoice_counter.last_number + 1
      RETURNING last_number::text AS number
    `;
    return Number(row.number);
  }

  async save(order: Order) {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO public.rwb_orders (reference, order_data)
      VALUES (${order.reference}, ${JSON.stringify(order)}::text::jsonb)
    `;
  }

  async findByReference(reference: string) {
    await this.ensureSchema();
    const [row] = await this.sql<{order_data: Order}[]>`
      SELECT order_data FROM public.rwb_orders WHERE reference = ${reference}
    `;
    return row?.order_data ?? null;
  }

  async updatePaymentStatus(reference: string, status: PaymentStatus) {
    await this.updateStatus(reference, ["paymentStatus"], status);
  }

  async updateInvoiceEmailStatus(reference: string, status: InvoiceEmailStatus) {
    await this.updateStatus(reference, ["invoice", "emailStatus"], status);
  }

  private async updateStatus(reference: string, path: string[], status: PaymentStatus | InvoiceEmailStatus) {
    await this.ensureSchema();
    // Update just this field in the current row so concurrent updates cannot overwrite each other.
    const result = await this.sql`
      UPDATE public.rwb_orders
      SET order_data = jsonb_set(order_data, ${path}::text[], to_jsonb(${status}::text))
      WHERE reference = ${reference}
    `;
    if (result.count !== 1) throw new Error("ORDER_NOT_FOUND");
  }

  private ensureSchema() {
    return this.schemaReady ??= this.createTable().catch(error => {
      this.schemaReady = undefined;
      throw error;
    });
  }

  private async createTable() {
    const [table] = await this.sql<{ready: boolean}[]>`
      SELECT to_regclass('public.rwb_orders') IS NOT NULL
        AND to_regclass('public.rwb_invoice_counter') IS NOT NULL AS ready
    `;
    if (table.ready) return;

    await this.sql.begin(async transaction => {
      // Serialize first-start schema creation across separate app instances.
      await transaction`SELECT pg_advisory_xact_lock(hashtext('rwb-metal:rwb_orders'))`;
      await transaction`
        CREATE TABLE IF NOT EXISTS public.rwb_orders (
          reference text PRIMARY KEY,
          order_data jsonb NOT NULL
        )
      `;
      await transaction`
        CREATE TABLE IF NOT EXISTS public.rwb_invoice_counter (
          singleton boolean PRIMARY KEY CHECK (singleton),
          last_number bigint NOT NULL CHECK (last_number BETWEEN 1000000000 AND 9999999999)
        )
      `;
    });
  }
}
