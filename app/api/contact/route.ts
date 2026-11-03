import {readJsonBody} from "@/lib/server/request";
import {notificationService} from "@/lib/server/notifications";
import {parseContactRequest} from "@/lib/server/validation";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const contact = parseContactRequest(body);
  if (!contact) return Response.json({ok: false, error: "Проверьте данные формы."}, {status: 400});
  if (contact.website) return Response.json({ok: true});
  try {
    await notificationService.sendContactRequest(contact);
    return Response.json({ok: true});
  } catch {
    return Response.json({ok: false, error: "Отправка временно недоступна. Свяжитесь с нами по телефону."}, {status: 503});
  }
}
