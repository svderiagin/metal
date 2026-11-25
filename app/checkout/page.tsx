import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CheckoutPageContent} from "@/components/checkout/CheckoutPageContent";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Оформление заказа без регистрации с согласованием оплаты по счёту."
};
export default function CheckoutPage() {
  return <PageContainer withBreadcrumbs className="pb-8 sm:pb-10 lg:pb-12">
    <Breadcrumbs items={[{label: "Корзина", href: "/cart"}, {label: "Оформление"}]}/>
    <div className="mx-auto max-w-[68rem]">
      <h1 className="mb-6 text-page-title">Оформление заказа</h1>
      <CheckoutPageContent/>
    </div>
  </PageContainer>;
}
