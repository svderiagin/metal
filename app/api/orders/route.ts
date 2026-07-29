import {notificationService} from "@/lib/server/notifications";
import {createTrustedOrder, orderRepository} from "@/lib/server/orders";
import {parseCreateOrderInput} from "@/lib/server/validation";

const error = (message: string, status: number) =>
  Response.json({ok: false, error: message}, {status});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Некорректный запрос.", 400);
  }
  const input = parseCreateOrderInput(body);
  if (!input) return error("Проверьте данные заказа.", 400);
  const order = createTrustedOrder(input);
  if (!order) return error("Один или несколько товаров недоступны.", 400);
  try {
    await orderRepository.save(order);
    await notificationService.sendOrderNotification(order);
  } catch {
    return error("Сервис оформления временно не настроен.", 503);
  }
  return Response.json({
    ok: true,
    order: {reference: order.reference, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod},
  }, {status: 201});
}
