import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CartPageContent} from "@/components/cart/CartPageContent";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Выбранные товары и расчёт предварительной стоимости заказа."
};
export default function CartPage() {
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs items={[{label: "Корзина"}]}/><h1
    className="mb-7 text-3xl font-black">Корзина</h1><CartPageContent/></PageContainer>
}
