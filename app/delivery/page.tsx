import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {companyDetails} from "@/lib/companyDetails";

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
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs items={[{label: "Доставка"}]}/><h1
    className="text-page-title">Доставка и самовывоз</h1><p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">Организуем
    перевозку с учётом габаритов металлопроката и условий на площадке.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2">{sections.map((s, i) => <section key={s.t}
                                                                                     className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
      <span className="text-sm font-bold text-red-700 dark:text-red-400">0{i + 1}</span><h2
      className="mt-3 text-xl font-bold">{s.t}</h2><p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{s.d}</p>
    </section>)}</div>
    <section className="mt-8 max-w-3xl rounded-xl bg-slate-100 p-6 dark:bg-slate-800" aria-labelledby="delivery-request-heading">
      <h2 id="delivery-request-heading" className="text-section-title">Данные для расчёта доставки</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-slate-700 dark:text-slate-300">
        <li>Перечень позиций, количество, масса и длина самых длинных изделий.</li>
        <li>Адрес объекта и желаемая дата получения.</li>
        <li>Ограничения подъезда, место разгрузки и доступная техника.</li>
      </ul>
      <p className="mt-4 leading-7">Отправьте данные на <a href={`mailto:${companyDetails.salesEmail}`} className="font-semibold underline underline-offset-4">{companyDetails.salesEmail}</a>. Стоимость и возможность доставки по вашему адресу согласуются при расчёте заказа.</p>
    </section>
  </PageContainer>
}
