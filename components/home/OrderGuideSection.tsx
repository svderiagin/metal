import Image from "next/image";
import Link from "next/link";
import {Icon} from "@/components/ui/Icon";
import flatbed from "../../public/images/delivery/steel-on-flatbed.webp";

const panel = "min-w-0 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
const muted = "text-sm text-slate-600 dark:text-slate-300";
const action = "mt-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-sm text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-brand-300";

export function OrderGuideSection() {
  return (
    <section aria-labelledby="home-supply-heading">
      <h2 id="home-supply-heading" className="text-section-title">Как заказать</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article className={`${panel} flex flex-col items-start p-4 sm:p-5`}>
          <h3 className="flex items-center gap-2.5 text-card-title">
            <Icon name="cart" className="shrink-0 text-brand-700 dark:text-brand-300"/> Заказать из каталога
          </h3>
          <p className={`mt-2 flex-1 ${muted}`}>
            Выберите размеры и количество, добавьте позиции в корзину. После оформления скачайте счёт на оплату в PDF.
          </p>
          <Link href="/catalog" className={action}>Перейти в каталог <Icon name="arrow-right"/></Link>
        </article>
        <article className={`${panel} flex flex-col items-start p-4 sm:p-5`}>
          <h3 className="flex items-center gap-2.5 text-card-title">
            <Icon name="clipboard" className="shrink-0 text-brand-700 dark:text-brand-300"/> Получить расчёт по спецификации
          </h3>
          <p className={`mt-2 flex-1 ${muted}`}>
            Если у вас список позиций, отправьте заявку. Уточним наличие, стоимость и срок поставки.
          </p>
          <a href="#request" className={action}>Перейти к заявке <Icon name="arrow-down"/></a>
        </article>
      </div>
      <article className={`${panel} mt-3 grid overflow-hidden sm:grid-cols-2`}>
        <div className="self-center p-4 sm:p-5">
          <h3 className="flex items-center gap-2.5 text-card-title">
            <Icon name="truck" className="shrink-0 text-brand-700 dark:text-brand-300"/> Доставка и самовывоз
          </h3>
          <p className={`mt-2 max-w-lg ${muted}`}>
            Доставим заказ по согласованному адресу. Для самовывоза заранее уточните адрес склада и время погрузки.
          </p>
          <div className="flex flex-wrap gap-x-5">
            <Link href="/delivery" className={action}>Условия получения <Icon name="arrow-right"/></Link>
            <Link href="/contacts" className={action}>Связаться с отделом продаж <Icon name="arrow-right"/></Link>
          </div>
        </div>
        <div className="relative min-h-40 overflow-hidden bg-slate-100 sm:min-h-48 dark:bg-slate-800">
          <Image src={flatbed} alt="Стальные профильные трубы, закреплённые на грузовой платформе"
            fill sizes="auto, (min-width: 1360px) 655px, (min-width: 640px) 50vw, calc(100vw - 34px)"
            className="object-cover object-center"/>
        </div>
      </article>
    </section>
  );
}
