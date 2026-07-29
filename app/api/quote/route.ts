import { notificationService } from "@/lib/server/notifications";
import { parseQuoteRequest } from "@/lib/server/validation";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
  }
  const quote = parseQuoteRequest(body);
  if (!quote) return Response.json({ ok: false, error: "Проверьте данные формы." }, { status: 400 });
  if (quote.website) return Response.json({ ok: true });
  try {
    await notificationService.sendQuoteRequest(quote);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Отправка заявок пока не настроена." }, { status: 503 });
  }
}
