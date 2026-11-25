import type {Metadata} from "next";
import Image from "next/image";
import type {StaticImageData} from "next/image";
import type {ReactNode} from "react";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {PageContainer} from "@/components/layout/PageContainer";
import {ButtonLink} from "@/components/ui/Button";
import {Icon, type IconName} from "@/components/ui/Icon";
import {BACKORDER_DELIVERY_ESTIMATE} from "@/lib/catalogOffer";
import {companyDetails} from "@/lib/companyDetails";
import goodsReceiptImage from "../../public/images/delivery/goods-receipt.webp";
import loadingBayImage from "../../public/images/delivery/loading-bay.webp";
import restraintImage from "../../public/images/delivery/load-restraint.webp";
import steelBatchImage from "../../public/images/delivery/steel-batch.webp";
import flatbedImage from "../../public/images/delivery/steel-on-flatbed.webp";
import transportImage from "../../public/images/delivery/transport-on-road.webp";
import unloadingImage from "../../public/images/delivery/unloading-site.webp";
import pickupImage from "../../public/images/delivery/warehouse-pickup.webp";
import styles from "./delivery.module.css";

export const metadata: Metadata = {
  title: "Доставка и самовывоз металлопроката",
  description: "Условия доставки и самовывоза металлопроката. Как согласовать дату отгрузки, подготовить подъезд и организовать разгрузку на объекте.",
};

const orderSteps = [
  {
    title: "Оформление",
    description: "Добавьте товары в корзину и укажите адрес доставки.",
  },
  {
    title: "Счёт и оплата",
    description: "После оформления скачайте счёт в PDF и оплатите его по указанным реквизитам.",
  },
  {
    title: "Согласование отгрузки",
    description: "До отгрузки согласуем дату, время и условия разгрузки.",
  },
  {
    title: "Получение",
    description: "При приёмке сверьте позиции, количество и состояние металлопроката.",
  },
] as const;

const handlingPhotos = [
  {
    image: steelBatchImage,
    alt: "Пачка стальных листов на деревянных брусьях, стянутая металлической лентой",
    label: "Комплектация партии",
  },
  {
    image: loadingBayImage,
    alt: "Мостовой кран над подготовленными пачками труб и пустой грузовой платформой",
    label: "Площадка погрузки",
  },
  {
    image: restraintImage,
    alt: "Ремень с натяжным механизмом крепит пачку профильных труб к бортовой платформе",
    label: "Крепление груза",
  },
  {
    image: goodsReceiptImage,
    alt: "Сотрудник сверяет партию профильных труб и делает отметку в ведомости",
    label: "Приёмка металлопроката",
  },
] as const;

const accessChecklist = [
  {
    title: "Адрес и время",
    description: "Укажите точный адрес и желаемую дату. Если у объекта несколько въездов, уточните, через какой направить машину.",
  },
  {
    title: "Подъезд",
    description: "Сообщите, нужен ли пропуск. Укажите ограничения по высоте или ширине проезда и где машина сможет развернуться.",
  },
  {
    title: "Параметры груза",
    description: "Для подбора кузова важна длина самого длинного изделия. Укажите её отдельно от суммарного метража и добавьте общую массу партии, если знаете.",
  },
  {
    title: "Разгрузка",
    description: "Уточните место выгрузки и какая техника есть на площадке. Заранее согласуйте, кто будет разгружать машину.",
  },
] as const;

const sitePoints = [
  {label: "Въезд", position: styles.entryPoint},
  {label: "Место для манёвра", position: styles.turnPoint},
  {label: "Точка разгрузки", position: styles.unloadPoint},
] as const;

const mutedText = "text-slate-600 dark:text-slate-300";
const panel = "min-w-0 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
const rule = "border-slate-200 dark:border-slate-700";
const caption = "mt-2 text-xs text-slate-600 dark:text-slate-300";
const mailHref = `mailto:${companyDetails.salesEmail}`;

