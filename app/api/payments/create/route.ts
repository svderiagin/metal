import {readJsonBody} from "@/lib/server/request";
import {orderRepository} from "@/lib/server/orders";
import {hasValidOrderAmount, paymentProvider} from "@/lib/server/payments";
import {isOrderReference} from "@/lib/orderReference";

const error = (message: string, status: number) =>
  Response.json({ok: false, error: message}, {status});

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  if (typeof body !== "object" || body === null || !("orderReference" in body) || !isOrderReference(body.orderReference)) {
    return error("Некорректный номер заказа.", 400);
  }
  try {
    const order = await orderRepository.findByReference(body.orderReference);
    if (!order || order.paymentMethod !== "CARD") return error("Заказ не найден.", 404);
    if (!hasValidOrderAmount(order)) return error("Не удалось проверить сумму заказа.", 409);
    const session = await paymentProvider.createPayment(order);
    return Response.json({ok: true, redirectUrl: session.redirectUrl});
  } catch {
    return error("Онлайн-оплата пока не настроена.", 503);
  }
}
