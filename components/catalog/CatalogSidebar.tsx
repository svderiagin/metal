import Link from "next/link";
import {getAllCategories, getProductCountByCategoryId, getSubcategoriesByCategoryId} from "@/lib/catalog";
import {CatalogCategoryLink} from "./CatalogCategoryLink";

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
                <CatalogCategoryLink
                  href={`/catalog/${category.slug}`}
                  label={category.name}
                  productCount={getProductCountByCategoryId(category.id)}
                  active={active}
                />
                {active &&
                  <ul
                    className="border-t border-slate-100 bg-slate-50 py-1">{getSubcategoriesByCategoryId(category.id).map((subcategory) =>
                    <li key={subcategory.id}><Link
                      href={`/catalog/${category.slug}?subcategory=${subcategory.slug}`}
                      scroll={false}
                      className="block px-5 py-2 text-sm leading-5 text-slate-600 hover:text-red-700">{subcategory.name}</Link>
                    </li>)}</ul>}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
