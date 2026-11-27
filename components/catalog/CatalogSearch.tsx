"use client";

import {type FormEvent, useDeferredValue, useMemo, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {createCatalogSearchIndex, type SearchCategory} from "@/lib/search";
import Link from "next/link";
import {catalogProductPath} from "@/lib/catalogLinks";
import {getProductNameWithSheetExecution} from "@/lib/sheetPresentation";
import {ProductTypeGrid} from "./ProductTypeGrid";
import type {ProductType, ProductVariant} from "@/types/product";
import cardStyles from "./CatalogCard.module.css";
import focusStyles from "./CatalogFocus.module.css";

const queryLimit = 250;

export function CatalogSearch({
  productTypes,
  variants,
  categories,
}: {
  productTypes: ProductType[];
  variants: ProductVariant[];
  categories: SearchCategory[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim().slice(0, queryLimit) ?? "";
  const [draft, setDraft] = useState({urlQuery, value: urlQuery});
  const query = draft.urlQuery === urlQuery ? draft.value : urlQuery;
  const cleanQuery = query.trim();
  const deferredQuery = useDeferredValue(cleanQuery);
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
  function rememberQuery(value: string) {
    const url = new URL(window.location.href);
    if (url.searchParams.get("q") === (value || null)) return;
    if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("query") ?? "").trim();
    setDraft({urlQuery, value: nextQuery});
    rememberQuery(nextQuery);
  }

  function clear() {
    setDraft({urlQuery, value: ""});
    rememberQuery("");
    formRef.current?.querySelector<HTMLInputElement>('input[name="query"]')?.focus({preventScroll: true});
  }

  return (
    <section aria-labelledby="catalog-search-heading">
      <div className={`${cardStyles.contentInset} ${cardStyles.body} rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
        <h2 id="catalog-search-heading" className="text-xl font-bold">Поиск по каталогу</h2>
        <form ref={formRef} onSubmit={submit} role="search" className="mt-4 grid grid-cols-2 gap-3 sm:flex">
          <label className="col-span-2 min-w-0 sm:flex-1">
            <span className="sr-only">Поисковый запрос</span>
            <Input
              name="query"
              type="search"
              value={query}
              onChange={e => {setDraft({urlQuery, value: e.target.value});setLimit(20);}}
              maxLength={queryLimit}
              placeholder="Арматура 12 мм"
            />
          </label>
          <Button type="submit" className={`sm:min-w-32 ${query ? "" : "col-span-2"}`}>Найти</Button>
          {query && (
            <Button
              type="button"
              variant="secondary"
              onClick={clear}
              className="sm:min-w-32"
            >
              Очистить
            </Button>
          )}
        </form>
      </div>

      {cleanQuery && (
        <div className="mt-8" aria-busy={cleanQuery !== deferredQuery} onClickCapture={event => {
          // Save the live query on the current history entry before opening a result.
          if (event.target instanceof Element && event.target.closest("a[href]")) rememberQuery(cleanQuery);
        }}>
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold">Результаты поиска</h2>
            <p role="status" aria-atomic="true" className="text-sm text-slate-600 dark:text-slate-300">
              Найдено товаров: {search.total}
            </p>
          </div>
          {results.length ? (
            <>
              {search.correctedQuery && <p className="mb-4 text-sm">Возможно, вы имели в виду: <button type="button" className="inline-flex min-h-11 cursor-pointer items-center rounded-sm font-semibold text-brand-700 dark:text-brand-400 underline" onClick={() => setDraft({urlQuery, value: search.correctedQuery!})}>{search.correctedQuery}</button></p>}
              <ul className="mb-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">{matchingVariants.slice(0, limit).map(product => {
                const type = productTypes.find(t => t.id === product.productTypeId);
                return type && <li key={product.id}><Link className={`${focusStyles.inset} flex min-h-11 items-center p-4 font-semibold text-brand-700 hover:bg-slate-50 hover:underline dark:text-brand-400 dark:hover:bg-slate-800`} href={catalogProductPath(type.categorySlug, type.subcategorySlug, type.slug, product.id)}>{getProductNameWithSheetExecution(product)}</Link></li>;
              })}</ul>
              {limit < matchingVariants.length && <Button type="button" variant="secondary" className="mb-6" onClick={() => setLimit(n => n + 20)}>Показать ещё</Button>}
              <ProductTypeGrid productTypes={results} variants={matchingVariants}/>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-10 text-center">
              <h3 className="text-lg font-bold">Товары не найдены</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Проверьте запрос или попробуйте указать меньше параметров.
              </p>
              <Button type="button" variant="secondary" onClick={clear} className="mt-4">Очистить поиск</Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
