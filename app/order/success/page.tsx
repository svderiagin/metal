import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {OrderSuccessContent} from "@/components/checkout/OrderSuccessContent";

export const metadata: Metadata = {
  title: "Заказ создан",
  description: "Подтверждение заказа и скачивание счёта на оплату.",
  robots: {index: false, follow: false}
};
export default function SuccessPage() {
  return <PageContainer className="py-8 sm:py-12"><OrderSuccessContent/></PageContainer>
}
