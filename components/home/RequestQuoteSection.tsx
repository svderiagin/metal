import {QuoteRequestForm} from "@/components/forms/QuoteRequestForm";
import {companyDetails} from "@/lib/companyDetails";

export function RequestQuoteSection({appearance = "default"}: {appearance?: "default" | "home"}) {
  if (appearance === "home") return <section id="request" aria-labelledby="home-request-heading" className="scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    <div className="grid lg:grid-cols-[.85fr_1.15fr]">
      <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950 sm:p-6 lg:border-b-0 lg:border-r lg:p-7">
        <p className="text-eyebrow uppercase text-slate-500 dark:text-slate-400">Расчёт заказа</p>
        <h2 id="home-request-heading" className="mt-2 text-section-title">Поставка по вашей спецификации</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Укажите состав заказа. Стоимость, наличие и сроки согласуем при обработке заявки.</p>
        <dl className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
          <div><dt className="font-semibold">Продукция</dt><dd className="text-slate-600 dark:text-slate-300">Наименование, размеры, марка стали</dd></div>
          <div><dt className="font-semibold">Объём</dt><dd className="text-slate-600 dark:text-slate-300">Количество и единицы измерения</dd></div>
          <div><dt className="font-semibold">Получение</dt><dd className="text-slate-600 dark:text-slate-300">Адрес доставки или самовывоз</dd></div>
        </dl>
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-300">Ведомости и чертежи можно отправить на почту:</p>
          <a href={`mailto:${companyDetails.salesEmail}`} className="inline-flex min-h-11 items-center break-all text-sm font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">{companyDetails.salesEmail}</a>
        </div>
      </div>
      <div className="min-w-0 p-5 sm:p-6 lg:p-7"><QuoteRequestForm/></div>
    </div>
  </section>;

  return <section id="request" className="scroll-mt-6 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 md:p-8 lg:p-10">
    <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
      <div><p className="text-eyebrow uppercase text-brand-700 dark:text-brand-400">Коммерческое предложение</p><h2
        className="text-section-title mt-2">Запросите расчёт поставки</h2><p
        className="mt-3 leading-6 text-slate-600 dark:text-slate-300">Укажите тип продукции, размеры, количество и адрес доставки. Приложить ведомость или чертёж можно в письме в отдел продаж.</p>
        <a href={`mailto:${companyDetails.salesEmail}`} className="mt-4 inline-flex min-h-11 items-center break-all font-semibold underline underline-offset-4">{companyDetails.salesEmail}</a></div>
      <QuoteRequestForm/></div>
  </section>
}
