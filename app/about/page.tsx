import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {PageContainer} from "@/components/layout/PageContainer";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {getCategoryBySlug} from "@/lib/catalog";
import {companyDetails} from "@/lib/companyDetails";
import assortmentImage from "../../public/images/about/steel-assortment.webp";
import specificationImage from "../../public/images/about/specification-check.webp";
import rebarImage from "../../public/images/catalog/armatura-card.webp";
import beamImage from "../../public/images/catalog/balka-card.jpg";
import sheetImage from "../../public/images/catalog/listovoy-prokat/list-goryachekatanyj/gallery/sheet-stack-edges.webp";
import roundPipeImage from "../../public/images/catalog/truba-kruglaya/truba-elektrosvarnaya/gallery/welded-pipe-ends.jpg";
import profileTubeImage from "../../public/images/catalog/truby-profilnye/truba-profilnaya-kvadratnaya/gallery/square-tube-ends.jpg";

export const metadata: Metadata = {
  title: "О компании РВБ",
  description: "РВБ-МЕТАЛЛ — проект ООО «РВБ». Металлопрокат для строительства, производства и частных проектов. Каталог, комплектация по спецификации и реквизиты продавца.",
};

const catalogGroups = [
  {slug: "armatura", image: rebarImage, guide: "Класс, диаметр и форма поставки"},
  {slug: "truby-profilnye", image: profileTubeImage, guide: "Размеры сечения и толщина стенки"},
  {slug: "truba-kruglaya", image: roundPipeImage, guide: "Диаметр или Ду, стенка и покрытие"},
  {slug: "listovoy-prokat", image: sheetImage, guide: "Толщина, формат и поверхность"},
  {slug: "balka", image: beamImage, guide: "Обозначение профиля, сталь и длина"},
].flatMap(({slug, image, guide}) => {
  const category = getCategoryBySlug(slug);
  return category ? [{slug, name: category.name, image, guide}] : [];
});

const specificationSteps = [
  {
    title: "Заявка",
    description: "Пришлите список позиций с размерами, объёмом и способом получения.",
  },
  {
    title: "Сверка параметров",
    description: "Уточним исполнение, наличие и сроки. Если нужна замена, согласуем её с вами.",
  },
  {
    title: "Расчёт",
    description: "Подготовим расчёт с перечнем позиций, количеством и стоимостью.",
  },
  {
    title: "Комплектация",
    description: "Соберём согласованные позиции в один заказ и уточним условия отгрузки.",
  },
] as const;

const mutedText = "text-slate-600 dark:text-slate-300";
const panel = "min-w-0 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
const photo = "block h-auto w-full rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800";
const caption = "mt-2 text-xs text-slate-600 dark:text-slate-300";
const sectionSpacing = "mt-9 sm:mt-12 lg:mt-14";
const textLink = "rounded-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-brand-300 dark:hover:text-brand-100";
const mailHref = `mailto:${companyDetails.salesEmail}`;

