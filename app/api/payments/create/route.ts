import { orderRepository } from "@/lib/server/orders";
import { paymentProvider } from "@/lib/server/payments";

const error = (message: string, status: number) =>
  Response.json({ ok: false, error: message }, { status });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Некорректный запрос.", 400);
  }
  if (typeof body !== "object" || body === null || !("orderReference" in body) || typeof body.orderReference !== "string" || !/^MS-[A-F0-9]{12}$/.test(body.orderReference)) {
    return error("Некорректный номер заказа.", 400);
  }
  try {
    const order = await orderRepository.findByReference(body.orderReference);
    if (!order || order.paymentMethod !== "CARD") return error("Заказ не найден.", 404);
    const verifiedAmount = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    if (verifiedAmount !== order.totalAmount) return error("Не удалось проверить сумму заказа.", 409);
    const session = await paymentProvider.createPayment(order);
    return Response.json({ ok: true, redirectUrl: session.redirectUrl });
  } catch {
    return error("Онлайн-оплата пока не настроена.", 503);
  }
}
