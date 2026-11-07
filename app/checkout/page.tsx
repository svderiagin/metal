import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CheckoutPageContent} from "@/components/checkout/CheckoutPageContent";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Оформление заказа без регистрации с согласованием оплаты по счёту."
};
export default function CheckoutPage() {
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs
    items={[{label: "Корзина", href: "/cart"}, {label: "Оформление"}]}/><h1
    className="mb-7 text-page-title">Оформление заказа</h1><CheckoutPageContent/></PageContainer>
}
