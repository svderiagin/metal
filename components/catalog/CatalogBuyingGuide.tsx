import {Icon} from "@/components/ui/Icon";
import type {CatalogGuideSection} from "@/data/catalog-description-copy";
import {CatalogGuideFigure} from "./CatalogGuideFigure";
import {CatalogDescription} from "./CatalogDescription";
import {CatalogStandardReference} from "./CatalogStandardReference";
import styles from "./CatalogBuyingGuide.module.css";

export function CatalogBuyingGuide({headingId, title, description, marginClassName = "mt-5"}: {
  headingId: string;
  title: string;
  description: string | readonly CatalogGuideSection[];
  marginClassName?: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={`@container min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${marginClassName}`}
    >
      <h2 id={headingId} tabIndex={-1} className="flex scroll-mt-6 items-start gap-2.5 rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-3 text-card-title text-slate-900 sm:px-5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        <Icon name="info" className="mt-[3px] text-brand-700 dark:text-brand-300"/>
        <span className="min-w-0">{title}</span>
      </h2>
      {typeof description === "string" ? (
        <CatalogDescription description={description} variant="categoryDetails" className="min-w-0 p-4 sm:p-5"/>
      ) : (
        <div className={`${styles.topics} p-4 sm:p-5 ${description.length === 4 ? styles.fourTopics : styles.threeTopics}`}>
          {description.map(({heading, text, diagram}) => <article key={heading} className={styles.topic}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{heading}</h3>
            <CatalogGuideFigure diagram={diagram}/>
            <p className="text-base text-slate-700 dark:text-slate-300">
              <CatalogStandardReference>{text}</CatalogStandardReference>
            </p>
          </article>)}
        </div>
      )}
    </section>
  );
}
