import {
  getAllCategories,
  getProductTypesBySubcategoryId,
  getSubcategoriesByCategoryId,
} from "@/lib/catalog";
import {CatalogCategoryLink} from "./CatalogCategoryLink";
import {CatalogSubcategoryLink} from "./CatalogSubcategoryLink";

export function CatalogSidebar({activeSlug}: { activeSlug?: string }) {
  const navigation = <CatalogSidebarNavigation activeSlug={activeSlug}/>;
  return <>
    <details className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:hidden">
      <summary className="cursor-pointer px-5 py-4 text-sm font-bold focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-red-600">Разделы каталога</summary>
      {navigation}
    </details>
    <aside className="hidden h-fit overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm lg:block">
      <h2
        className="border-b border-slate-200 dark:border-slate-700 bg-slate-900 px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">Разделы
        каталога</h2>
      {navigation}
    </aside>
  </>;
}

function CatalogSidebarNavigation({activeSlug}: {activeSlug?: string}) {
  return <nav aria-label="Категории">
        <ul>
          {getAllCategories().map((category) => {
            const active = activeSlug === category.slug;
            return (
              <li key={category.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <CatalogCategoryLink
                  href={`/catalog/${category.slug}`}
                  label={category.name}
                  active={active}
                />
                {active && !category.directProducts &&
                  <ul className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-1">
                    {getSubcategoriesByCategoryId(category.id).filter(subcategory => !subcategory.internal).flatMap((subcategory) => {
                      const productType = getProductTypesBySubcategoryId(subcategory.id)[0];
                      if (!productType) return [];

                      return [
                        <li key={subcategory.id}>
                          <CatalogSubcategoryLink
                            href={`/catalog/${category.slug}/${subcategory.slug}/${productType.slug}`}
                            label={subcategory.name}
                          />
                        </li>,
                      ];
                    })}
                  </ul>}
              </li>
            );
          })}
        </ul>
      </nav>;
}
