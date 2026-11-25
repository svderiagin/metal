import {CatalogCoverGallery} from "./CatalogCoverGallery";
import {CatalogDescription} from "./CatalogDescription";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {getPreparedPhoto} from "@/lib/server/preparedPhotos";
import cardStyles from "./CatalogCard.module.css";
import styles from "./ProductCatalogIntro.module.css";

export function ProductCatalogIntro({title, label, images, description, coverName = title, detailsId, summary, showProductTypesLink}: {
  title: string;
  label: string;
  images: readonly string[];
  description: string;
  coverName?: string;
  detailsId?: string;
  summary?: string;
  showProductTypesLink?: boolean;
}) {
  return <header className={`${styles.grid} ${cardStyles.contentInset} ${images.length ? styles.withImage : ""} min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900`}>
    <div className={styles.content}>
      <div className={styles.heading}>
        <p className="text-eyebrow uppercase text-slate-500 dark:text-slate-400">{label}{summary && <> <span className="ml-2 border-l border-slate-300 pl-2 normal-case tracking-normal dark:border-slate-600">{summary}</span></>}</p>
        <h1 className="mt-1 text-page-title">{title}</h1>
      </div>
      <CatalogDescription description={description} className={`${styles.description} mt-0`}/>
      {(showProductTypesLink || detailsId) && <div className={`${styles.actions} flex flex-wrap items-center gap-x-4 gap-y-2`}>
        {showProductTypesLink && <a href="#catalog-types" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-brand-300">Выбрать продукцию<Icon name="arrow-down"/></a>}
        {detailsId && <ButtonLink href={`#${detailsId}`} variant="secondary" className={`${styles.guideLink} max-w-full`}>
          Как выбрать<Icon name="arrow-down"/>
        </ButtonLink>}
      </div>}
    </div>
    {images.length > 0 && <div className={styles.gallery}>
      <CatalogCoverGallery images={images} name={coverName} layout="compact"
        className={styles.cover} coverPhoto={getPreparedPhoto(images[0])}/>
    </div>}
  </header>;
}
