export type ThemePreference = "system" | "light" | "dark";

const storageKey = "rvb-theme";
const changeEvent = "rvb-theme-change";
let sessionPreference: ThemePreference | undefined;

// Runs in the head before paint. Storage may be unavailable in private/restricted browsers.
export const themeInitScript = `(()=>{let p;try{p=localStorage.getItem("${storageKey}")}catch{}document.documentElement.dataset.theme=p==="dark"||p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"})()`;

export function getThemePreference(): ThemePreference {
  if (sessionPreference) return sessionPreference;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* Use the system preference when storage is blocked. */ }
  return "system";
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, preference);
    sessionPreference = undefined;
  } catch {
    sessionPreference = preference;
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const preference = getThemePreference();
    document.documentElement.dataset.theme = preference === "dark" || preference === "system" && media.matches ? "dark" : "light";
    onChange();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      sessionPreference = undefined;
      apply();
    }
  };
  media.addEventListener("change", apply);
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, apply);
  apply();
  return () => {
    media.removeEventListener("change", apply);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, apply);
  };
}
