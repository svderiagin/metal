import {createHash} from "node:crypto";

const submissions = new Map<string, Promise<unknown>>();

export async function serializeCheckout<T>(keyHash: string, submit: () => Promise<T>): Promise<T> {
  const preceding = submissions.get(keyHash);
  const current = (preceding ?? Promise.resolve()).catch(() => {}).then(submit);
  submissions.set(keyHash, current);
  try {
    return await current;
  } finally {
    if (submissions.get(keyHash) === current) submissions.delete(keyHash);
  }
}

export function checkoutOrderReference(keyHash: string, attempt: number): string {
  const digest = createHash("sha256").update(`order-reference:${keyHash}:${attempt}`).digest();
  return String(1_000_000_000 + Number(digest.readBigUInt64BE() % BigInt(9_000_000_000)));
}

export function checkoutInvoiceToken(key: string, reference: string): string {
  return createHash("sha256").update(`invoice-download:${key}:${reference}`).digest("hex");
}
