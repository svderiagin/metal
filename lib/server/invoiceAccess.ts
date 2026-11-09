import {createHash, randomBytes, timingSafeEqual} from "node:crypto";

export function hashInvoiceToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInvoiceAccess() {
  const token = randomBytes(32).toString("hex");
  return {token, hash: hashInvoiceToken(token)};
}

export function canReadInvoice(token: string, expectedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(expectedHash)) return false;
  return timingSafeEqual(Buffer.from(hashInvoiceToken(token), "hex"), Buffer.from(expectedHash, "hex"));
}
