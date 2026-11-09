"use client";
import Link from "next/link";
import {useId, useRef, useState} from "react";
import {mainNavigation} from "@/lib/constants";
import styles from "./Navigation.module.css";

export function MobileNavigation() {
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
        className="flex min-h-12 w-full items-center justify-between px-4 font-bold text-white sm:px-6"
      >
        Меню
        <span className="text-xl" aria-hidden>{open ? "×" : "☰"}</span>
      </button>
      {open && (
        <nav id={navigationId} aria-label="Мобильная навигация" className="mx-4 mb-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 sm:mx-5">
          <ul>
            {mainNavigation.map((item) => (
              <li key={item.href} className="border-b border-slate-700 last:border-b-0">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`${styles.link} flex min-h-12 items-center px-4 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-800 sm:px-6`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
