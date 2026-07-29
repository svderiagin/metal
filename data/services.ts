import type {Service} from "@/types/service";

export const services: Service[] = [
  {
    id: "cut",
    name: "Резка металла",
    description: "Ленточнопильная и газовая резка заготовок по размерам заказа.",
    marker: "01"
  },
  {
    id: "bend",
    name: "Гибка металла",
    description: "Изготовление деталей и профилей по согласованным чертежам.",
    marker: "02"
  },
  {
    id: "build",
    name: "Изготовление металлоконструкций",
    description: "Сборка простых конструкций для бизнеса и частных объектов.",
    marker: "03"
  },
  {
    id: "delivery",
    name: "Доставка",
    description: "Комплектуем машину и доставляем заказ на объект по России.",
    marker: "04"
  },
];
