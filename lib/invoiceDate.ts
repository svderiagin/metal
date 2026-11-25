const invoiceDateFormat = new Intl.DateTimeFormat("ru-RU", {timeZone: "Europe/Moscow"});

export function formatInvoiceDate(value: string) {
  return invoiceDateFormat.format(new Date(value));
}
