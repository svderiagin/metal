"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useId, useRef, useState} from "react";
import {mainNavigation} from "@/lib/constants";
import styles from "./Navigation.module.css";
import {Icon} from "@/components/ui/Icon";

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navigationId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className="border-t border-slate-700 md:hidden" onKeyDown={event => {
      if (event.key === "Escape" && open) {setOpen(false); trigger.current?.focus();}
    }}>
      <button
        ref={trigger}
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls={navigationId}
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full cursor-pointer items-center justify-between px-4 font-bold text-white transition-colors hover:bg-slate-900 sm:px-6"
      >
        Меню
        <Icon name={open ? "close" : "menu"}/>
      </button>
      <nav id={navigationId} hidden={!open} aria-label="Мобильная навигация" className="mx-4 mb-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 sm:mx-5">
        <ul>
          {mainNavigation.map((item) => (
            <li key={item.href} className="border-b border-slate-700 last:border-b-0">
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : pathname.startsWith(`${item.href}/`) ? "location" : undefined}
                onClick={() => setOpen(false)}
                className={`${styles.link} flex min-h-12 items-center px-4 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-800 sm:px-6`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
