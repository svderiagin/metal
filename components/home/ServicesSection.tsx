import Link from "next/link";
import {services} from "@/data/services";
import {SectionHeading} from "@/components/ui/SectionHeading";

export function ServicesSection() {
  return (
    <section>
      <SectionHeading eyebrow="Обработка и логистика" title="Услуги для комплектного заказа"/>
      <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
        {services.map((service) => (
          <article
            key={service.id}
            className="flex gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <span className="text-2xl font-black text-red-700">{service.marker}</span>
            <div>
              <h3 className="font-bold">{service.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
            </div>
          </article>
        ))}
      </div>
      <Link
        href="/services"
        className="mt-5 inline-flex min-h-11 items-center font-bold text-red-700 transition-colors hover:text-red-800"
      >
        Все услуги →
      </Link>
    </section>
  );
}
