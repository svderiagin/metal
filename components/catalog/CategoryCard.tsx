import Link from "next/link";
import {getProductCountByCategoryId} from "@/lib/catalog";
import type {Category} from "@/types/category";

export function CategoryCard({category}: { category: Category }) {
  return (
    <article className="h-full">
      <Link
        href={`/catalog/${category.slug}`}
        className="group flex h-full min-h-52 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:p-6"
      >
        <div
          className="mb-5 flex size-12 items-center justify-center rounded-lg bg-slate-900 text-xl font-black text-white"
          aria-hidden
        >
          {category.name.slice(0, 2).toUpperCase()}
        </div>
        <h3 className="text-lg font-bold text-slate-950 transition-colors group-hover:text-red-700">
          {category.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
          {category.shortDescription}
        </p>
        <span className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-red-700 transition-colors after:ml-1 after:content-['→'] group-hover:text-red-800">
          {getProductCountByCategoryId(category.id)} товар(ов)
        </span>
      </Link>
    </article>
  );
}
