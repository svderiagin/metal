import type {Metadata} from "next";
import Link from "next/link";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {ContactForm} from "@/components/forms/ContactForm";
import {PageContainer} from "@/components/layout/PageContainer";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {companyDetails} from "@/lib/companyDetails";
import salesDesks from "../../public/images/contacts/sales-01.webp";
import salesTeam from "../../public/images/contacts/sales-04.webp";
import salesOffice from "../../public/images/contacts/sales-06.webp";
import salesMeeting from "../../public/images/contacts/sales-09.webp";
import pickupSheets from "../../public/images/contacts/pickup-01.webp";
import pickupBeams from "../../public/images/contacts/pickup-02.webp";
import pickupTubeStacks from "../../public/images/contacts/pickup-03.webp";
import pickupTubeWarehouse from "../../public/images/contacts/pickup-04.webp";
import pickupForklift from "../../public/images/contacts/pickup-05.webp";
import {ContactPhotoGallery} from "./ContactPhotoGallery";
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
].join("\n");

const mutedText = "text-slate-600 dark:text-slate-300";
const panel = "min-w-0 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
const textLink = "rounded-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-brand-300 dark:hover:text-brand-100";
const mailHref = `mailto:${companyDetails.salesEmail}`;

const salesPhotos = [
  {src: salesDesks, alt: "Коллеги работают за компьютерами", objectPosition: "center 38%"},
  {src: salesTeam, alt: "Сотрудники за рабочим столом в светлом офисе", objectPosition: "center 30%"},
  {src: salesOffice, alt: "Рабочие столы и большие окна в офисе"},
  {src: salesMeeting, alt: "Коллеги обсуждают рабочие вопросы за столом"},
] as const;

const pickupPhotos = [
  {src: pickupSheets, alt: "Штабели металлопроката в складском пролёте"},
  {src: pickupBeams, alt: "Пачки стального проката на открытой складской площадке"},
  {src: pickupTubeStacks, alt: "Пачки металлических труб на стеллажах"},
  {src: pickupTubeWarehouse, alt: "Складской пролёт с металлическими трубами"},
  {src: pickupForklift, alt: "Вилочный погрузчик рядом с грузовой платформой"},
] as const;

export default function ContactsPage() {
  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs items={[{label: "Контакты"}]}/>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page-title">Контакты</h1>
          <p className={`mt-2 max-w-2xl ${mutedText}`}>Свяжитесь с отделом продаж по вопросам заказа, поставки или документов.</p>
        </div>
        <ButtonLink href="#details" variant="secondary">К реквизитам <Icon name="arrow-down"/></ButtonLink>
      </header>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-6">
        <section className={`${panel} p-4 sm:p-6 lg:col-start-1 lg:row-start-1`} aria-labelledby="sales-heading">
          <h2 id="sales-heading" className="text-section-title">Отдел продаж</h2>
          <a href={mailHref} className={`mt-1 inline-flex min-h-11 items-center text-lg ${textLink}`}>{companyDetails.salesEmail}</a>
          <dl className="mt-3 grid gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
            <div>
              <dt className="font-semibold">Новый заказ</dt>
              <dd className={`mt-1 ${mutedText}`}>Перечислите позиции и количество. Спецификацию или чертёж можно приложить к письму.</dd>
            </div>
            <div>
              <dt className="font-semibold">Вопрос по заказу</dt>
              <dd className={`mt-1 ${mutedText}`}>Если заказ уже оформлен, укажите его номер в письме или сообщении.</dd>
            </div>
          </dl>
          <ButtonLink href="/#request" nativeNavigation variant="secondary" className="mt-4 w-full sm:w-fit">
            Запросить расчёт поставки <Icon name="arrow-right" className="shrink-0"/>
          </ButtonLink>
        </section>

        <section className={`${panel} p-4 sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1`} aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading" className="text-section-title">Напишите нам</h2>
          <div className="mt-4 sm:mt-5"><ContactForm/></div>
        </section>

        <ContactPhotoGallery
          photos={salesPhotos}
          label="Фотографии офиса"
          sizes="auto, (min-width: 1360px) 644px, (min-width: 1024px) calc(50vw - 36px), (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)"
          frameClassName="aspect-[16/10] lg:aspect-auto lg:min-h-56"
          className="lg:col-start-1 lg:row-start-2 lg:grid"
        />
      </div>

      <section className={`mt-8 grid items-center gap-4 p-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 sm:p-6 lg:mt-12 ${panel}`} aria-labelledby="contact-delivery-heading">
        <div>
          <h2 id="contact-delivery-heading" className="text-section-title">Доставка и самовывоз</h2>
          <p className={`mt-2 max-w-xl ${mutedText}`}>Для доставки сообщите адрес объекта и желаемую дату. Если забираете заказ сами, согласуйте с отделом продаж адрес склада и время погрузки.</p>
          <Link href="/delivery" className={`mt-2 inline-flex min-h-11 items-center gap-2 text-sm ${textLink}`}>
            Условия доставки и самовывоза <Icon name="arrow-right" className="shrink-0"/>
          </Link>
        </div>
        <ContactPhotoGallery
          photos={pickupPhotos}
          label="Фотографии склада и погрузки"
          sizes="auto, (min-width: 1360px) 619px, (min-width: 1024px) calc(50vw - 61px), (min-width: 640px) calc(50vw - 57px), calc(100vw - 66px)"
          frameClassName="aspect-[2/1]"
        />
      </section>

      <section id="details" tabIndex={-1} className="mt-8 scroll-mt-6 sm:mt-10 lg:mt-12" aria-labelledby="details-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 id="details-heading" className="text-section-title">Реквизиты компании</h2>
          <CopyCompanyDetails details={companyDetailsText}/>
        </div>
        <div className="mt-4 grid gap-4 sm:gap-5 md:grid-cols-2 lg:gap-6">
          <div className={`${panel} p-4 sm:p-6`}>
            <h3 className="text-card-title">{companyDetails.legalName}</h3>
            <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-x-4 gap-y-3">
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
          <div className={`${panel} p-4 sm:p-6`}>
            <h3 className="text-card-title">Банковские реквизиты</h3>
            <dl className="mt-4 space-y-3">
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
