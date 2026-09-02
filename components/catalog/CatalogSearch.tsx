"use client";

import {type FormEvent, useMemo} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {ProductTypeGrid} from "./ProductTypeGrid";
import type {ProductType, ProductVariant} from "@/types/product";

export function CatalogSearch({
  productTypes,
  variants,
}: {
  productTypes: ProductType[];
  variants: ProductVariant[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const results = useMemo(() => {
    if (!query) return [];
    return findMatchingProductTypes(query, productTypes, variants);
  }, [productTypes, query, variants]);

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
        <h2 id="catalog-search-heading" className="text-xl font-bold">Поиск по каталогу</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Найдите тип продукции по названию, артикулу варианта, размеру, материалу или стандарту.
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
          <Button type="submit" className="sm:min-w-32">Найти</Button>
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
            <ProductTypeGrid productTypes={results} variants={variants}/>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <strong className="text-lg">Типы продукции не найдены</strong>
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

function searchableVariant(variant: ProductVariant) {
  return [
    variant.name,
    variant.sku,
    variant.shortDescription,
    ...variant.attributes.map((attribute) => attribute.value),
  ].join(" ").toLocaleLowerCase("ru");
}

function findMatchingProductTypes(
  query: string,
  productTypes: ProductType[],
  variants: ProductVariant[],
): ProductType[] {
  const normalizedQuery = query.toLocaleLowerCase("ru");
  const matchingProductTypeIds = new Set<string>();

  for (const variant of variants) {
    if (searchableVariant(variant).includes(normalizedQuery)) {
      matchingProductTypeIds.add(variant.productTypeId);
    }
  }

  const matchingProductTypes: ProductType[] = [];
  for (const productType of productTypes) {
    const searchableText = `${productType.name} ${productType.shortDescription}`
      .toLocaleLowerCase("ru");
    const typeMatches = searchableText.includes(normalizedQuery);
    const variantMatches = matchingProductTypeIds.has(productType.id);
    if (typeMatches || variantMatches) matchingProductTypes.push(productType);
  }

  return matchingProductTypes;
}
