import type {ProductVariantSource} from "@/types/product";
import {formatMassPerMeter, formatNumber} from "@/lib/numberFormat";

const standard = "ГОСТ 3262-75";
const lengthMeters = 6;
// Обыкновенные трубы: Ду, наружный диаметр, стенка, масса без покрытия по ГОСТ и цена за тонну.
const offers = [
  [15, 21.3, 2.8, 1.28, 121100],
  [20, 26.8, 2.8, 1.66, 101700],
  [25, 33.5, 3.2, 2.39, 99700],
  [32, 42.3, 3.2, 3.09, 99100],
  [40, 48, 3.5, 3.84, 97500],
  [50, 60, 3.5, 4.88, 114150],
] as const;

export const galvanizedVgpProducts: ProductVariantSource[] = offers.map(
  ([nominalBoreMm, diameterMm, wallThicknessMm, uncoatedMassKgPerMeter, pricePerTon]) => {
    const wall = formatNumber(wallThicknessMm);
    const outsideDiameter = formatNumber(diameterMm);
    const size = `${nominalBoreMm}×${wall}`;
    const key = `${nominalBoreMm}x${wall.replace(",", "-")}-${lengthMeters}m`;
    // Примечание 2 к таблице 1 ГОСТ 3262-75 учитывает покрытие прибавкой 3%.
    const weightPerMeterKg = Number((uncoatedMassKgPerMeter * 1.03).toFixed(4));

    return {
      id: `vgp-galvanized-${key}`,
      categoryId: "cat-trk",
      subcategoryId: "cat-trk-sub-3",
      name: `Труба ВГП оцинкованная Ду${size}×${lengthMeters * 1000}`,
      slug: `truba-vgp-otsinkovannaya-du${key}`,
      shortDescription: `Оцинкованная ВГП-труба Ду${nominalBoreMm} со стенкой ${wall} мм, наружным диаметром ${outsideDiameter} мм и длиной ${lengthMeters} м.`,
      description: `Обыкновенная стальная труба с цинковым покрытием по ${standard}. Теоретическая масса учитывает цинковое покрытие.`,
      price: pricePerTon,
      pricePerTon,
      priceUnit: "за тонну",
      availability: "IN_STOCK",
      inStock: true,
      featured: false,
      imageUrls: [],
      coatingType: "galvanized",
      nominalBoreMm,
      diameterMm,
      wallThicknessMm,
      lengthMeters,
      weightPerMeterKg,
      weightConfirmed: true,
      attributes: [
        {key: "standard", label: "Стандарт", value: standard},
        {key: "size", label: "Ду × стенка, мм", value: size},
        {key: "length", label: "Длина по каталогу, м", value: String(lengthMeters)},
      ],
      specifications: [
        {name: "Условный проход (Ду)", value: String(nominalBoreMm)},
        {name: "Наружный диаметр, мм", value: outsideDiameter},
        {name: "Толщина стенки, мм", value: wall},
        {name: "Серия по толщине стенки", value: "Обыкновенная"},
        {name: "Покрытие", value: "Цинковое"},
        {name: "Теоретическая масса", value: `${formatMassPerMeter(weightPerMeterKg)} кг/м`},
        {name: "Длина по каталогу", value: `${lengthMeters} м`},
        {name: "Стандарт", value: standard},
      ],
    };
  },
);
