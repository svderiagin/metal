const MAX_JSON_BYTES = 64 * 1024;

// Bound the actual stream as well as Content-Length, which clients may omit.
export async function readJsonBody(request: Request): Promise<{ok: true; value: unknown} | {ok: false; response: Response}> {
  const failure = (status: number, error: string) => ({ok: false as const, response: Response.json({ok: false, error}, {status})});
  if (Number(request.headers.get("content-length")) > MAX_JSON_BYTES) return failure(413, "Слишком большой запрос.");
  const reader = request.body?.getReader();
  if (!reader) return failure(400, "Некорректный запрос.");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_JSON_BYTES) {
        await reader.cancel();
        return failure(413, "Слишком большой запрос.");
      }
      text += decoder.decode(chunk.value, {stream: true});
    }
    text += decoder.decode();
    return {ok: true, value: JSON.parse(text)};
  } catch {return failure(400, "Некорректный запрос.");}
  finally {reader.releaseLock();}
}
