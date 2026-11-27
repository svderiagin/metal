import type {Metadata} from "next";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {ContactForm} from "@/components/forms/ContactForm";
import {PageContainer} from "@/components/layout/PageContainer";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {PhotoGallery} from "@/components/ui/PhotoGallery";
import {companyDetails} from "@/lib/companyDetails";
import salesDesks from "../../public/images/contacts/sales-01.webp";
import salesTeam from "../../public/images/contacts/sales-04.webp";
import salesOffice from "../../public/images/contacts/sales-06.webp";
import salesMeeting from "../../public/images/contacts/sales-09.webp";
import {CopyCompanyDetails} from "./CopyCompanyDetails";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Как связаться с отделом продаж ${companyDetails.brandName}. Форма обращения, почта для спецификаций и реквизиты ${companyDetails.shortName}.`,
};

const companyIdentifiers = [
  {label: "ИНН", value: companyDetails.inn},
  {label: "КПП", value: companyDetails.kpp},
  {label: "ОГРН", value: companyDetails.ogrn},
];
const companyDetailsText = [
  companyDetails.legalName,
  ...companyIdentifiers.map(({label, value}) => `${label} ${value}`),
  `Юридический адрес: ${companyDetails.legalAddress}`,
  `Генеральный директор: ${companyDetails.generalDirector}`,
  `Банк: ${companyDetails.bank.name}`,
  `БИК: ${companyDetails.bank.bik}`,
  `Корреспондентский счёт: ${companyDetails.bank.correspondentAccount}`,
].join("\n");

const mutedText = "text-slate-600 dark:text-slate-300";
const panel = "min-w-0 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
const detailsPanel = `${panel} p-4 sm:p-6 md:row-span-2 md:grid md:grid-rows-subgrid`;
const textLink = "rounded-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-brand-300 dark:hover:text-brand-100";
const mailHref = `mailto:${companyDetails.salesEmail}`;

const salesPhotos = [
  {src: salesDesks, alt: "Коллеги работают за компьютерами", objectPosition: "center 38%"},
  {src: salesTeam, alt: "Сотрудники за рабочим столом в светлом офисе", objectPosition: "center 30%"},
  {src: salesOffice, alt: "Рабочие столы и большие окна в офисе"},
  {src: salesMeeting, alt: "Коллеги обсуждают рабочие вопросы за столом"},
] as const;

export default function ContactsPage() {
  return (
    <PageContainer withBreadcrumbs className="pb-8 sm:pb-10 lg:pb-12">
      <Breadcrumbs items={[{label: "Контакты"}]}/>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page-title">Контакты</h1>
          <p className={`mt-2 max-w-2xl ${mutedText}`}>Свяжитесь с отделом продаж по вопросам заказа, поставки или документов.</p>
        </div>
        <ButtonLink href="#details" variant="secondary">К реквизитам <Icon name="arrow-down"/></ButtonLink>
      </header>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-2 lg:gap-6">
        <section className={`${panel} overflow-hidden lg:grid lg:grid-rows-[auto_minmax(16rem,1fr)]`} aria-labelledby="sales-heading">
          <div className="p-4 sm:p-6 lg:max-xl:p-5">
            <h2 id="sales-heading" className="text-section-title">Отдел продаж</h2>
            <a href={mailHref} className={`mt-1 inline-flex min-h-11 items-center text-lg ${textLink}`}>{companyDetails.salesEmail}</a>
          </div>
          <PhotoGallery
            photos={salesPhotos}
            label="Фотографии офиса"
            sizes="(min-width: 1024px) 828px, (min-width: 640px) calc(100vw - 42px), calc(100vw - 34px)"
            frameClassName="aspect-[3/2] sm:aspect-[16/10] sm:max-lg:max-h-[30rem] lg:h-full lg:aspect-auto"
          />
        </section>

        <section className={`${panel} p-4 sm:p-6 lg:max-xl:p-5`} aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading" className="text-section-title">Напишите нам</h2>
          <div className="mt-4 sm:mt-5"><ContactForm/></div>
        </section>
      </div>

      <section id="details" tabIndex={-1} className="mt-8 scroll-mt-6 sm:mt-10 lg:mt-12" aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-section-title">Реквизиты компании</h2>
        <div className="mt-4 grid gap-4 sm:gap-x-5 md:grid-cols-2 lg:gap-x-6">
          <div className={detailsPanel}>
            <h3 className="text-card-title">{companyDetails.legalName}</h3>
            <div className="mt-4 md:mt-0">
              <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-x-4 gap-y-3">
                {companyIdentifiers.map(({label, value}) => (
                  <div key={label}>
                    <dt className={`text-sm ${mutedText}`}>{label}</dt>
                    <dd className="mt-1 whitespace-nowrap font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <dl className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                <div>
                  <dt className={`text-sm ${mutedText}`}>Юридический адрес</dt>
                  <dd className="mt-1">{companyDetails.legalAddress}</dd>
                </div>
                <div>
                  <dt className={`text-sm ${mutedText}`}>Генеральный директор</dt>
                  <dd className="mt-1">{companyDetails.generalDirector}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className={detailsPanel}>
            <div className="flex flex-wrap items-start gap-x-2 self-start">
              <h3 className="min-w-0 flex-1 text-card-title">Банковские реквизиты</h3>
              <CopyCompanyDetails details={companyDetailsText}/>
            </div>
            <dl className="mt-4 space-y-3 md:mt-0">
              <div>
                <dt className={`text-sm ${mutedText}`}>Банк</dt>
                <dd className="mt-1">{companyDetails.bank.name}</dd>
              </div>
              <div>
                <dt className={`text-sm ${mutedText}`}>БИК</dt>
                <dd className="mt-1 tabular-nums">{companyDetails.bank.bik}</dd>
              </div>
              <div>
                <dt className={`text-sm ${mutedText}`}>Корреспондентский счёт</dt>
                <dd className="mt-1 tabular-nums">{companyDetails.bank.correspondentAccount}</dd>
              </div>
              <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                <dt className={`text-sm ${mutedText}`}>Расчётный счёт</dt>
                <dd className="mt-1">Указан в счёте на оплату</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
