"use client";

import {type FormEvent, useDeferredValue, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {createCatalogSearchIndex} from "@/lib/search";
import Link from "next/link";
import {catalogProductPath} from "@/lib/catalogLinks";
import {ProductTypeGrid} from "./ProductTypeGrid";
import type {ProductType, ProductVariant} from "@/types/product";
import type {Category} from "@/types/category";

export function CatalogSearch({
  productTypes,
  variants,
  categories,
}: {
  productTypes: ProductType[];
  variants: ProductVariant[];
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const [draft, setDraft] = useState({urlQuery, value: urlQuery});
  const query = draft.urlQuery === urlQuery ? draft.value : urlQuery;
  const deferredQuery = useDeferredValue(query);
  // Keep the index for subsequent queries, but do not normalize the whole catalog
  // until a visitor actually searches. Empty-state results are never displayed.
  const index = useMemo(() => {
    let cached: ReturnType<typeof createCatalogSearchIndex> | undefined;
    return {search(value: string) {
      if (!value.trim()) return {hits: [], total: 0};
      cached ??= createCatalogSearchIndex(variants, productTypes, categories);
      return cached.search(value);
    }};
  }, [variants, productTypes, categories]);
  const search = useMemo(() => index.search(deferredQuery), [index, deferredQuery]);
  const matchingVariants = useMemo(() => search.hits.map(h => h.product), [search]);
  const [limit, setLimit] = useState(20);

  const results = useMemo(() => {
    const byId = new Map(productTypes.map(t => [t.id, t]));
    return [...new Set(matchingVariants.map(v => v.productTypeId))].map(id => byId.get(id)).filter((t): t is ProductType => Boolean(t));
  }, [productTypes, matchingVariants]);
  function navigate(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value); else params.delete("q");
    router.replace("/catalog" + (params.size ? "?" + params.toString() : ""), {scroll: false});
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("query") ?? "").trim();

    navigate(nextQuery);
  }

  function clear() {
    setDraft({urlQuery, value: ""});
    navigate("");
  }

  return (
    <section aria-labelledby="catalog-search-heading">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">
        <h2 id="catalog-search-heading" className="text-xl font-bold">Поиск по каталогу</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Найдите тип продукции по названию, артикулу варианта, размеру, материалу или стандарту.
        </p>
        <form onSubmit={submit} role="search" className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Поисковый запрос</span>
            <Input
              name="query"
              type="search"
              value={query}
              onChange={e => {setDraft({urlQuery, value: e.target.value});setLimit(20);}}
              maxLength={250}
              placeholder="Например, арматура рифлёная А500С"
            />
          </label>
          <Button type="submit" className="sm:min-w-32">Найти</Button>
          {query && (
            <Button
              type="button"
              onClick={clear}
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800 sm:min-w-32"
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
            <p className="text-sm text-slate-600 dark:text-slate-300">
              По запросу «{query}» найдено товаров: {search.total}
            </p>
          </div>
          {results.length ? (
            <>
              {search.correctedQuery && <p className="mb-4 text-sm">Возможно, вы имели в виду: <button type="button" className="font-semibold text-red-700 dark:text-red-400 underline" onClick={() => setDraft({urlQuery, value: search.correctedQuery!})}>{search.correctedQuery}</button></p>}
              <ul className="mb-6 divide-y divide-slate-200 dark:divide-slate-700 rounded-xl bg-white dark:bg-slate-900">{matchingVariants.slice(0, limit).map(product => {
                const type = productTypes.find(t => t.id === product.productTypeId);
                return type && <li key={product.id} className="p-4"><Link className="font-semibold text-red-700 dark:text-red-400 hover:underline" href={catalogProductPath(type.categorySlug, type.subcategorySlug, type.slug, product.id)}>{product.name}</Link><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{product.sku}</p></li>;
              })}</ul>
              {limit < matchingVariants.length && <Button type="button" className="mb-6" onClick={() => setLimit(n => n + 20)}>Показать ещё</Button>}
              <ProductTypeGrid productTypes={results} variants={matchingVariants}/>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-10 text-center">
              <strong className="text-lg">Типы продукции не найдены</strong>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Проверьте запрос или попробуйте указать меньше параметров.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
