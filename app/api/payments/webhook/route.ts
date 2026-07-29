import { orderRepository } from "@/lib/server/orders";
import { paymentProvider } from "@/lib/server/payments";

const processedEventIds = new Set<string>();

export async function POST(request: Request) {
  try {
    // The provider adapter owns raw-body reading and signature verification.
    const event = await paymentProvider.verifyWebhook(request);
    if (processedEventIds.has(event.eventId)) return new Response(null, { status: 204 });
    const order = await orderRepository.findByReference(event.orderReference);
    if (!order) return Response.json({ ok: false, error: "Заказ не найден." }, { status: 404 });
    await orderRepository.updatePaymentStatus(order.reference, event.status);
    processedEventIds.add(event.eventId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ ok: false, error: "Webhook не подтверждён." }, { status: 401 });
  }
}
