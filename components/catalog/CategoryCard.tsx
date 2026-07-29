import Link from "next/link";
import {getProductCountByCategoryId} from "@/lib/catalog";
import type {Category} from "@/types/category";

export function CategoryCard({category}: { category: Category }) {
  return <article
    className="group flex min-h-48 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-300 hover:shadow-md">
    <div
      className="mb-4 flex h-12 w-12 items-center justify-center rounded bg-slate-900 text-xl font-black text-white"
      aria-hidden>{category.name.slice(0, 2).toUpperCase()}</div>
    <h3 className="text-lg font-bold text-slate-950">{category.name}</h3><p
    className="mt-2 flex-1 text-sm leading-6 text-slate-600">{category.shortDescription}</p><Link
    href={`/catalog/${category.slug}`}
    className="mt-4 text-sm font-bold text-red-700 after:content-['_→']">{getProductCountByCategoryId(category.id)} товар(ов)</Link>
  </article>
}
