import { ButtonLink } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";

export function HeroSection() {
  const stats = ["16 категорий", "120+ товаров", "Оплата картой", "Счёт для организаций"];
  return (
    <section className="border-b border-slate-300 bg-slate-900 text-white">
      <PageContainer className="grid gap-8 py-10 md:grid-cols-[1.4fr_1fr] md:py-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-red-500">Комплектация со склада</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Металлопрокат и стальные трубы со склада</h1>
          <p className="mt-5 max-w-2xl leading-7 text-slate-300">Поставляем металл компаниям и частным клиентам. Принимаем оплату картой и по счёту, выполняем резку и организуем доставку.</p>
          <div className="mt-7 flex flex-wrap gap-3"><ButtonLink href="/catalog">Перейти в каталог</ButtonLink><ButtonLink href="/#request" variant="secondary">Запросить расчёт</ButtonLink></div>
        </div>
        <div className="grid grid-cols-2 self-end overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
          {stats.map((stat, index) => <div key={stat} className={`flex min-h-24 items-center p-4 text-sm font-bold ${index % 2 === 0 ? "border-r border-slate-700" : ""} ${index < 2 ? "border-b border-slate-700" : ""}`}><span className="mr-3 text-2xl text-red-500">0{index + 1}</span>{stat}</div>)}
        </div>
      </PageContainer>
    </section>
  );
}
