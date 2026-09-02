import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {companyDetails} from "@/lib/companyDetails";

export const metadata: Metadata = {
  title: "О компании",
  description: `${companyDetails.shortName} поставляет металлопрокат для строительства, производства и частных проектов.`
};

const advantages = [
  {
    title: "Широкий ассортимент",
    description: "Подбираем металлопрокат по типу, размеру, марке стали и ГОСТ. Если нужной позиции нет в наличии, предлагаем подходящий вариант или поставку под заказ.",
  },
  {
    title: "Комплексная поставка",
    description: "В одной заявке можно собрать разные виды металлопроката. Проверяем спецификацию, наличие и сроки и подготавливаем заказ к отгрузке.",
  },
  {
    title: "Понятные цены и условия",
    description: "Стоимость, состав заказа и условия поставки согласовываются до оплаты. Покупатель заранее понимает, что входит в заказ и когда он будет готов.",
  },
  {
    title: "Контроль комплектации",
    description: "Проверяем соответствие отгружаемой продукции заказанной спецификации, маркировку и комплектность партии.",
  },
  {
    title: "Документы на продукцию",
    description: "Для продукции, где это предусмотрено поставкой, передаём сопроводительные документы и сертификаты производителя.",
  },
  {
    title: "Доставка под заказ",
    description: "Подбираем транспорт с учётом веса, габаритов и объёма партии и согласовываем условия доставки.",
  },
] as const;

export default function AboutPage() {
  return <PageContainer className="py-6 sm:py-8"><Breadcrumbs items={[{label: "О компании"}]}/>
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Поставщик металлопроката</p>
      <h1 className="mt-1.5 text-3xl font-black">О компании {companyDetails.shortName}</h1>
      <div className="mt-4 max-w-5xl space-y-2.5 leading-7 text-slate-600">
        <p>{companyDetails.shortName} поставляет металлопрокат для строительства, производства и частных проектов. В каталоге — арматура, трубы, листовой, сортовой и фасонный прокат в различных размерах, марках стали и стандартах.</p>
        <p>Мы работаем как со складскими позициями, так и с поставками под заказ. Помогаем подобрать нужный металл, собрать комплексную заявку и организовать доставку до объекта.</p>
      </div>

      <section className="mt-5 border-t border-slate-200 pt-5">
        <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Почему выбирают нас</h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((advantage, index) => <div key={advantage.title} className="bg-white px-3 py-3.5 sm:px-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-sm font-black text-red-700">0{index + 1}</span>
              <h3 className="font-bold">{advantage.title}</h3>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{advantage.description}</p>
          </div>)}
        </div>
      </section>
    </article>
  </PageContainer>
}
