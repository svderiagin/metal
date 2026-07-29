import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {ContactForm} from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Фиктивные контакты отдела продаж и склада Metal Store."
};
export default function ContactsPage() {
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs items={[{label: "Контакты"}]}/><h1
    className="text-3xl font-black">Контакты</h1>
    <div className="mt-7 grid gap-7 lg:grid-cols-2">
      <div className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-bold">Отдел
          продаж</h2><p className="mt-3"><a href="tel:+78000000000" className="font-semibold text-red-700">+7
          (800) 000-00-00</a></p><p><a href="tel:+74950000000">+7 (495) 000-00-00</a></p><p className="mt-2">
          <a href="mailto:sales@metal-store.ru">sales@metal-store.ru</a></p><p
          className="mt-2 text-sm text-slate-600">Пн–Пт: 08:00–18:00</p></section>
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h2
          className="font-bold">Адреса</h2>
          <address className="mt-3 space-y-3 not-italic text-slate-600"><p><strong
            className="text-slate-900">Офис:</strong><br/>г. Москва, Техническая улица, 18, офис 204</p><p>
            <strong className="text-slate-900">Склад:</strong><br/>Московская область, г. Северный,
            Промышленный проезд, 12</p></address>
        </section>
      </div>
      <ContactForm/></div>
  </PageContainer>
}
