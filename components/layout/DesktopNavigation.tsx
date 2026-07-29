import Link from "next/link";
import {mainNavigation} from "@/lib/constants";
import {PageContainer} from "./PageContainer";

export function DesktopNavigation() {
  return (
    <nav
      aria-label="Основная навигация"
      className="hidden border-t border-slate-700 bg-slate-900 md:block"
    >
      <PageContainer>
        <ul className="flex w-full">
          {mainNavigation.map((item) => (
            <li key={item.href} className="flex-1 border-r border-slate-700 first:border-l">
              <Link
                href={item.href}
                className="flex min-h-12 items-center justify-center px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-slate-200 transition-colors hover:bg-red-700 hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </PageContainer>
    </nav>
  );
}
