import Link from "next/link";
import {getAllCategories, getProductTypesByCategoryId} from "@/lib/catalog";
import {catalogProductPath} from "@/lib/catalogLinks";
import type {Category} from "@/types/category";

export function CatalogListingNavigation({category, currentTypeId}: {category: Category; currentTypeId?: string}) {
  const siblings = category.directProducts ? [] : getProductTypesByCategoryId(category.id);
  return <nav aria-label="Навигация по продукции" className="relative flex min-w-0 items-center gap-2">
    <details className="group shrink-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
        Все разделы <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <ul className="absolute left-0 z-20 mt-2 max-h-96 w-72 max-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        {getAllCategories().map(item => <li key={item.id}><Link href={`/catalog/${item.slug}`}
          aria-current={item.id === category.id ? "page" : undefined}
          className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-slate-100 aria-[current=page]:bg-slate-100 aria-[current=page]:font-bold dark:hover:bg-slate-800 dark:aria-[current=page]:bg-slate-800">{item.name}</Link></li>)}
      </ul>
    </details>
    {siblings.length > 0 && <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto" aria-label="Подкатегории">
    {siblings.map(type => <Link key={type.id} href={catalogProductPath(category.slug, type.subcategorySlug, type.slug)}
      aria-current={currentTypeId === type.id ? "page" : undefined}
      className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 aria-[current=page]:bg-slate-200 aria-[current=page]:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:aria-[current=page]:bg-slate-700 dark:aria-[current=page]:text-white">{type.name}</Link>)}
    </div>}
  </nav>;
}
