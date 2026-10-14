export function isApiSuccess(value: unknown): value is {ok: true} {
  return typeof value === "object" && value !== null && "ok" in value && value.ok === true;
}

export function readApiError(value: unknown, fallback: string): string {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string" ? value.error : fallback;
}
