import Link from "next/link";
import {getAllCategories, getProductCountByCategoryId, getSubcategoriesByCategoryId} from "@/lib/catalog";

export function CatalogSidebar({activeSlug}: { activeSlug?: string }) {
  return (
    <aside className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h2
        className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-sm font-bold uppercase tracking-wide text-white">Разделы
        каталога</h2>
      <nav aria-label="Категории">
        <ul>
          {getAllCategories().map((category) => {
            const active = activeSlug === category.slug;
            return (
              <li key={category.id} className="border-b border-slate-100 last:border-0">
                <Link href={`/catalog/${category.slug}`}
                      className={`block min-h-12 px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-slate-50 hover:text-red-700 ${active ? "border-l-4 border-red-700 bg-red-50 pl-4 text-red-800" : ""}`}>
                  {category.name}<span
                  className="ml-2 text-xs text-slate-400">{getProductCountByCategoryId(category.id)}</span>
                </Link>
                {active &&
                  <ul
                    className="border-t border-slate-100 bg-slate-50 py-1">{getSubcategoriesByCategoryId(category.id).map((subcategory) =>
                    <li key={subcategory.id}><Link
                      href={`/catalog/${category.slug}?subcategory=${subcategory.slug}`}
                      className="block px-5 py-2 text-xs leading-4 text-slate-600 hover:text-red-700">{subcategory.name}</Link>
                    </li>)}</ul>}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
