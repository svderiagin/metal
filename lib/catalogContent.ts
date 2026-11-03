// Keep saved supplier evidence intact while removing merchant boilerplate.
export function storefrontDescription(description: string) {
  return description.replace(/Компания «Розмет» предлагает/gu, "В каталоге можно выбрать")
    .replace(/В компании «Розмет» можно/gu, "Можно");
}
