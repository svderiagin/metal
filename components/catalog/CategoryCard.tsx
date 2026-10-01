import Link from "next/link";
import type {Category} from "@/types/category";

export function CategoryCard({category}: { category: Category }) {
  return (
    <article className="h-full">
      <Link
        href={`/catalog/${category.slug}`}
        className="group flex h-full min-h-52 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:p-6"
      >
        <div
          className="mb-5 flex size-12 items-center justify-center rounded-lg bg-slate-900 text-xl font-black text-white"
          aria-hidden
        >
          {category.name.slice(0, 2).toUpperCase()}
        </div>
        <h3 className="text-lg font-bold text-slate-950">
          {category.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
          {category.shortDescription}
        </p>
      </Link>
    </article>
  );
}
