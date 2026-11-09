import Link from "next/link";
import {mainNavigation} from "@/lib/constants";
import {PageContainer} from "./PageContainer";
import styles from "./Navigation.module.css";

export function DesktopNavigation() {
  return (
    <nav
      aria-label="Основная навигация"
      className="hidden pb-3 md:block"
    >
      <PageContainer>
        <ul className="flex w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          {mainNavigation.map((item) => (
            <li key={item.href} className="min-w-0 flex-1 border-r border-slate-700 last:border-r-0">
              <Link
                href={item.href}
                className={`${styles.link} flex min-h-11 items-center justify-center px-4 py-2.5 text-center text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white`}
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
