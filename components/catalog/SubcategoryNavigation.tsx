import Link from "next/link";
import type {Subcategory} from "@/types/category";

export function SubcategoryNavigation({categorySlug, subcategories}: {
  categorySlug: string;
  subcategories: Subcategory[]
}) {
  return (
    <section className="mt-7" aria-labelledby="subcategory-heading">
      <h2 id="subcategory-heading" className="text-xl font-black">Подкатегории</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            href={`/catalog/${categorySlug}?subcategory=${subcategory.slug}`}
            className="rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold hover:border-red-400 hover:text-red-700"
          >
            {subcategory.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