export default function AboutPage() {
  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs items={[{label: "О компании"}]}/>
      <header className="grid items-center gap-6 sm:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <div>
          <h1 className="text-page-title">О компании РВБ</h1>
          <p className={`mt-4 max-w-xl ${mutedText}`}>
            {companyDetails.brandName} — проект {companyDetails.shortName} по поставке металлопроката для строительства, производства и частных проектов.
          </p>
          <p className={`mt-2 max-w-xl ${mutedText}`}>
            Выберите металл в каталоге или пришлите спецификацию. Из нескольких видов проката можно собрать один заказ.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/#request" nativeNavigation>Запросить расчёт поставки</ButtonLink>
            <ButtonLink href="/catalog" variant="secondary">Перейти в каталог</ButtonLink>
          </div>
        </div>
        <figure className="min-w-0">
          <Image
            src={assortmentImage}
            alt="Пачки рифлёной арматуры, прямоугольных труб и листовой стали"
            sizes="(min-width: 1360px) 676px, (min-width: 768px) 50vw, (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)"
            loading="eager"
            fetchPriority="high"
            className={photo}
          />
          <figcaption className={caption}>Иллюстрация ассортимента</figcaption>
        </figure>
      </header>

      <section className={sectionSpacing} aria-labelledby="about-catalog-heading">
        <h2 id="about-catalog-heading" className="text-section-title">Что поставляем</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {catalogGroups.map(({slug, name, image, guide}, index) => {
            const wideOnMobile = index === catalogGroups.length - 1;
            return (
              <li key={slug} className={`min-w-0 ${wideOnMobile ? "col-span-2 lg:col-span-1" : ""}`}>
                <Link
                  href={`/catalog/${slug}`}
                  className={`group grid h-full overflow-hidden hover:border-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:hover:border-brand-400 dark:focus-visible:outline-brand-300 ${panel} ${wideOnMobile ? "grid-cols-2 lg:grid-cols-1 lg:grid-rows-[auto_1fr]" : "grid-rows-[auto_1fr]"}`}
                >
                  <Image
                    src={image}
                    alt=""
                    sizes="auto, (min-width: 1360px) 248px, (min-width: 1024px) 20vw, 50vw"
                    className={`block aspect-[3/2] w-full bg-slate-100 object-cover dark:bg-slate-800 ${wideOnMobile ? "h-full lg:h-auto" : "h-auto"}`}
                  />
                  <div className="flex min-w-0 flex-col p-3 max-[359px]:px-2 sm:p-4">
                    <h3 className="text-card-title group-hover:text-brand-700 dark:group-hover:text-brand-300">{name}</h3>
                    <p className={`mb-2 mt-1 text-sm ${mutedText}`}>{guide}</p>
                    <Icon name="arrow-right" className="mt-auto self-end text-brand-700 dark:text-brand-300"/>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={sectionSpacing} aria-labelledby="about-specification-heading">
        <h2 id="about-specification-heading" className="text-section-title">Как работаем со спецификацией</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {specificationSteps.map(({title, description}, index) => (
            <li key={title} className={`${panel} p-4 sm:p-5`}>
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800 dark:bg-brand-800 dark:text-brand-100">
                  {index + 1}
                </span>
                <h3 className="pt-0.5 text-card-title">{title}</h3>
                {index < specificationSteps.length - 1 && (
                  <span className="ml-auto mt-1 hidden shrink-0 text-brand-700 dark:text-brand-300 xl:block">
                    <Icon name="arrow-right"/>
                  </span>
                )}
              </div>
              <p className={`mt-2 text-sm ${mutedText}`}>{description}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-6">
          <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-100 p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-card-title">Что указать в заявке</h3>
            <p className={`mt-2 ${mutedText}`}>Укажите название и размер позиции, необходимое количество и единицу измерения. Добавьте марку стали или стандарт, если они заданы проектом.</p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className={`text-sm ${mutedText}`}>Пример позиции</p>
              <p className="mt-1 font-semibold">Труба профильная прямоугольная 60 × 40 × 2 мм</p>
              <p className={mutedText}>Длина трубы 6 м · 20 шт. · всего 120 м</p>
            </div>
            <p className={`mt-4 ${mutedText}`}>
              Для доставки добавьте адрес объекта. Ведомость или чертёж можно отправить на <a href={mailHref} className={textLink}>{companyDetails.salesEmail}</a>.
            </p>
          </div>
          <figure className="min-w-0">
            <Image
              src={specificationImage}
              alt="Торец профильной трубы, штангенциркуль и лист спецификации"
              sizes="auto, (min-width: 1360px) 592px, (min-width: 768px) 46vw, calc(100vw - 32px)"
              className={photo}
            />
          </figure>
        </div>
      </section>

      <section className={sectionSpacing} aria-labelledby="about-documents-heading">
        <h2 id="about-documents-heading" className="text-section-title">Документы и условия поставки</h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          <div className={`${panel} p-4 sm:p-6`}>
            <dt className="text-card-title">Счёт на оплату</dt>
            <dd className={`mt-2 ${mutedText}`}>После оформления заказа на сайте вы можете скачать счёт в PDF. В нём указаны состав заказа, сумма и реквизиты для оплаты.</dd>
          </div>
          <div className={`${panel} p-4 sm:p-6`}>
            <dt className="text-card-title">Документ о качестве</dt>
            <dd className={`mt-2 ${mutedText}`}>Документ производителя содержит сведения о конкретной партии. Если он нужен для приёмки, укажите это в заявке, чтобы заранее уточнить, какие документы будут доступны для выбранных позиций.</dd>
          </div>
        </dl>
        <Link href="/delivery" className={`mt-3 inline-flex min-h-11 items-center gap-2 ${textLink}`}>
          Условия доставки и самовывоза <Icon name="arrow-right" className="shrink-0"/>
        </Link>
      </section>

      <section
        className={`${sectionSpacing} grid gap-5 rounded-lg border border-slate-200 bg-slate-100 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end dark:border-slate-700 dark:bg-slate-800`}
        aria-labelledby="about-requisites-heading"
      >
        <div>
          <h2 id="about-requisites-heading" className="text-section-title">Реквизиты и связь</h2>
          <p className="mt-3 font-semibold">{companyDetails.legalName}</p>
          <dl className={`mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm ${mutedText}`}>
            <div className="flex gap-2"><dt>ИНН</dt><dd className="tabular-nums">{companyDetails.inn}</dd></div>
            <div className="flex gap-2"><dt>ОГРН</dt><dd className="tabular-nums">{companyDetails.ogrn}</dd></div>
          </dl>
          <a href={mailHref} className={`mt-2 inline-flex min-h-11 items-center ${textLink}`}>{companyDetails.salesEmail}</a>
        </div>
        <div className="grid gap-2.5 sm:flex sm:flex-wrap">
          <ButtonLink href="/contacts#details" nativeNavigation variant="secondary">Полные реквизиты</ButtonLink>
          <ButtonLink href="/#request" nativeNavigation>Запросить расчёт поставки</ButtonLink>
        </div>
      </section>
    </PageContainer>
  );
}
