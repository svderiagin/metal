import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { SubcategoryNavigation } from "@/components/catalog/SubcategoryNavigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ButtonLink } from "@/components/ui/Button";
import { getAllCategories, getCategoryBySlug, getProductsByCategoryId, getSubcategoriesByCategoryId } from "@/lib/catalog";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) return { title: "Категория не найдена" };
  return { title: category.name, description: category.shortDescription };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();
  const products = getProductsByCategoryId(category.id);
  const subcategories = getSubcategoriesByCategoryId(category.id);

  return (
    <PageContainer className="py-8">
      <Breadcrumbs items={[{ label: "Каталог", href: "/catalog" }, { label: category.name }]} />
      <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
        <CatalogSidebar activeSlug={category.slug} />
        <div>
          <h1 className="text-3xl font-black">{category.name}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">{category.description}</p>
          <SubcategoryNavigation categorySlug={category.slug} subcategories={subcategories} />
          <Suspense fallback={<div className="mt-8 h-80 animate-pulse rounded-lg bg-slate-200" />}><CatalogResults products={products} subcategories={subcategories} /></Suspense>
          <div className="mt-10 rounded-lg bg-slate-900 p-6 text-white">
            <h2 className="text-xl font-bold">Нужна комплектация по спецификации?</h2>
            <p className="mt-2 text-slate-300">Опишите позиции и необходимые услуги — подготовим единый расчёт.</p>
            <ButtonLink href="/#request" className="mt-5">Запросить расчёт</ButtonLink>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
