"use client";

import {useSyncExternalStore} from "react";
import {getThemePreference, setThemePreference, subscribeToTheme} from "@/lib/theme";

const serverTheme = () => "system" as const;
const themes = {
  light: {name: "Светлая тема", next: "dark", action: "Включить тёмную тему"},
  dark: {name: "Тёмная тема", next: "system", action: "Включить системную тему"},
  system: {name: "Системная тема", next: "light", action: "Включить светлую тему"},
} as const;

export function ThemeSwitch() {
  const preference = useSyncExternalStore(subscribeToTheme, getThemePreference, serverTheme);
  const theme = themes[preference];
  const label = `${theme.name}. ${theme.action}`;
  return (
    <button type="button" aria-label={label} title={label}
      onClick={() => setThemePreference(themes[getThemePreference()].next)}
      className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-600 bg-slate-900 text-slate-300 transition-colors hover:border-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-white! active:bg-slate-700">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
        className="size-5">
        {preference === "system" ? <>
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/>
        </> : preference === "dark"
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z"/>
          : <><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>}
      </svg>
    </button>
  );
}
