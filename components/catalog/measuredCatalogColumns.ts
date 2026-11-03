// Shared column geometry for the active measured-product tables.
export const rebarColumns = [
  {label: "Диаметр, мм", width: "7%"},
  {label: "Форма", width: "8%"},
  {label: "Марка стали", width: "8%"},
  {label: "Цена, ₽/т", width: "12%"},
  {label: "Масса, кг/м", width: "8%"},
  {label: "Длина, м", width: "7%"},
  {label: "Заказ, м", width: "11%"},
  {label: "Заказ, т", width: "11%"},
  {label: "Сумма", width: "15%"},
  {label: "Действие", width: "13%"},
] as const;

export const beamColumns = [
  {label: "Профиль", width: "9%"},
  {label: "Тип балки", width: "10%"},
  {label: "Сталь / класс", width: "8%"},
  {label: "Цена, ₽/т", width: "12%"},
  {label: "Масса, кг/м", width: "8%"},
  {label: "Длина, м", width: "7%"},
  {label: "Заказ, м", width: "11%"},
  {label: "Заказ, т", width: "11%"},
  {label: "Сумма", width: "11%"},
  {label: "Действие", width: "13%"},
] as const;

export const vgpColumns = [
  {label: "Ду × стенка, мм", width: "10%"},
  {label: "Наружный Ø, мм", width: "7%"},
  {label: "Серия", width: "10%"},
  {label: "Цена, ₽/т", width: "11%"},
  {label: "Масса, кг/м", width: "7%"},
  {label: "Длина, м", width: "6%"},
  {label: "Заказ, м", width: "11%"},
  {label: "Заказ, т", width: "12%"},
  {label: "Сумма", width: "13%"},
  {label: "Действие", width: "13%"},
] as const;

export const profilePipeColumns = [
  {label: "Размер, мм", width: "11%"},
  {label: "Стенка, мм", width: "8%"},
  {label: "Цена, ₽/м", width: "12%"},
  {label: "Масса, кг/м", width: "9%"},
  {label: "Длина, м", width: "11%"},
  {label: "Кол-во, шт", width: "10%"},
  {label: "Заказ, м", width: "10%"},
  {label: "Сумма", width: "15%"},
  {label: "В корзину", width: "14%"},
] as const;

