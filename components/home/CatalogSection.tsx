import {getAllCategories} from "@/lib/catalog";
import Link from "next/link";
import {Icon} from "@/components/ui/Icon";
import {catalogImageUrl} from "@/lib/catalog-image";
import {getPreparedPhoto} from "@/lib/server/preparedPhotos";
import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import cardStyles from "@/components/catalog/CatalogCard.module.css";
import styles from "./CatalogSection.module.css";

const categoryParameters: Readonly<Partial<Record<string, string>>> = {
  armatura: "Класс · диаметр · длина",
  "truby-profilnye": "Сечение · стенка · длина",
  "truba-kruglaya": "Диаметр · стенка · длина",
  balka: "Серия · профиль · длина",
  shveller: "Профиль · полки · стенка",
  ugolok: "Полки · толщина · длина",
  kvadrat: "Сечение · марка стали · длина",
  "listovoy-prokat": "Толщина · формат · исполнение",
  polosa: "Ширина · толщина · длина",
  profnastil: "Профиль · толщина · покрытие",
  "setka-metallicheskaya": "Ячейка · проволока · формат",
  shtaketnik: "Профиль · длина · покрытие",
};

export function CatalogSection() {
  const categories = getAllCategories();

  return (
    <section id="home-catalog" aria-labelledby="home-catalog-heading" className="scroll-mt-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 sm:mb-4">
        <h2 id="home-catalog-heading" className="text-section-title">Каталог</h2>
        <Link href="/catalog" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-brand-300">
          Все разделы <Icon name="arrow-right"/>
        </Link>
      </div>
      <ul className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map(category => {
          const parameters = categoryParameters[category.slug];
          const src = category.imageUrl;
          const hasImage = src && !src.endsWith(".svg");
          return <li key={category.id} className="min-w-0">
            <Link href={`/catalog/${category.slug}`} className={`${cardStyles.card} ${styles.tile} ${hasImage ? styles.withImage : ""} group h-full rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900`}>
              {hasImage && <div className={`${styles.picture} rounded-t-lg bg-slate-100 sm:rounded-md dark:bg-slate-800`}>
                <PreparedPhoto photo={getPreparedPhoto(src)} src={catalogImageUrl(src)} alt="" fill
                  sizes="auto, (min-width: 640px) 112px, calc((100vw - 46px) / 2)" className="object-cover object-center"/>
              </div>}
              <div className="min-w-0 p-2.5 sm:p-0">
                <h3 className="text-sm font-semibold leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-300 sm:text-card-title sm:leading-snug">{category.name}</h3>
                {parameters && <p className="mt-1.5 hidden text-xs text-slate-600 sm:block dark:text-slate-300">{parameters}</p>}
              </div>
            </Link>
          </li>;
        })}
      </ul>
    </section>
  );
}
