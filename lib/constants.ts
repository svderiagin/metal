export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";
export const CART_STORAGE_KEY = "metal-store-cart-v1";
export const ORDER_STORAGE_KEY = "metal-store-order-v1";
export const mainNavigation = [
  {label: "Каталог", href: "/catalog"}, {label: "Трубы", href: "/catalog/truby-stalnye"}, {
    label: "Листовой прокат",
    href: "/catalog/listovoy-prokat"
  }, {label: "Арматура", href: "/catalog/armatura"}, {label: "Услуги", href: "/services"}, {
    label: "Доставка",
    href: "/delivery"
  }, {label: "О компании", href: "/about"}, {label: "Контакты", href: "/contacts"},
] as const;
