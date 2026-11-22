import {Icon} from "@/components/ui/Icon";
import type {CatalogGuideSection} from "@/data/catalog-description-copy";
import {CatalogGuideFigure} from "./CatalogGuideFigure";
import {CatalogDescription} from "./CatalogDescription";
import styles from "./CatalogBuyingGuide.module.css";

export function CatalogBuyingGuide({headingId, title, description}: {
  headingId: string;
  title: string;
  description: string | readonly CatalogGuideSection[];
}) {
  const fourTopics = typeof description !== "string" && description.length === 4;

  return (
    <section
      aria-labelledby={headingId}
      className="@container mt-5 min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    >
      <h2 id={headingId} tabIndex={-1} className="flex scroll-mt-6 items-start gap-2.5 rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-3 text-card-title text-slate-900 sm:px-5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        <Icon name="info" className="mt-[3px] text-brand-700 dark:text-brand-300"/>
        <span className="min-w-0">{title}</span>
      </h2>
      {typeof description === "string" ? (
        <CatalogDescription description={description} variant="categoryDetails" className="min-w-0 p-4 sm:p-5"/>
      ) : (
        <div className={`grid p-4 sm:p-5 ${fourTopics ? styles.fourTopics : "gap-x-8 gap-y-5 @min-[56rem]:grid-cols-3"}`}>
          {description.map(({heading, text, icon, diagram}) => <div key={heading} className={`min-w-0 max-w-[68ch]${fourTopics ? ` ${styles.topic}` : ""}`}>
            <h3 className={`flex gap-2.5 text-base font-semibold text-slate-900 dark:text-slate-100 ${fourTopics ? "items-start" : "items-center"}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><Icon name={icon}/></span>
              <span className={fourTopics ? "min-w-0 pt-[0.1875rem]" : "min-w-0"}>{heading}</span>
            </h3>
            <p className={`${fourTopics ? "" : "mt-2 "}text-base text-slate-700 dark:text-slate-300`}>{text}</p>
            {diagram && <div className={fourTopics ? "grid min-w-0" : undefined}>
              {(Array.isArray(diagram) ? diagram : [diagram]).map(example =>
                <CatalogGuideFigure key={example.shape} diagram={example}/>)}
            </div>}
          </div>)}
        </div>
      )}
    </section>
  );
}
