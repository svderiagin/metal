import {QuoteRequestForm} from "@/components/forms/QuoteRequestForm";

export function RequestQuoteSection() {
  return <section id="request" className="scroll-mt-6 rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6 md:p-8 lg:p-10">
    <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-red-700">Коммерческое предложение</p><h2
        className="mt-2 text-2xl font-black">Запросите расчёт поставки</h2><p
        className="mt-3 leading-6 text-slate-600">Укажите тип и объём продукции. В рабочей версии менеджер
        уточнит наличие, обработку и логистику.</p></div>
      <QuoteRequestForm/></div>
  </section>
}
