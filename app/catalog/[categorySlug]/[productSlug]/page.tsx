import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {ProductGallery} from "@/components/catalog/ProductGallery";
import {ProductSpecifications} from "@/components/catalog/ProductSpecifications";
import {ProductGrid} from "@/components/catalog/ProductGrid";
import {AddToCartButton} from "@/components/cart/AddToCartButton";
import {ButtonLink} from "@/components/ui/Button";
import {SectionHeading} from "@/components/ui/SectionHeading";
import {formatCurrency} from "@/lib/currency";
import {getAllProducts, getCategoryById, getCategoryBySlug, getProductBySlug, getRelatedProducts} from "@/lib/catalog";

type Props = { params: Promise<{ categorySlug: string; productSlug: string }> };

export function generateStaticParams() {
  return getAllProducts().flatMap(product => {
    const category = getCategoryById(product.categoryId);
    return category ? [{categorySlug: category.slug, productSlug: product.slug}] : []
  })
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {categorySlug, productSlug} = await params;
  const c = getCategoryBySlug(categorySlug);
  const p = getProductBySlug(productSlug);
  if (!c || !p || p.categoryId !== c.id) return {title: "Товар не найден"};
  return {title: p.name, description: p.shortDescription}
}

export default async function ProductPage({params}: Props) {
  const {categorySlug, productSlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  const product = getProductBySlug(productSlug);
  if (!category || !product || product.categoryId !== category.id) notFound();
  const related = getRelatedProducts(product.id, category.id);
  return <PageContainer className="py-8"><Breadcrumbs items={[{label: "Каталог", href: "/catalog"}, {
    label: category.name,
    href: `/catalog/${category.slug}`
  }, {label: product.name}]}/>
    <div className="grid gap-8 lg:grid-cols-2"><ProductGallery product={product}/>
      <div><p className="text-sm font-semibold text-slate-500">Артикул: {product.sku}</p><h1
        className="mt-2 text-3xl font-black">{product.name}</h1><p
        className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ${product.inStock ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>{product.inStock ? "В наличии" : "Поставка под заказ"}</p>
        <p className="mt-5 leading-7 text-slate-600">{product.shortDescription}</p>
        <div className="mt-6 border-y border-slate-200 py-5"><strong
          className="text-3xl">{formatCurrency(product.price)}</strong><span
          className="ml-2 text-slate-500">{product.priceUnit}</span></div>
        <div className="mt-6"><AddToCartButton productId={product.id} disabled={!product.inStock}/></div>
        <ButtonLink href="/#request" variant="secondary" className="mt-3">Запросить расчёт</ButtonLink></div>
    </div>
    <div className="mt-12 grid gap-8 lg:grid-cols-2">
      <section><SectionHeading title="Характеристики"/><ProductSpecifications
        specifications={product.specifications}/></section>
      <section><SectionHeading title="Описание"/><p className="leading-7 text-slate-700">{product.description}</p>
        <p className="mt-4 rounded-md bg-slate-200 p-4 text-sm text-slate-600">Внешний вид и параметры партии
          уточняются при подтверждении. Изображение является визуальным макетом.</p></section>
    </div>
    {related.length > 0 &&
      <section className="mt-12"><SectionHeading title="Похожие товары"/><ProductGrid products={related}/>
      </section>}</PageContainer>
}
