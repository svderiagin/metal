"use client";

import {useMemo, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {ProductGrid} from "@/components/catalog/ProductGrid";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import type {Product} from "@/types/product";
import type {Subcategory} from "@/types/category";

type SortMode = "popular" | "price-asc" | "price-desc" | "name";

export function CatalogResults({products, subcategories}: { products: Product[]; subcategories: Subcategory[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSubcategory = searchParams.get("subcategory") ?? "";
  const subcategorySlug = subcategories.some((item) => item.slug === requestedSubcategory)
    ? requestedSubcategory
    : "";
  const [material, setMaterial] = useState("");
  const [standard, setStandard] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("popular");
  const [limit, setLimit] = useState(12);

  const materials = useMemo(() => uniqueAttributeValues(products, "material"), [products]);
  const standards = useMemo(() => uniqueAttributeValues(products, "standard"), [products]);
  const subcategoryBySlug = useMemo(() => new Map(subcategories.map((item) => [item.slug, item.id])), [subcategories]);
  const result = useMemo(() => {
    const subcategoryId = subcategoryBySlug.get(subcategorySlug);
    const filtered = products.filter((product) => {
      return (!subcategoryId || product.subcategoryId === subcategoryId)
        && (!material || hasAttribute(product, "material", material))
        && (!standard || hasAttribute(product, "standard", standard))
        && (!stockOnly || product.inStock);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name, "ru");
      return Number(b.inStock) - Number(a.inStock);
    });
  }, [material, products, sort, standard, stockOnly, subcategoryBySlug, subcategorySlug]);

  const reset = () => {
    setMaterial("");
    setStandard("");
    setStockOnly(false);
    setSort("popular");
    setLimit(12);
    router.replace(pathname, {scroll: false});
  };

  return (
    <section className="mt-8" aria-labelledby="products-heading">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">Материал<Select value={material}
                                                                   onChange={(event) => setMaterial(event.target.value)}
                                                                   className="mt-1">
            <option value="">Все материалы</option>
            {materials.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>
          <label className="text-sm font-semibold">Стандарт<Select value={standard}
                                                                   onChange={(event) => setStandard(event.target.value)}
                                                                   className="mt-1">
            <option value="">Все стандарты</option>
            {standards.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <label className="min-w-52 text-sm font-semibold">Сортировка<Select value={sort}
                                                                              onChange={(event) => setSort(event.target.value as SortMode)}
                                                                              className="mt-1">
            <option value="popular">Сначала в наличии</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
            <option value="name">По названию</option>
          </Select></label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox"
                                                                                           checked={stockOnly}
                                                                                           onChange={(event) => setStockOnly(event.target.checked)}
                                                                                           className="size-4 accent-red-700"/>Только
            в наличии</label>
          <button type="button" onClick={reset}
                  className="min-h-11 text-sm font-semibold text-red-700 underline">Сбросить фильтры
          </button>
        </div>
      </div>
      <div className="my-5 flex items-center justify-between gap-3"><h2 id="products-heading"
                                                                        className="text-xl font-black">Товары</h2>
        <p className="text-sm text-slate-600">Найдено: {result.length}</p></div>
      {result.length ? <><ProductGrid products={result.slice(0, limit)}/>{limit < result.length &&
          <div className="mt-6 text-center"><Button type="button" onClick={() => setLimit((value) => value + 12)}>Показать
            ещё</Button></div>}</> :
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center"><strong
          className="text-lg">По выбранным условиям ничего не найдено</strong><p
          className="mt-2 text-sm text-slate-600">Измените фильтры или сбросьте параметры.</p></div>}
    </section>
  );
}

function uniqueAttributeValues(products: Product[], key: Product["attributes"][number]["key"]) {
  return [...new Set(products.flatMap((product) => product.attributes.filter((item) => item.key === key).map((item) => item.value)))].sort((a, b) => a.localeCompare(b, "ru"));
}

function hasAttribute(product: Product, key: Product["attributes"][number]["key"], value: string) {
  return product.attributes.some((item) => item.key === key && item.value === value);
}
