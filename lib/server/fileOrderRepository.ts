import {link, mkdir, readFile, readdir, rename, unlink, writeFile} from "node:fs/promises";
import {randomBytes} from "node:crypto";
import path from "node:path";
import type {Order, PaymentStatus} from "@/types/order";
import type {InvoiceEmailStatus} from "@/types/invoice";
import type {OrderRepository} from "./orders";
import {FIRST_INVOICE_NUMBER, isInvoiceNumber} from "@/lib/invoiceNumber";
import {isOrderReference} from "@/lib/orderReference";

// For a Node server with a persistent, private volume. Never put this directory in public/.
export class FileOrderRepository implements OrderRepository {
  private readonly updates = new Map<string, Promise<void>>();

  constructor(private readonly directory: string) {
    if (!path.isAbsolute(directory)) throw new Error("ORDER_STORAGE_DIR_MUST_BE_ABSOLUTE");
    const root = path.resolve(process.cwd(), "public");
    const relative = path.relative(root, path.resolve(directory));
    if (!relative || !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)) {
      throw new Error("ORDER_STORAGE_DIR_MUST_BE_PRIVATE");
    }
  }

  private file(reference: string) {
    if (!isOrderReference(reference)) throw new Error("INVALID_ORDER_REFERENCE");
    return path.join(this.directory, `${reference}.json`);
  }

  async reserveInvoiceNumber() {
    const directory = path.join(this.directory, "invoice-numbers");
    await mkdir(directory, {recursive: true, mode: 0o700});
    const reserved = await readdir(directory);
    let number = reserved.reduce((largest, name) => isInvoiceNumber(name)
      ? Math.max(largest, Number(name)) : largest, FIRST_INVOICE_NUMBER - 1) + 1;
    while (isInvoiceNumber(String(number))) {
      try {
        await writeFile(path.join(directory, String(number)), "", {flag: "wx", mode: 0o600});
        return number;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        number++;
      }
    }
    throw new Error("INVOICE_NUMBER_RANGE_EXHAUSTED");
  }

  async save(order: Order) {
    await mkdir(this.directory, {recursive: true, mode: 0o700});
    const file = this.file(order.reference);
    const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(order), {flag: "wx", mode: 0o600});
      // Atomic publication, exclusive destination: never expose partial JSON or replace an invoice.
      await link(temporary, file);
    } finally {await unlink(temporary).catch(() => {});}
  }

  async findByReference(reference: string): Promise<Order | null> {
    try {
      const order: Order = JSON.parse(await readFile(this.file(reference), "utf8"));
      if (order.reference !== reference) throw new Error("CORRUPT_STORED_ORDER");
      return order;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  private async update(reference: string, change: (order: Order) => Order) {
    const preceding = this.updates.get(reference) ?? Promise.resolve();
    const task = preceding.catch(() => {}).then(async () => {
      const order = await this.findByReference(reference);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      const file = this.file(reference);
      const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(change(order)), {flag: "wx", mode: 0o600});
        await rename(temporary, file);
      } finally {await unlink(temporary).catch(() => {});}
    });
    this.updates.set(reference, task);
    try {await task;} finally {if (this.updates.get(reference) === task) this.updates.delete(reference);}
  }

  async updatePaymentStatus(reference: string, status: PaymentStatus) {
    await this.update(reference, order => ({...order, paymentStatus: status}));
  }

  async updateInvoiceEmailStatus(reference: string, status: InvoiceEmailStatus) {
    await this.update(reference, order => ({...order, ...(order.invoice ? {invoice: {...order.invoice, emailStatus: status}} : {})}));
  }
}
