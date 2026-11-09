import styles from "./Icon.module.css";

const glyphs = {
  cart: <><path d="M3 3h2l2.4 11.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.95-1.55L22 7H6"/><circle cx="10" cy="20" r="1"/><circle cx="19" cy="20" r="1"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6"/>,
  "arrow-left": <path d="M20 12H4m6-6-6 6 6 6"/>,
  "arrow-down": <path d="M12 4v16m-6-6 6 6 6-6"/>,
  "chevron-down": <path d="m6 9 6 6 6-6"/>,
  "chevron-left": <path d="m15 6-6 6 6 6"/>,
  "chevron-right": <path d="m9 6 6 6-6 6"/>,
  expand: <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>,
  "zoom-in": <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M10.5 7.5v6m-3-3h6"/></>,
  "zoom-out": <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M7.5 10.5h6"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.25 1.8C12.65 11.55 12 12 12 13.5M12 17h.01"/></>,
  pause: <path d="M8 5h2v14H8zM14 5h2v14h-2z"/>,
  play: <path d="m8 5 11 7-11 7z"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
  moon: <path d="M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z"/>,
  system: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 6a6 6 0 0 1 0 12Z" fill="currentColor" stroke="none"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
};

export type IconName = keyof typeof glyphs;

/** Decorative action icon. Its surrounding control supplies the accessible name. */
export function Icon({name, className = ""}: {name: IconName; className?: string}) {
  return <svg aria-hidden="true" focusable="false" data-ui-icon={name}
    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${styles.icon} ${className}`}>
    {glyphs[name]}
  </svg>;
}
