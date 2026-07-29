import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";

export const metadata: Metadata = {title: "Доставка", description: "Варианты доставки и самовывоза металлопроката."};
const sections = [{
  t: "Варианты доставки",
  d: "Выделенный грузовой транспорт по городу и области, а также междугородняя перевозка через проверенных перевозчиков."
}, {
  t: "Самовывоз",
  d: "Получение со склада по предварительно согласованному времени. Для въезда потребуется номер заказа и данные автомобиля."
}, {
  t: "Расчёт доставки",
  d: "Стоимость зависит от массы, длины продукции, типа машины, расстояния и ограничений на подъезд к объекту."
}, {
  t: "Сроки",
  d: "Складские позиции обычно готовы к отгрузке после комплектации и подтверждения оплаты. Точный интервал сообщает менеджер."
}, {
  t: "Разгрузка",
  d: "Сообщите заранее о наличии крана, погрузчика, ограничении высоты и возможности подъезда длинномерного транспорта."
}];
export default function DeliveryPage() {
  return <PageContainer className="py-8"><Breadcrumbs items={[{label: "Доставка"}]}/><h1
    className="text-3xl font-black">Доставка и самовывоз</h1><p className="mt-3 max-w-3xl text-slate-600">Организуем
    перевозку с учётом габаритов металлопроката и условий на площадке.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2">{sections.map((s, i) => <section key={s.t}
                                                                                     className="rounded-lg border border-slate-200 bg-white p-6">
      <span className="text-sm font-black text-red-700">0{i + 1}</span><h2
      className="mt-3 text-xl font-bold">{s.t}</h2><p className="mt-2 leading-7 text-slate-600">{s.d}</p>
    </section>)}</div>
  </PageContainer>
}
