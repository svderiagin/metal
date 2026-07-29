import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";

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
    className="text-3xl font-black">Услуги металлообработки</h1><p
    className="mt-3 max-w-3xl text-slate-600">Комплектуйте заказ готовыми заготовками, чтобы сократить операции на
    своей площадке.</p>
    <div
      className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">{items.map((x, i) =>
      <section key={x.t} className="grid gap-3 p-6 md:grid-cols-[80px_260px_1fr]"><span
        className="font-mono text-2xl font-black text-red-700">0{i + 1}</span><h2
        className="text-xl font-bold">{x.t}</h2><p className="leading-7 text-slate-600">{x.d}</p>
      </section>)}</div>
  </PageContainer>
}
