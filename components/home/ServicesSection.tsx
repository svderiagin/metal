import {services} from "@/data/services";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";

export function ServicesSection() {
  return (
    <section aria-labelledby="home-services-heading">
      <div className="mb-5">
        <p className="mb-1 text-eyebrow uppercase text-slate-500 dark:text-slate-400">Услуги</p>
        <h2 id="home-services-heading" className="text-section-title text-slate-950 dark:text-slate-100">Обработка и доставка</h2>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700 md:grid-cols-2">
        {services.map((service) => (
          <li
            key={service.id}
            className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 bg-white p-4 dark:bg-slate-900 sm:p-5"
          >
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-sm border border-slate-200 bg-slate-50 text-xs font-medium tabular-nums text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{service.marker}</span>
            <div className="min-w-0">
              <h3 className="text-card-title text-slate-950 dark:text-slate-100">{service.name}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <ButtonLink
        href="/services"
        variant="secondary"
        className="mt-4 gap-2"
      >
        Все услуги <Icon name="arrow-right"/>
      </ButtonLink>
    </section>
  );
}
