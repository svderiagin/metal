import {getAllCategories} from "@/lib/catalog";
import Link from "next/link";
import Image from "next/image";
import {ButtonLink} from "@/components/ui/Button";
import {catalogImageUrl} from "@/lib/catalog-image";
import {catalogCoverGalleries} from "@/data/catalog-cover-galleries";
import cardStyles from "@/components/catalog/CatalogCard.module.css";

const primaryGroups = [
  {slug: "armatura", parameters: "Класс · диаметр · длина"},
  {slug: "truby-profilnye", parameters: "Сечение · стенка · длина"},
  {slug: "listovoy-prokat", parameters: "Толщина · формат · исполнение"},
  {slug: "balka", parameters: "Серия · профиль · длина"},
  {slug: "shveller", parameters: "Профиль · полки · стенка"},
  {slug: "ugolok", parameters: "Полки · толщина · длина"},
  {slug: "profnastil", parameters: "Профиль · толщина · покрытие"},
  {slug: "truba-kruglaya", parameters: "Диаметр · стенка · длина"},
  {slug: "polosa", parameters: "Ширина · толщина · длина"},
] as const;

export function CatalogSection() {
  const categories = getAllCategories();
  const featured = primaryGroups.flatMap(group => {
    const category = categories.find(category => category.slug === group.slug);
    return category ? [{category, parameters: group.parameters}] : [];
  });
  const featuredIds = new Set(featured.map(({category}) => category.id));
  const otherCategories = categories.filter(category => !featuredIds.has(category.id));

  return (
    <section id="home-catalog" aria-labelledby="home-catalog-heading" className="scroll-mt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-eyebrow uppercase text-slate-500 dark:text-slate-400">Продукция</p>
          <h2 id="home-catalog-heading" className="text-section-title">Каталог металлопроката</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Выберите группу, затем сравните размеры, характеристики и цены.</p>
        </div>
        <ButtonLink href="/catalog" variant="secondary" className="gap-2">Все разделы <span className="tabular-nums text-slate-500 dark:text-slate-400">{categories.length}</span><span aria-hidden="true">→</span></ButtonLink>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map(({category, parameters}) => {
          const src = catalogCoverGalleries[category.id]?.cover ?? category.imageUrl;
          const hasImage = src && !src.endsWith(".svg");
          return <li key={category.id} className="min-w-0">
            <Link href={`/catalog/${category.slug}`} className={`${cardStyles.card} flex h-full min-h-28 items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5`}>
              <div className="min-w-0">
                <h3 className="text-card-title">{category.name}</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{parameters}</p>
              </div>
              {hasImage && <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-sm bg-white"><Image src={catalogImageUrl(src)} alt="" fill sizes="80px" className="object-cover object-center"/></div>}
            </Link>
          </li>;
        })}
      </ul>
      {otherCategories.length > 0 && <details className="mt-4 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:px-5">Другие разделы каталога <span className="ml-1 font-normal tabular-nums text-slate-500 dark:text-slate-400">{otherCategories.length}</span></summary>
        <ul className="grid gap-x-6 border-t border-slate-200 px-4 py-2 dark:border-slate-700 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
          {otherCategories.map(category => <li key={category.id}><Link href={`/catalog/${category.slug}`} className="flex min-h-11 items-center justify-between gap-3 rounded-sm py-2 text-sm text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300">{category.name}<span aria-hidden="true">→</span></Link></li>)}
        </ul>
      </details>}
    </section>
  );
}
