"use client";

import {useSyncExternalStore} from "react";
import {getThemePreference, setThemePreference, subscribeToTheme} from "@/lib/theme";
import {Icon} from "@/components/ui/Icon";

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
      <Icon name={preference === "system" ? "system" : preference === "dark" ? "moon" : "sun"}/>
    </button>
  );
}
