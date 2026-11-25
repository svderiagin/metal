import {companyDetails} from "@/lib/companyDetails";
import {formatCurrency} from "@/lib/currency";
import {formatInvoiceDate} from "@/lib/invoiceDate";
import type {Order} from "@/types/order";
import {orderDocumentLine} from "./orderDocumentLine";

const entities: Record<string, string> = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"};
const escape = (value: string) => value.replace(/[&<>"']/g, char => entities[char]);

export function buildOrderEmail(order: Order) {
  const {brandName, salesEmail, shortName, inn, kpp} = companyDetails;
  const {invoice, customer, delivery} = order;
  const reference = `Заказ № ${order.reference}`;
  const issued = formatInvoiceDate(order.createdAt);
  const invoiceTitle = invoice ? `Счёт № ${invoice.number}` : undefined;
  const deadline = invoice?.paymentDueDate
    ? `Оплатить до ${formatInvoiceDate(invoice.paymentDueDate)} включительно.` : undefined;
  const total = formatCurrency(order.totalAmount);
  const totalLabel = invoice ? "К оплате" : "Стоимость заказа";
  const payment = invoice
    ? "Счёт приложен в формате PDF. Для оплаты используйте реквизиты и назначение платежа из счёта."
    : "Информацию об оплате сообщим отдельно.";
  const next = "Дату и условия отгрузки согласуем с вами.";
  const contact = `По вопросам оплаты, доставки и документов на продукцию напишите на ${salesEmail}. Укажите номер заказа ${order.reference}.`;
  const seller = `${shortName} · ИНН ${inn} · КПП ${kpp}`;
  const customerLabel = customer.type === "COMPANY" && customer.companyName ? customer.companyName : customer.fullName;
  const rows = order.items.map((item, index) => {
    const line = orderDocumentLine(item);
    const unitPrice = `${formatCurrency(item.unitPrice)}/${line.unit}`;
    return {...line, name: `${index + 1}. ${line.name}`, amount: formatCurrency(item.subtotal),
      measure: `${line.quantity} ${line.unit} · ${unitPrice}`};
  });
  const text = [
    brandName, `${reference} от ${issued} оформлен.`, `Покупатель: ${customerLabel}`,
    "", "Состав заказа", ...rows.map(row => [row.name, row.details, `${row.measure} — ${row.amount}`, row.delivery].filter(Boolean).join("\n")),
    "", "Доставка: бесплатно", delivery.address, ...(delivery.comment ? [`Комментарий: ${delivery.comment}`] : []), next,
    "", `${totalLabel}: ${total}`, ...(invoiceTitle ? [invoiceTitle] : []), ...(deadline ? [deadline] : []), payment,
    "", contact, seller,
  ].join("\n");

  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(reference)}</title></head>
<body style="margin:0;background:#f0f4f6;color:#17252d;font:15px/1.5 Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:16px 8px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #d8e2e6">
<tr><td style="padding:24px 16px 20px;background:#173d4d;color:#fff">
  <p style="margin:0 0 8px;font-size:13px;font-weight:bold;letter-spacing:1px">${escape(brandName)}</p>
  <h1 style="margin:0;font-size:24px;line-height:1.25">${escape(reference)}</h1>
  <p style="margin:6px 0 0">Оформлен ${escape(issued)}</p>
</td></tr>
<tr><td style="padding:20px 16px 24px;overflow-wrap:anywhere">
  <div style="padding:14px;background:#eef4f6">
    <p style="margin:0">${totalLabel}</p>
    <p style="margin:2px 0;font-size:23px;font-weight:bold">${escape(total)}</p>
    ${invoiceTitle ? `<p style="margin:8px 0 0;font-weight:bold">${escape(invoiceTitle)}</p>` : ""}
    ${deadline ? `<p style="margin:4px 0 0">${escape(deadline)}</p>` : ""}
    <p style="margin:8px 0 0">${escape(payment)}</p>
  </div>
  <h2 style="font-size:17px;margin:24px 0 4px">Состав заказа</h2>
  <p style="margin:0 0 6px;color:#425561">Покупатель: ${escape(customerLabel)}</p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    ${rows.map(row => `<tr><td style="border-bottom:1px solid #d8e2e6;padding:10px 0">
      <strong>${escape(row.name)}</strong>
      ${row.details ? `<div style="font-size:13px;color:#425561">${escape(row.details)}</div>` : ""}
      <div style="font-size:13px;color:#425561">${escape(row.measure)}</div>
      ${row.delivery ? `<div style="font-size:13px;color:#173d4d">${escape(row.delivery)}</div>` : ""}
      <div style="text-align:right;font-weight:bold">${escape(row.amount)}</div>
    </td></tr>`).join("")}
  </table>
  <h2 style="font-size:17px;margin:24px 0 6px">Доставка</h2>
  <p style="margin:0">${escape(delivery.address)}</p>
  <p style="margin:4px 0 0;color:#425561">Стоимость доставки: бесплатно.</p>
  ${delivery.comment ? `<p style="margin:4px 0 0;white-space:pre-wrap">Комментарий: ${escape(delivery.comment)}</p>` : ""}
  <p style="margin:4px 0 0;color:#425561">${next}</p>
</td></tr>
<tr><td style="padding:16px;background:#eef4f6;color:#425561;font-size:13px;overflow-wrap:anywhere">
  <p style="margin:0 0 6px">По вопросам оплаты, доставки и документов на продукцию напишите на
    <a href="mailto:${escape(salesEmail)}" style="color:#173d4d;font-weight:bold">${escape(salesEmail)}</a>. Укажите номер заказа ${escape(order.reference)}.</p>
  <p style="margin:0">${escape(seller)}</p>
</td></tr>
</table></td></tr></table></body></html>`;

  return {subject: [reference, invoiceTitle, brandName].filter(Boolean).join(" · "), text, html};
}
