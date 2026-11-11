import {CatalogCoverGallery} from "./CatalogCoverGallery";
import {CatalogDescription} from "./CatalogDescription";
import {Icon} from "@/components/ui/Icon";
import {getPreparedPhoto} from "@/lib/server/preparedPhotos";
import styles from "./ProductCatalogIntro.module.css";

export function ProductCatalogIntro({title, label, images, description, coverName = title, detailsId, summary, resultsHref, resultsLabel = "Размеры и цены"}: {
  title: string;
  label: string;
  images: readonly string[];
  description: string;
  coverName?: string;
  detailsId?: string;
  summary?: string;
  resultsHref?: string;
  resultsLabel?: string;
}) {
  return <header className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
    <div className={`${styles.grid} ${images.length ? styles.withImage : ""}`}>
      <div className={styles.heading}>
        <p className="text-eyebrow uppercase text-slate-500 dark:text-slate-400">{label}{summary && <> <span className="ml-2 border-l border-slate-300 pl-2 normal-case tracking-normal dark:border-slate-600">{summary}</span></>}</p>
        <h1 className="mt-1 text-page-title">{title}</h1>
      </div>
      <CatalogDescription description={description} className={`${styles.description} mt-0`}/>
      {images.length > 0 && <div className={styles.gallery}><CatalogCoverGallery images={images} name={coverName}
        layout="compact" coverPhoto={getPreparedPhoto(images[0])}/></div>}
      {(resultsHref || detailsId) && <div className={`${styles.actions} flex flex-wrap items-center gap-x-5 gap-y-1`}>
        {resultsHref && <a href={resultsHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline hover:underline-offset-4 dark:text-brand-300">{resultsLabel}<Icon name="arrow-down"/></a>}
        {detailsId && <a href={`#${detailsId}`} className="inline-flex min-h-11 items-center text-sm text-slate-600 hover:underline hover:underline-offset-4 dark:text-slate-300">Как выбрать</a>}
      </div>}
    </div>
  </header>;
}
