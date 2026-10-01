import {ButtonLink} from "@/components/ui/Button";
import {PageContainer} from "@/components/layout/PageContainer";

export function HeroSection() {
  const stats = ["16 категорий", "120+ товаров", "Оплата картой", "Счёт для организаций"];
  return (
    <section className="border-b border-slate-300 bg-slate-900 text-white">
      <PageContainer className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr] md:items-center md:py-16 lg:gap-14 lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-500">
            Комплектация со склада
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            Металлоконструкции и металлопрокат со склада
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-slate-300">
            Поставляем металл компаниям и частным клиентам. Принимаем оплату картой и по счёту,
            выполняем резку и организуем доставку.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/catalog">Перейти в каталог</ButtonLink>
            <ButtonLink href="/#request" variant="secondary">Запросить расчёт</ButtonLink>
          </div>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
          {stats.map((stat, index) => (
            <div
              key={stat}
              className={`flex min-h-28 items-center p-5 text-sm font-bold sm:p-6 ${
                index % 2 === 0 ? "border-r border-slate-700" : ""
              } ${index < 2 ? "border-b border-slate-700" : ""}`}
            >
              <span className="mr-3 text-2xl text-red-500">0{index + 1}</span>
              {stat}
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
