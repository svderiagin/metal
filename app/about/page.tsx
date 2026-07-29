import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";

export const metadata: Metadata = {
  title: "О компании",
  description: "Принципы работы демонстрационной компании Metal Store."
};
export default function AboutPage() {
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs items={[{label: "О компании"}]}/>
    <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <article className="rounded-lg border border-slate-200 bg-white p-6 md:p-8"><h1
        className="text-3xl font-black">О компании METAL STORE</h1><p
        className="mt-5 leading-7 text-slate-600">METAL STORE — торговая компания, созданная для демонстрации
        современной витрины поставщика металлопроката. Мы комплектуем заявки бизнеса и частных клиентов из
        складских и заказных позиций.</p><h2 className="mt-8 text-xl font-bold">Принципы поставки</h2><p
        className="mt-2 leading-7 text-slate-600">Прозрачная спецификация, подтверждение сроков до оплаты и
        выбор подходящего транспорта для каждой партии.</p><h2 className="mt-8 text-xl font-bold">Контроль
        качества</h2><p className="mt-2 leading-7 text-slate-600">Проверяем маркировку, геометрию и
        комплектность. Документы производителя передаются вместе с заказом, если они предусмотрены партией.</p>
      </article>
      <aside className="rounded-lg bg-slate-900 p-6 text-white"><h2 className="text-xl font-bold">Для бизнеса и
        розницы</h2>
        <ul className="mt-5 space-y-4 text-sm text-slate-300">
          <li>— Счёт и комплект закрывающих документов</li>
          <li>— Оплата картой для небольших заказов</li>
          <li>— Резка и подготовка к монтажу</li>
          <li>— Комплектация нескольких товарных групп</li>
        </ul>
      </aside>
    </div>
  </PageContainer>
}
