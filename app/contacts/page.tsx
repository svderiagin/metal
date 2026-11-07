import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {ContactForm} from "@/components/forms/ContactForm";
import {companyDetails} from "@/lib/companyDetails";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Контактная форма и официальные реквизиты ${companyDetails.shortName}.`
};
export default function ContactsPage() {
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs items={[{label: "Контакты"}]}/><h1
    className="text-page-title">Контакты</h1>
    <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Отдел продаж">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">Отдел продаж</h2>
        <a href={`mailto:${companyDetails.salesEmail}`} className="mt-3 inline-flex min-h-11 items-center break-all font-semibold text-slate-700 underline underline-offset-4 dark:text-slate-200">{companyDetails.salesEmail}</a>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{companyDetails.phonePlaceholder}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">Доставка и самовывоз</h2>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">Укажите в письме адрес объекта, состав заказа и желаемую дату. Адрес и время самовывоза согласуйте перед поездкой.</p>
      </div>
    </section>
    <section className="mt-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 md:p-8">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-10">
        <div>
          <h2 className="text-section-title">Связаться с нами</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">Заполните форму, чтобы обсудить заказ, поставку или получить консультацию.</p>
        </div>
        <ContactForm/>
      </div>
    </section>
    <section id="details" className="mt-7 scroll-mt-6">
      <div className="max-w-3xl"><p className="text-eyebrow uppercase text-brand-700 dark:text-brand-400">Официальная информация</p>
        <h2 className="text-section-title mt-2">Реквизиты компании</h2>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">Юридические и банковские данные организации.</p></div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <DetailsCard title="Компания" rows={[
          ["Полное наименование", companyDetails.legalName],
          ["ОГРН", companyDetails.ogrn],
          ["ИНН", companyDetails.inn],
          ["КПП", companyDetails.kpp],
        ]}/>
        <DetailsCard title="Банковские реквизиты" rows={[
          ["Расчётный счёт", companyDetails.bank.account],
          ["Банк", companyDetails.bank.name],
          ["Корреспондентский счёт", companyDetails.bank.correspondentAccount],
          ["БИК", companyDetails.bank.bik],
        ]}/>
        <DetailsCard title="Юридический адрес" rows={[["Адрес", <Address key="legal-address"/>]]}/>
        <DetailsCard title="Руководитель" rows={[["Генеральный директор", companyDetails.generalDirector]]}/>
      </div>
    </section>
  </PageContainer>
}

function Address() {
  return <>{companyDetails.legalAddressLines.map(line => <span key={line} className="block">{line}</span>)}</>;
}

function DetailsCard({title, rows}: {title: string; rows: readonly (readonly [string, React.ReactNode])[]}) {
  return <article className="min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6">
    <h3 className="text-lg font-bold">{title}</h3>
    <dl className="mt-4 space-y-4">
      {rows.map(([label, value]) => <div key={label} className="min-w-0">
        <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="mt-1 break-words leading-6 text-slate-900 dark:text-slate-100 [overflow-wrap:anywhere]">{value}</dd>
      </div>)}
    </dl>
  </article>
}
