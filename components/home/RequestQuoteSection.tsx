import {QuoteRequestForm} from "@/components/forms/QuoteRequestForm";
import {companyDetails} from "@/lib/companyDetails";
import {HomeRequestAnchor} from "./HomeRequestAnchor";

export function RequestQuoteSection({appearance = "default"}: {appearance?: "default" | "home" | "cart"}) {
  if (appearance === "home") return <section id="request" tabIndex={-1} aria-labelledby="home-request-heading" className="scroll-my-6 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    <HomeRequestAnchor/>
    <div className="grid lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
      <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950 sm:p-6 lg:border-b-0 lg:border-r lg:p-7">
        <h2 id="home-request-heading" className="text-section-title">Запросить расчёт поставки</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Чтобы мы могли рассчитать заказ, укажите в заявке:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>Наименование, размеры и марку стали, если она задана</li>
          <li>Количество в штуках, метрах или тоннах</li>
          <li>Адрес доставки или самовывоз</li>
        </ul>
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300">Если есть ведомость или чертёж, отправьте файл на почту отдела продаж.</p>
          <a href={`mailto:${companyDetails.salesEmail}`} className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-brand-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-brand-300">{companyDetails.salesEmail}</a>
        </div>
      </div>
      <div data-quote-fields tabIndex={-1} className="min-w-0 scroll-my-6 p-5 sm:p-6 lg:p-7"><QuoteRequestForm/></div>
    </div>
  </section>;

  return <section id="request" tabIndex={-1} aria-labelledby="catalog-request-heading" className="scroll-my-6 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 md:p-8 lg:p-10">
    <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
      <div><p className="text-eyebrow uppercase text-brand-700 dark:text-brand-400">Коммерческое предложение</p><h2
        id="catalog-request-heading" className={`mt-2 ${appearance === "cart" ? "text-card-title" : "text-section-title"}`}>Запросите расчёт поставки</h2><p
        className={`mt-3 text-slate-600 dark:text-slate-300 ${appearance === "cart" ? "text-sm" : "leading-6"}`}>Укажите тип продукции, размеры, количество и адрес доставки. Приложить ведомость или чертёж можно в письме в отдел продаж.</p>
        <a href={`mailto:${companyDetails.salesEmail}`} className="mt-4 inline-flex min-h-11 items-center break-all font-semibold underline underline-offset-4">{companyDetails.salesEmail}</a></div>
      <div data-quote-fields tabIndex={-1} className="min-w-0 scroll-my-6">
        <QuoteRequestForm descriptionPlaceholder="Наименование и размер позиции, количество с единицей измерения, адрес доставки"/>
      </div>
    </div>
  </section>
}
