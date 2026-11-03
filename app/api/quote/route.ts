import {readJsonBody} from "@/lib/server/request";
import {notificationService} from "@/lib/server/notifications";
import {parseQuoteRequest} from "@/lib/server/validation";
import {validateQuoteFields} from "@/lib/quoteValidation";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
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
    return Response.json({ok: false, error: "Отправка временно недоступна. Свяжитесь с нами по телефону."}, {status: 503});
  }
}
