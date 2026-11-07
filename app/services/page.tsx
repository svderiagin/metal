import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {companyDetails} from "@/lib/companyDetails";

export const metadata: Metadata = {
  title: "Услуги",
  description: "Резка, гибка, сверление, изготовление и доставка металла."
};
const items = [{
  t: "Резка металла",
  d: "Подготовка труб, сортового и листового проката по ведомости размеров."
}, {t: "Гибка", d: "Формование листовых деталей и простых профилей по техническому заданию."}, {
  t: "Сверление",
  d: "Подготовка технологических и монтажных отверстий в заготовках."
}, {
  t: "Изготовление",
  d: "Производство несложных сварных металлоконструкций по согласованным чертежам."
}, {t: "Доставка", d: "Подбор транспорта, крепление груза и доставка с документами на объект."}];
export default function ServicesPage() {
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs items={[{label: "Услуги"}]}/><h1
    className="text-page-title">Услуги металлообработки</h1><p
    className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">Комплектуйте заказ готовыми заготовками, чтобы сократить операции на
    своей площадке.</p>
    <div
      className="mt-8 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">{items.map((x, i) =>
      <section key={x.t} className="grid gap-3 p-6 md:grid-cols-[80px_260px_1fr]"><span
        className="text-2xl font-bold text-red-700 dark:text-red-400">0{i + 1}</span><h2
        className="text-xl font-bold">{x.t}</h2><p className="leading-7 text-slate-600 dark:text-slate-300">{x.d}</p>
      </section>)}</div>
    <section className="mt-8 max-w-3xl rounded-xl bg-slate-100 p-6 dark:bg-slate-800" aria-labelledby="service-request-heading">
      <h2 id="service-request-heading" className="text-section-title">Что приложить к запросу</h2>
      <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">Укажите материал, сечение и количество заготовок. Для резки подготовьте ведомость длин; для гибки, сверления и изготовления — чертёж с размерами, допусками и требованиями к обработке.</p>
      <p className="mt-4 leading-7">Направьте документы на <a href={`mailto:${companyDetails.salesEmail}`} className="font-semibold underline underline-offset-4">{companyDetails.salesEmail}</a>. Возможность выполнения, сроки и стоимость работ согласуются по техническому заданию.</p>
    </section>
  </PageContainer>
}
