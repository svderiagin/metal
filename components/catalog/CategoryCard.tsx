import {catalogImageUrl} from "@/lib/catalog-image";
import Link from "next/link";
import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import {getPreparedPhoto} from "@/lib/server/preparedPhotos";
import type {Category} from "@/types/category";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";
import styles from "./CatalogCard.module.css";

export function CategoryCard({category}: { category: Category }) {
  const hasImage = Boolean(category.imageUrl && !category.imageUrl.endsWith(".svg"));
  return (
    <article className="h-full">
      <Link
        href={`/catalog/${category.slug}`}
        className={`${styles.card} ${styles.contentInset} group flex h-full min-h-52 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200`}
      >
        {hasImage && category.imageUrl ? <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-t-xl bg-white">
          <PreparedPhoto photo={getPreparedPhoto(category.imageUrl)} src={catalogImageUrl(category.imageUrl)} alt="" fill
            sizes="auto, (min-width: 1280px) 422px, (min-width: 640px) calc((100vw - 56px) / 2), calc(100vw - 34px)"
            className="object-cover object-center"/>
        </div> : <div
          className="ms-[var(--catalog-content-inset)] mt-[var(--catalog-content-inset)] flex size-12 items-center justify-center rounded-lg bg-slate-900 text-xl font-bold text-white"
          aria-hidden
        >
          {category.name.slice(0, 2).toUpperCase()}
        </div>}
        <div className={`${styles.body} flex flex-1 flex-col`}>
          <h3 className="text-card-title text-slate-950 dark:text-slate-100">
            {category.name}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {catalogDescriptionCopy[category.id]?.intro ?? category.descriptionSections?.intro ?? category.shortDescription}
          </p>
        </div>
      </Link>
    </article>
  );
}
