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
    className="text-3xl font-black">Контакты</h1>
    <section id="details" className="mt-7 scroll-mt-6">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Официальная информация</p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">Реквизиты компании</h2>
        <p className="mt-3 leading-7 text-slate-600">Юридические и банковские данные организации.</p></div>
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
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-10">
        <div>
          <h2 className="text-2xl font-black">Связаться с нами</h2>
          <p className="mt-3 leading-7 text-slate-600">Заполните форму, чтобы обсудить заказ, поставку или получить консультацию.</p>
        </div>
        <ContactForm/>
      </div>
    </section>
  </PageContainer>
}

function Address() {
  return <>{companyDetails.legalAddressLines.map(line => <span key={line} className="block">{line}</span>)}</>;
}

function DetailsCard({title, rows}: {title: string; rows: readonly (readonly [string, React.ReactNode])[]}) {
  return <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
    <h3 className="text-lg font-bold">{title}</h3>
    <dl className="mt-4 space-y-4">
      {rows.map(([label, value]) => <div key={label} className="min-w-0">
        <dt className="text-sm font-semibold text-slate-500">{label}</dt>
        <dd className="mt-1 break-words leading-6 text-slate-900 [overflow-wrap:anywhere]">{value}</dd>
      </div>)}
    </dl>
  </article>
}
