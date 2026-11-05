import {CatalogCoverGallery} from "./CatalogCoverGallery";
import {CatalogDescription} from "./CatalogDescription";

export function ProductCatalogIntro({title, label, images, description, coverName = title}: {
  title: string;
  label: string;
  images: readonly string[];
  description: string;
  coverName?: string;
}) {
  return <div className="min-w-0">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 lg:p-8">
      <p className="text-eyebrow uppercase text-red-700 dark:text-red-400">{label}</p>
      <h1 className="mt-2 break-words text-page-title">{title}</h1>
      {images.length > 0 && <CatalogCoverGallery images={images} name={coverName}/>}
      <CatalogDescription description={description}/>
    </div>
  </div>;
}
