"use client";

import {type FormEvent, useMemo} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {ProductGrid} from "./ProductGrid";
import type {Product} from "@/types/product";

export function CatalogSearch({products}: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const results = useMemo(() => {
    if (!query) return [];

    const normalizedQuery = query.toLocaleLowerCase("ru");
    return products.filter((product) => {
      const searchable = [
        product.name,
        product.sku,
        product.shortDescription,
        ...product.attributes.map((attribute) => attribute.value),
      ].join(" ").toLocaleLowerCase("ru");

      return searchable.includes(normalizedQuery);
    });
  }, [products, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("query") ?? "").trim();

    router.replace(nextQuery ? `/catalog?q=${encodeURIComponent(nextQuery)}` : "/catalog", {
      scroll: false,
    });
  }

  function clear() {
    router.replace("/catalog", {scroll: false});
  }

  return (
    <section aria-labelledby="catalog-search-heading">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="catalog-search-heading" className="text-xl font-bold">
          Поиск по каталогу
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Найдите товар по названию, артикулу, размеру, материалу или стандарту.
        </p>
        <form onSubmit={submit} role="search" className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Поисковый запрос</span>
            <Input
              key={query}
              name="query"
              type="search"
              defaultValue={query}
              placeholder="Например, арматура А500С или MS-0001"
            />
          </label>
          <Button type="submit" className="sm:min-w-32">
            Найти
          </Button>
          {query && (
            <Button
              type="button"
              onClick={clear}
              className="border border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-100 sm:min-w-32"
            >
              Очистить
            </Button>
          )}
        </form>
      </div>

      {query && (
        <div className="mt-8" aria-live="polite">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-black">Результаты поиска</h2>
            <p className="text-sm text-slate-600">
              По запросу «{query}» найдено: {results.length}
            </p>
          </div>
          {results.length ? (
            <ProductGrid products={results}/>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <strong className="text-lg">Товары не найдены</strong>
              <p className="mt-2 text-sm text-slate-600">
                Проверьте запрос или попробуйте указать меньше параметров.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
