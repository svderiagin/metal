import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CheckoutPageContent} from "@/components/checkout/CheckoutPageContent";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Оформление заказа без регистрации с оплатой картой или по счёту."
};
export default function CheckoutPage() {
  return <PageContainer className="py-8"><Breadcrumbs
    items={[{label: "Корзина", href: "/cart"}, {label: "Оформление"}]}/><h1
    className="mb-7 text-3xl font-black">Оформление заказа</h1><CheckoutPageContent/></PageContainer>
}
