import Link from "next/link";
import {PageContainer} from "./PageContainer";
import {getAllCategories} from "@/lib/catalog";
import {companyDetails} from "@/lib/companyDetails";
import styles from "./Navigation.module.css";

export function Footer() {
  const footerLinkClass = "inline-flex min-h-8 items-center rounded-sm transition-colors hover:text-white";
  const utilityLinkClass = "inline-flex min-h-6 items-center rounded-sm transition-colors hover:text-white";

  return (
    <footer className={`${styles.darkSurface} mt-auto border-t border-slate-700 bg-slate-950 text-slate-300`}>
      <PageContainer className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:py-14">
        <div>
          <p className="text-xl font-bold text-white">
            ООО <span className="brand-wordmark">РВБ</span>
          </p>
          <p className="mt-4 text-sm leading-6">
            Металлопрокат для производства, строительства и частных проектов. Комплектация,
            обработка и доставка.
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            <a href={`mailto:${companyDetails.salesEmail}`} className={`${utilityLinkClass} text-slate-200`}>{companyDetails.salesEmail}</a><br/>
            {companyDetails.shortName}<br/>
            ИНН {companyDetails.inn}
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
            <li><Link href="/contacts#details" className={footerLinkClass}>Реквизиты</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-bold text-white">Юридическая информация</h2>
          <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
            <p>ОГРН {companyDetails.ogrn}</p>
            <p>КПП {companyDetails.kpp}</p>
            <p className="break-words">
              {companyDetails.legalAddressLines.map(line => <span key={line} className="block">{line}</span>)}
            </p>
          </div>
        </div>
      </PageContainer>
      <div className="border-t border-slate-800">
        <PageContainer className="flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© 2024 ООО РВБ — Металлоконструкции и металлопрокат</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className={utilityLinkClass} href="/privacy">Политика обработки персональных данных</Link>
          </div>
        </PageContainer>
      </div>
    </footer>
  );
}
