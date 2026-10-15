import type {Category} from "@/types/category";
import importedCatalog from "./imported-catalog.json";
import catalogImages from "./catalog-images.json";

const originalCategories: Category[] = [
  {
    "id": "cat-arm",
    "name": "Арматура",
    "slug": "armatura",
    "shortDescription": "Стальная арматура для армирования фундаментов, перекрытий, колонн и других железобетонных конструкций.",
    "description": "Стальная арматура для армирования фундаментов, перекрытий, колонн и других железобетонных конструкций. Рифлёная арматура А500С и А400 применяется преимущественно для рабочего армирования, гладкая А240 — для хомутов и вспомогательных элементов каркасов. При выборе учитывают класс прочности, диаметр, длину и требования проекта.",
    "imageUrl": "/images/categories/armatura.svg"
  },
  {
    "id": "cat-trp",
    "name": "Трубы профильные",
    "slug": "truby-profilnye",
    "shortDescription": "Квадратные и прямоугольные профили",
    "description": "Квадратные и прямоугольные профили. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/truby-profilnye.svg"
  },
  {
    "id": "cat-trk",
    "name": "Труба круглая",
    "slug": "truba-kruglaya",
    "shortDescription": "Водогазопроводные и электросварные трубы, включая оцинкованные исполнения",
    "description": "Водогазопроводные и электросварные трубы круглого сечения. Выберите исполнение поверхности, диаметр, толщину стенки и длину. У водогазопроводных труб условный проход DN отличается от наружного диаметра.",
    "imageUrl": "/images/catalog/truby-vodogazoprovodnye.jpeg"
  },
  {
    "id": "cat-trs",
    "name": "Трубы стальные",
    "slug": "truby-stalnye",
    "shortDescription": "Круглые трубы для инженерных и строительных задач",
    "description": "Круглые трубы для инженерных и строительных задач. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/truby-stalnye.svg"
  },
  {
    "id": "cat-bal",
    "name": "Балка",
    "slug": "balka",
    "shortDescription": "Двутавровые балки для несущих конструкций",
    "description": "Двутавровые балки для несущих конструкций. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/balka.svg"
  },
  {
    "id": "cat-kat",
    "name": "Катанка",
    "slug": "katanka",
    "shortDescription": "Стальная катанка в бухтах",
    "description": "Стальная катанка в бухтах. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/katanka.svg"
  },
  {
    "id": "cat-kva",
    "name": "Квадрат",
    "slug": "kvadrat",
    "shortDescription": "Горячекатаный и калиброванный квадрат",
    "description": "Горячекатаный и калиброванный квадрат. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/kvadrat.svg"
  },
  {
    "id": "cat-kru",
    "name": "Круг",
    "slug": "krug",
    "shortDescription": "Круглый прокат различных марок",
    "description": "Круглый прокат различных марок. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/krug.svg"
  },
  {
    "id": "cat-lis",
    "name": "Листовой прокат",
    "slug": "listovoy-prokat",
    "shortDescription": "Стальные и цветные листы разных форматов",
    "description": "Стальные и цветные листы разных форматов. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/listovoy-prokat.svg"
  },
  {
    "id": "cat-otv",
    "name": "Отводы",
    "slug": "otvody",
    "shortDescription": "Соединительные детали трубопроводов",
    "description": "Соединительные детали трубопроводов. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/otvody.svg"
  },
  {
    "id": "cat-pol",
    "name": "Полоса",
    "slug": "polosa",
    "shortDescription": "Полосовой прокат для производства и монтажа",
    "description": "Полосовой прокат для производства и монтажа. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/polosa.svg"
  },
  {
    "id": "cat-pro",
    "name": "Проволока",
    "slug": "provoloka",
    "shortDescription": "Проволока общего и специального назначения",
    "description": "Проволока общего и специального назначения. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/provoloka.svg"
  },
  {
    "id": "cat-trn",
    "name": "Трубы нержавеющие",
    "slug": "truby-nerzhaveyushchie",
    "shortDescription": "Коррозионностойкие трубы для промышленности",
    "description": "Коррозионностойкие трубы для промышленности. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/truby-nerzhaveyushchie.svg"
  },
  {
    "id": "cat-ugo",
    "name": "Уголок",
    "slug": "ugolok",
    "shortDescription": "Равнополочные и неравнополочные профили",
    "description": "Равнополочные и неравнополочные профили. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/ugolok.svg"
  },
  {
    "id": "cat-shv",
    "name": "Швеллер",
    "slug": "shveller",
    "shortDescription": "Горячекатаный и гнутый П-образный профиль",
    "description": "Горячекатаный и гнутый П-образный профиль. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/shveller.svg"
  },
  {
    "id": "cat-she",
    "name": "Шестигранник",
    "slug": "shestigrannik",
    "shortDescription": "Шестигранный сортовой прокат",
    "description": "Шестигранный сортовой прокат. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/shestigrannik.svg"
  },
  {
    "id": "cat-cve",
    "name": "Цветной металлопрокат",
    "slug": "tsvetnoy-metalloprokat",
    "shortDescription": "Алюминий, медь и латунь",
    "description": "Алюминий, медь и латунь. Подберите подкатегорию и отфильтруйте позиции по материалу, стандарту, цене и наличию.",
    "imageUrl": "/images/categories/tsvetnoy-metalloprokat.svg"
  }
];

export const categories: Category[] = (importedCatalog.categories as Category[]).map(category => ({
  ...category,
  imageUrl: (catalogImages.categories as Record<string, string>)[category.id] ?? catalogImages.fallback,
}));
export {originalCategories};
