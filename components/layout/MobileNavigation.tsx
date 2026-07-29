"use client";
import Link from "next/link";
import {useState} from "react";
import {mainNavigation} from "@/lib/constants";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-slate-700 md:hidden">
      <button
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center justify-between px-4 font-bold text-white sm:px-6"
      >
        Меню
        <span className="text-xl" aria-hidden>{open ? "×" : "☰"}</span>
      </button>
      {open && (
        <nav aria-label="Мобильная навигация" className="border-t border-slate-700 bg-slate-900">
          <ul>
            {mainNavigation.map((item) => (
              <li key={item.href} className="border-b border-slate-800 last:border-b-0">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center px-4 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-800 sm:px-6"
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
