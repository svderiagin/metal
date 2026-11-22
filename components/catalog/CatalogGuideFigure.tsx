import type {CatalogGuideDiagram} from "@/data/catalog-description-copy";
import styles from "./CatalogGuideFigure.module.css";

export function CatalogGuideFigure({diagram}: {diagram: CatalogGuideDiagram}) {
  const frame = `${styles.figure} mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950`;

  if (diagram.shape === "sheet-width") {
    return <figure aria-label="Полная и полезная ширина профнастила" className={`${frame} w-full max-w-80`}>
      <div className="flex flex-wrap justify-between gap-x-2 text-xs font-semibold">
        <span>Полная ширина</span>
        <span className="font-normal text-slate-600 dark:text-slate-300">Нахлёст</span>
      </div>
      <div className={styles.fullWidth} aria-hidden="true"/>
      <div className={styles.coverWidth} aria-hidden="true"/>
      <figcaption className="text-xs font-semibold">Полезная ширина без нахлёста</figcaption>
    </figure>;
  }

  return <figure aria-label="Размеры на примере из каталога" className={`${frame} grid w-fit max-w-full grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-x-3`}>
    <div className="grid place-items-center" aria-hidden="true">
      <div className={`${styles.shape} ${styles[diagram.shape]}`}/>
    </div>
    <dl className="min-w-0 space-y-1 text-xs">
      {diagram.dimensions.map(([label, value]) => <div key={label} className="flex flex-wrap items-baseline gap-x-2">
        <dt className="text-slate-600 dark:text-slate-300">{label}</dt>
        <dd className="font-semibold tabular-nums text-slate-950 dark:text-slate-100">{value}</dd>
      </div>)}
    </dl>
  </figure>;
}
