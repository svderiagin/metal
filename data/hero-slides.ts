export interface HeroSlide {
  id: string;
  src: string;
  desktopPosition?: string;
  mobilePosition?: string;
}

// Интервал смены фотографий; не связан с длительностью плавного перехода.
export const AUTO_ROTATE_MS = 2000;

export const HERO_SLIDES: HeroSlide[] = [
  {id: "hero-01", src: "/images/hero/hero-01.avif", desktopPosition: "50% 50%", mobilePosition: "60% 50%"},
  {id: "hero-02", src: "/images/hero/hero-02.avif", desktopPosition: "50% 50%", mobilePosition: "60% 50%"},
  {id: "hero-03", src: "/images/hero/hero-03.avif", desktopPosition: "50% 50%", mobilePosition: "60% 50%"},
  {id: "hero-04", src: "/images/hero/hero-04.avif", desktopPosition: "50% 50%", mobilePosition: "60% 50%"},
];
