import type {ProductVariantSource} from "@/types/product";
import {electroweldedPipeAssortmentStandard, electroweldedPipeMass, electroweldedPipeStandard,
  electroweldedPipeTechnicalStandard} from "@/lib/electroweldedPipe";
import {formatMassPerMeter, formatNumber} from "@/lib/numberFormat";

// Наружный диаметр, стенка, длина в метрах, цена за тонну и наличие.
const offers = [
  [57, 3.5, 6, 89590, true],
  [76, 3.5, 6, 118860, true],
  [89, 3.5, 6, 96000, true],
  [108, 3.5, 6, 117140, true],
  [133, 4.5, 6, 108203, true],
  [159, 4.5, 6, 93600, true],
  [219, 6, 12, 137529, false],
] as const;

export const galvanizedElectroweldedProducts: ProductVariantSource[] = offers.map(
  ([diameterMm, wallThicknessMm, lengthMeters, pricePerTon, inStock]) => {
    const diameter = formatNumber(diameterMm);
    const wall = formatNumber(wallThicknessMm);
    const size = `${diameter} × ${wall}`;
    const key = `${diameterMm}x${wall.replace(",", "-")}-${lengthMeters}m`;
    const weightPerMeterKg = electroweldedPipeMass(diameterMm, wallThicknessMm);
    if (weightPerMeterKg === undefined) {
      throw new Error(`Нет теоретической массы по ${electroweldedPipeAssortmentStandard} для трубы ${size} мм.`);
    }
    const mass = formatMassPerMeter(weightPerMeterKg);

    return {
      sku: "",
      id: `electrowelded-galvanized-${key}`,
      categoryId: "cat-trk",
      subcategoryId: "cat-trk-sub-4",
      name: `Труба электросварная оцинкованная ${size}, ${lengthMeters} м`,
      slug: `truba-elektrosvarnaya-otsinkovannaya-${key}`,
      shortDescription: `Наружный диаметр ${diameter} мм, стенка ${wall} мм, длина ${lengthMeters} м.`,
      description: `Оцинкованная стальная прямошовная труба ${size} мм длиной ${lengthMeters} м. Сортамент по ${electroweldedPipeAssortmentStandard}. Теоретическая масса стальной трубы составляет ${mass} кг/м без учёта цинкового покрытия.`,
      price: pricePerTon,
      pricePerTon,
      priceUnit: "за тонну",
      availability: inStock ? "IN_STOCK" : "ON_ORDER",
      inStock,
      featured: false,
      imageUrls: [],
      coatingType: "galvanized",
      steelGrade: "Ст3",
      diameterMm,
      wallThicknessMm,
      lengthMeters,
      weightPerMeterKg,
      weightConfirmed: true,
      attributes: [
        {key: "standard", label: "Стандарт", value: electroweldedPipeStandard},
        {key: "size", label: "Наружный Ø × стенка, мм", value: size},
        {key: "length", label: "Длина по каталогу, м", value: String(lengthMeters)},
      ],
      specifications: [
        {name: "Наружный диаметр, мм", value: diameter},
        {name: "Толщина стенки, мм", value: wall},
        {name: "Длина по каталогу", value: `${lengthMeters} м`},
        {name: "Покрытие", value: "Цинковое"},
        {name: "Теоретическая масса без цинкового покрытия", value: `${mass} кг/м`},
        {name: "Сортамент по каталогу", value: electroweldedPipeAssortmentStandard},
        {name: "Технические условия по каталогу", value: electroweldedPipeTechnicalStandard},
      ],
    };
  },
);
