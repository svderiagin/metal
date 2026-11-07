import {QuoteRequestForm} from "@/components/forms/QuoteRequestForm";
import {companyDetails} from "@/lib/companyDetails";

export function RequestQuoteSection() {
  return <section id="request" className="scroll-mt-6 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 md:p-8 lg:p-10">
    <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
      <div><p className="text-eyebrow uppercase text-brand-700 dark:text-brand-400">Коммерческое предложение</p><h2
        className="text-section-title mt-2">Запросите расчёт поставки</h2><p
        className="mt-3 leading-6 text-slate-600 dark:text-slate-300">Укажите тип продукции, размеры, количество и адрес доставки. Приложить ведомость или чертёж можно в письме в отдел продаж.</p>
        <a href={`mailto:${companyDetails.salesEmail}`} className="mt-4 inline-flex min-h-11 items-center break-all font-semibold underline underline-offset-4">{companyDetails.salesEmail}</a></div>
      <QuoteRequestForm/></div>
  </section>
}
