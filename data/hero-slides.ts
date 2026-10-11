export interface HeroSlide {
  id: string;
  src: string;
  desktopPosition?: string;
  mobilePosition?: string;
}

// Интервал смены фотографий; не связан с длительностью плавного перехода.
export const AUTO_ROTATE_MS = 2000;

export const HERO_SLIDES: HeroSlide[] = [
  {id: "hero-01", src: "/images/hero/1.avif", desktopPosition: "50% 65%", mobilePosition: "70% 65%"},
  {id: "hero-02", src: "/images/hero/2.avif", desktopPosition: "50% 25%", mobilePosition: "65% 25%"},
  {id: "hero-03", src: "/images/hero/3.avif", desktopPosition: "50% 65%", mobilePosition: "52% 65%"},
  {id: "hero-04", src: "/images/hero/4.avif", desktopPosition: "50% 65%", mobilePosition: "65% 65%"},
  {id: "hero-05", src: "/images/hero/5.avif", desktopPosition: "50% 75%", mobilePosition: "52% 75%"},
];
