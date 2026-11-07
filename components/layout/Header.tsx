import Link from "next/link";
import {PageContainer} from "./PageContainer";
import {DesktopNavigation} from "./DesktopNavigation";
import {MobileNavigation} from "./MobileNavigation";
import {CartButton} from "@/components/cart/CartButton";
import {companyDetails} from "@/lib/companyDetails";
import {ThemeSwitch} from "./ThemeSwitch";

export function Header() {
  return (
    <header className="bg-slate-950 text-white">
      <div className="border-b border-slate-800 text-xs text-slate-300">
        <PageContainer className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5">
          <strong className="text-white">{companyDetails.shortName}</strong>
          <a href={`mailto:${companyDetails.salesEmail}`} className="hover:text-white">{companyDetails.salesEmail}</a>
          <span className="hidden sm:inline">{companyDetails.phonePlaceholder}</span>
          <Link className="ml-auto transition-colors hover:text-white" href="/contacts#details">
            Реквизиты
          </Link>
        </PageContainer>
      </div>
      <PageContainer className="flex flex-wrap items-center gap-2 py-4 sm:gap-4 sm:py-5">
        <Link href="/" className="max-w-full shrink-0 rounded-sm">
          <span className="block text-xl font-bold tracking-wider sm:text-2xl">
            ООО <span className="text-red-600">РВБ</span>
          </span>
          <span className="hidden text-xs text-slate-400 sm:block">
            Металлоконструкции и металлопрокат
          </span>
        </Link>
        <div className="ml-auto flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
          <ThemeSwitch/>
          <Link
            href="/#request"
            className="hidden min-h-11 items-center rounded-lg bg-red-700 px-5 text-sm font-bold shadow-sm transition-colors hover:bg-red-800 sm:inline-flex"
          >
            Отправить заявку
          </Link>
          <CartButton/>
        </div>
      </PageContainer>
      <DesktopNavigation/>
      <MobileNavigation/>
    </header>
  );
}
