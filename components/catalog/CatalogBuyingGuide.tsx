import {Icon} from "@/components/ui/Icon";
import {CatalogDescription} from "./CatalogDescription";

export function CatalogBuyingGuide({headingId, title, description}: {
  headingId: string;
  title: string;
  description: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="my-1 grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950 lg:my-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-10 lg:p-6"
    >
      <h2 id={headingId} className="flex items-start gap-2.5 scroll-mt-12 text-card-title text-slate-900 dark:text-slate-100">
        <Icon name="info" className="mt-[3px] text-brand-700 dark:text-brand-300"/>
        <span className="min-w-0">{title}</span>
      </h2>
      <CatalogDescription description={description} variant="categoryDetails" className="min-w-0"/>
    </section>
  );
}
