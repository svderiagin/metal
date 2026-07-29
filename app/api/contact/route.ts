import {notificationService} from "@/lib/server/notifications";
import {parseContactRequest} from "@/lib/server/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ok: false, error: "Некорректный запрос."}, {status: 400});
  }
  const contact = parseContactRequest(body);
  if (!contact) return Response.json({ok: false, error: "Проверьте данные формы."}, {status: 400});
  if (contact.website) return Response.json({ok: true});
  try {
    await notificationService.sendContactRequest(contact);
    return Response.json({ok: true});
  } catch {
    return Response.json({ok: false, error: "Отправка сообщений пока не настроена."}, {status: 503});
  }
}
