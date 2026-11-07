import {CatalogCoverGallery} from "./CatalogCoverGallery";
import {CatalogDescription} from "./CatalogDescription";

export function ProductCatalogIntro({title, label, images, description, coverName = title, detailsId}: {
  title: string;
  label: string;
  images: readonly string[];
  description: string;
  coverName?: string;
  detailsId?: string;
}) {
  return <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
    <div className={`grid items-start gap-4 sm:gap-6 ${images.length ? "sm:grid-cols-[minmax(0,1fr)_200px] lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
      <div className="min-w-0">
        <p className="text-eyebrow uppercase text-slate-500 dark:text-slate-400">{label}</p>
        <h1 className="mt-1 break-words text-page-title">{title}</h1>
        <CatalogDescription description={description} className="mt-3"/>
        {detailsId && <a href={`#${detailsId}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 underline underline-offset-4 dark:text-slate-300">Рекомендации по выбору ↓</a>}
      </div>
      {images.length > 0 && <CatalogCoverGallery images={images} name={coverName} layout="compact" className="max-w-48 sm:max-w-none"/>}
    </div>
  </div>;
}
