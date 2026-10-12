import {notificationService} from "@/lib/server/notifications";
import {parseQuoteRequest} from "@/lib/server/validation";
import {validateQuoteFields} from "@/lib/quoteValidation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ok: false, error: "Некорректный запрос."}, {status: 400});
  }
  const quote = parseQuoteRequest(body);
  if (!quote) {
    const fieldErrors = typeof body === "object" && body !== null && !Array.isArray(body)
      ? validateQuoteFields(body as Record<string, unknown>) : {};
    return Response.json({ok: false, error: Object.values(fieldErrors).join(" ") || "Некорректные данные формы.", fieldErrors}, {status: 400});
  }
  if (quote.website) return Response.json({ok: true});
  try {
    await notificationService.sendQuoteRequest(quote);
    return Response.json({ok: true});
  } catch {
    return Response.json({ok: false, error: "Отправка заявок пока не настроена."}, {status: 503});
  }
}