export default function DeliveryPage() {
  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs items={[{label: "Доставка"}]}/>
      <header className="grid items-center gap-6 sm:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <div>
          <h1 className="max-w-xl text-page-title">Доставка и самовывоз металлопроката</h1>
          <p className={`mt-4 max-w-xl ${mutedText}`}>
            Бесплатно доставляем металлопрокат по согласованному адресу. Подбираем транспорт с учётом массы партии, длины изделий и подъезда к объекту.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/#request" nativeNavigation>Запросить расчёт поставки</ButtonLink>
            <ButtonLink href="/catalog" variant="secondary">Перейти в каталог</ButtonLink>
          </div>
        </div>
        <figure className="min-w-0">
          <Image
            src={flatbedImage}
            alt="Бортовая платформа с закреплённым грузом из стальных профильных труб"
            sizes="(min-width: 1360px) 676px, (min-width: 768px) 50vw, (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)"
            loading="eager"
            fetchPriority="high"
            className="block h-auto w-full rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
          />
        </figure>
      </header>

      <section className="mt-9 sm:mt-12 lg:mt-14" aria-labelledby="receiving-heading">
        <h2 id="receiving-heading" className="text-section-title">Способы получения и сроки</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ReceivingOption
            title="Доставка на объект"
            icon="truck"
            image={transportImage}
            alt="Грузовик с закреплённым металлопрокатом на дороге в промзоне"
          >
            Согласуем возможность доставки по вашему адресу, время прибытия машины и условия разгрузки.
          </ReceivingOption>
          <ReceivingOption
            title="Самовывоз"
            icon="layers"
            image={pickupImage}
            alt="Бортовая машина у склада, где к выдаче подготовлены пачки профильных труб"
          >
            Перед поездкой <a href={mailHref} className={styles.textLink}>напишите в отдел продаж</a>. Сообщим адрес склада, согласуем время погрузки и подскажем, какие данные нужны для въезда.
          </ReceivingOption>
        </div>
        <dl className={`mt-3 grid divide-y rounded-lg border bg-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0 dark:bg-slate-800 ${rule} divide-slate-200 dark:divide-slate-700`}>
          <div className="min-w-0 p-4 sm:p-5">
            <dt className="font-semibold">В наличии</dt>
            <dd className={`mt-1 text-sm ${mutedText}`}>Отгружаем после комплектации и подтверждения оплаты. Дату согласуем с вами.</dd>
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <dt className="font-semibold">Под заказ</dt>
            <dd className={`mt-1 text-sm ${mutedText}`}>Ориентир по доставке — <strong className="whitespace-nowrap">{BACKORDER_DELIVERY_ESTIMATE}</strong>. Точную дату согласуем с вами.</dd>
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <dt className="font-semibold">В наличии и под заказ</dt>
            <dd className={`mt-1 text-sm ${mutedText}`}>Если в одном заказе есть оба типа позиций, согласуем дату и порядок получения.</dd>
          </div>
        </dl>
      </section>

      <section className="mt-9 sm:mt-12 lg:mt-14" aria-labelledby="order-steps-heading">
        <h2 id="order-steps-heading" className="text-section-title">Как проходит заказ</h2>
        <ol className={`mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-slate-200 lg:grid-cols-4 dark:bg-slate-700 ${rule}`}>
          {orderSteps.map(({title, description}, index) => (
            <li key={title} className="min-w-0 bg-white p-4 sm:p-5 dark:bg-slate-900">
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className={styles.stepMarker}>{index + 1}</span>
                <h3 className="pt-0.5 text-card-title">{title}</h3>
              </div>
              <p className={`mt-2 text-sm ${mutedText}`}>{description}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-4 lg:grid-cols-4" aria-label="Примеры комплектации и приёмки">
          {handlingPhotos.map(({image, alt, label}) => (
            <li key={label} className="min-w-0">
              <figure>
                <Image
                  src={image}
                  alt={alt}
                  sizes="auto, (min-width: 1360px) 316px, (min-width: 1024px) 25vw, 50vw"
                  className="block h-auto w-full rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                />
                <figcaption className="mt-2 text-sm font-semibold">{label}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9 sm:mt-12 lg:mt-14" aria-labelledby="site-heading">
        <h2 id="site-heading" className="text-section-title">Как подготовить объект к доставке</h2>
        <p className={`mt-2 max-w-3xl ${mutedText}`}>Передайте эти сведения при оформлении заказа. Так мы сможем заранее согласовать, как машина подъедет к месту разгрузки.</p>
        <div className="mt-4 grid items-start gap-5 md:gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
          <dl className={`${panel} divide-y divide-slate-200 dark:divide-slate-700`}>
            {accessChecklist.map(({title, description}) => (
              <div key={title} className="px-4 py-3.5 sm:px-6 sm:py-4">
                <dt className="font-semibold">{title}</dt>
                <dd className={`mt-1 text-sm ${mutedText}`}>{description}</dd>
              </div>
            ))}
          </dl>
          <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2">
            <SiteAccessDiagram/>
            <figure className="min-w-0">
              <Image
                src={unloadingImage}
                alt="Въезд через открытые ворота на свободную площадку перед складом"
                sizes="(min-width: 1360px) 330px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, calc(100vw - 32px)"
                className="block h-auto w-full rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
              />
              <figcaption className={caption}>Иллюстрация площадки для разгрузки</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section
        className={`mt-9 grid gap-5 rounded-lg border bg-slate-100 p-4 sm:mt-12 sm:p-6 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center dark:bg-slate-800 ${rule}`}
        aria-labelledby="delivery-request-heading"
      >
        <div>
          <h2 id="delivery-request-heading" className="text-section-title">Куда передать данные</h2>
          <p className={`mt-2 max-w-3xl ${mutedText}`}>
            При оформлении заполните поле «Адрес доставки». Время, пропуск, подъезд и разгрузку укажите в поле «Комментарий к доставке».
          </p>
          <p className={`mt-2 ${mutedText}`}>
            Спецификацию можно отправить на <a href={mailHref} className={styles.textLink}>{companyDetails.salesEmail}</a>.
          </p>
        </div>
        <ButtonLink href="/#request" nativeNavigation className="sm:justify-self-start">Запросить расчёт поставки</ButtonLink>
      </section>
    </PageContainer>
  );
}

function ReceivingOption({title, icon, image, alt, children}: {
  title: string;
  icon: IconName;
  image: StaticImageData;
  alt: string;
  children: ReactNode;
}) {
  return (
    <div className={`${panel} grid grid-rows-[1fr_auto] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-1`}>
      <div className="p-4 sm:p-5">
        <h3 className="flex items-center gap-2.5 text-card-title">
          <Icon name={icon} className="shrink-0 text-brand-700 dark:text-brand-400"/>
          {title}
        </h3>
        <p className={`mt-2 ${mutedText}`}>{children}</p>
      </div>
      <div className="min-w-0 px-4 pb-4 sm:px-5 sm:pb-5 lg:self-center lg:py-4 lg:pl-0 lg:pr-4">
        <Image
          src={image}
          alt={alt}
          sizes="auto, (min-width: 1360px) 293px, (min-width: 1024px) 24vw, (min-width: 768px) 50vw, 100vw"
          className="block h-auto w-full rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>
    </div>
  );
}

function SiteAccessDiagram() {
  return (
    <figure className={panel}>
      <div className={styles.siteMap} aria-hidden="true">
        <span className={styles.road}/>
        <span className={styles.yard}/>
        <span className={styles.gate}/>
        <span className={styles.maneuverArea}/>
        <span className={styles.building}/>
        <span className={styles.unloadingArea}/>
        <span className={styles.routeLine}/>
        {sitePoints.map(({label, position}, index) => (
          <span key={label} className={`${styles.stepMarker} ${styles.mapPoint} ${position}`}>{index + 1}</span>
        ))}
      </div>
      <figcaption className="p-3 sm:p-4">
        <p className="text-sm font-semibold">Схема проезда на объект</p>
        <ol className={`mt-1.5 list-decimal space-y-0.5 pl-5 text-sm ${mutedText}`}>
          {sitePoints.map(({label}) => <li key={label}>{label}</li>)}
        </ol>
      </figcaption>
    </figure>
  );
}
