import Link from "next/link";
import {PageContainer} from "./PageContainer";
import {getAllCategories} from "@/lib/catalog";

export function Footer() {
  const footerLinkClass = "inline-flex min-h-8 items-center transition-colors hover:text-white";

  return (
    <footer className="mt-auto border-t-4 border-red-700 bg-slate-950 text-slate-300">
      <PageContainer className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:py-14">
        <div>
          <p className="text-xl font-black text-white">
            METAL <span className="text-red-600">STORE</span>
          </p>
          <p className="mt-4 text-sm leading-6">
            Металлопрокат для производства, строительства и частных проектов. Комплектация,
            обработка и доставка.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white">Каталог</h2>
          <ul className="mt-3 text-sm">
            {getAllCategories().map((category) => (
              <li key={category.id}>
                <Link href={`/catalog/${category.slug}`} className={footerLinkClass}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-bold text-white">Компания</h2>
          <ul className="mt-3 text-sm">
            <li><Link href="/about" className={footerLinkClass}>О компании</Link></li>
            <li><Link href="/services" className={footerLinkClass}>Услуги</Link></li>
            <li><Link href="/delivery" className={footerLinkClass}>Доставка</Link></li>
            <li><Link href="/contacts" className={footerLinkClass}>Контакты</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-bold text-white">Контакты</h2>
          <address className="mt-4 space-y-3 text-sm leading-6 not-italic">
            <p>+7 (800) 000-00-00</p>
            <p>sales@metal-store.ru</p>
            <p>Склад: Московская область, г. Северный, Промышленный проезд, 12</p>
            <p>Пн–Пт: 08:00–18:00</p>
          </address>
        </div>
      </PageContainer>
      <div className="border-t border-slate-800">
        <PageContainer className="flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} METAL STORE. Учебная демонстрационная витрина.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a className="transition-colors hover:text-white" href="#">Политика конфиденциальности</a>
            <a className="transition-colors hover:text-white" href="#">Условия продажи</a>
          </div>
        </PageContainer>
      </div>
    </footer>
  );
}
