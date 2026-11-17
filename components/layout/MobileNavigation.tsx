"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useId, useRef, useState} from "react";
import {mainNavigation} from "@/lib/constants";
import styles from "./Navigation.module.css";
import {Icon} from "@/components/ui/Icon";

export function MobileNavigation() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath !== null && openPath === pathname;
  const navigationId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpenPath(null);
    }
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [open]);

  return (
    <div ref={container} className="border-t border-slate-700 md:hidden"
      onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpenPath(null);
      }}
      onKeyDown={event => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        setOpenPath(null);
        trigger.current?.focus();
      }}>
      <button
        ref={trigger}
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls={navigationId}
        onClick={() => setOpenPath(open ? null : pathname)}
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
                onClick={() => {
                  if (pathname === item.href) trigger.current?.focus();
                  setOpenPath(null);
                }}
                className={`${styles.link} flex min-h-12 items-center px-4 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-800 sm:px-6`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/#request" onClick={() => setOpenPath(null)}
              className={`${styles.link} flex min-h-12 items-center px-4 py-3 font-semibold text-white underline underline-offset-4 hover:bg-slate-800 sm:px-6`}>
              Запросить расчёт
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
