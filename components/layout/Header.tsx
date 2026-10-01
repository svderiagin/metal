import Link from "next/link";
import {PageContainer} from "./PageContainer";
import {DesktopNavigation} from "./DesktopNavigation";
import {MobileNavigation} from "./MobileNavigation";
import {CartButton} from "@/components/cart/CartButton";
import {companyDetails} from "@/lib/companyDetails";

export function Header() {
  return (
    <header className="bg-slate-950 text-white">
      <div className="border-b border-slate-800 text-xs text-slate-300">
        <PageContainer className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5">
          <strong className="text-white">{companyDetails.shortName}</strong>
          <span>ИНН {companyDetails.inn}</span>
          <Link className="ml-auto transition-colors hover:text-white" href="/contacts#details">
            Реквизиты
          </Link>
        </PageContainer>
      </div>
      <PageContainer className="flex items-center gap-4 py-4 sm:py-5">
        <Link href="/" className="shrink-0 rounded-sm">
          <span className="block text-xl font-black tracking-wider sm:text-2xl">
            ООО <span className="text-red-600">РВБ</span>
          </span>
          <span className="hidden text-xs text-slate-400 sm:block">
            Металлоконструкции и металлопрокат
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
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
