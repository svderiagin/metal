import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {categories} = readProjectData('data/categories.ts', cache);
const {subcategories} = readProjectData('data/subcategories.ts', cache);
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {beamProfile} = readProjectData('lib/beam.ts', cache);
const {flatSteelDimensions} = readProjectData('lib/flatSteel.ts', cache);
const {getSheetParameters, getTreadPlatePattern} = readProjectData('lib/sheetPresentation.ts', cache);

const transliteration = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
const rebarClasses = {'cat-arm-sub-1': 'a500s', 'cat-arm-sub-2': 'a400-35gs', 'cat-arm-sub-3': 'a400-25g2s', 'cat-arm-sub-4': 'a240'};
const sheetKinds = {'galvanized-steel-sheet': 'otsinkovannyy', 'list-ocynkovannyj': 'kholodnokatanyy',
  'list-riflennyj': 'riflenyy', 'list-goryachekatanyj': 'goryachekatanyy'};
const meshKinds = {'setka-rabitsa': 'rabitsa', 'setka-svarnaya-v-rulonah': 'svarnaya-rulon', 'setka-svarnaya-v-kartah': 'svarnaya-karta'};

function filenameToken(value) {
  return String(value ?? '').toLowerCase().replace(/(?<=\d)\s*[х×]\s*(?=\d)/gu, 'x')
    .replace(/[а-яё]/gu, letter => transliteration[letter])
    .replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

const digits = value => String(value ?? '').match(/\d+(?:[.,]\d+)?/gu) ?? [];
const parts = (...values) => values.filter(Boolean).join('-');
const number = value => String(value).replace(/[.,]/gu, '-');
const unit = (value, suffix) => value ? `${number(value)}${suffix}` : '';
const section = (values, suffix) => values.length && values.every(Boolean) ? `${values.map(number).join('x')}${suffix}` : '';
const fact = (product, name) => product.specifications.find(item => item.name === name)?.value;
const length = product => unit(product.lengthMeters, 'm') || (product.lengthRangeMeters ? `l${product.lengthRangeMeters.map(number).join('-')}m` : '');
const grade = product => /^\d+$/u.test(product.steelGrade ?? '') ? `stal${product.steelGrade}` : filenameToken(product.steelGrade);

function measurementName(product, subcategory) {
  if (product.demo && product.categoryId !== 'cat-arm') return filenameToken(product.name);
  const slug = subcategory.slug;
  switch (product.categoryId) {
    case 'cat-arm': {
      const smooth = product.subcategoryId === 'cat-arm-sub-4';
      const productClass = product.attributes.find(item => item.key === 'class')?.value;
      const mark = smooth && /^(?:А240С?|А1)$/iu.test(productClass ?? '') ? filenameToken(productClass) : rebarClasses[product.subcategoryId];
      return parts('armatura', smooth ? 'gladkaya' : 'riflenaya', mark, unit(product.diameterMm ?? digits(product.name.match(/\d+(?:[,.]\d+)?\s*мм/u)?.[0])[0], 'mm'),
        product.form === 'coil' ? 'bunt' : product.form === 'bar' ? 'prutok' : '', length(product));
    }
    case 'cat-trk': {
      const galvanized = slug.endsWith('-otsinkovannaya');
      if (slug.includes('vodogazoprovodnaya')) {
        const bore = product.nominalBoreMm ?? digits(fact(product, 'Условный проход (Ду)'))[0];
        const size = section([bore, product.wallThicknessMm ?? digits(fact(product, 'Толщина стенки, мм'))[0]], 'mm');
        return size ? parts('truba-vgp', galvanized && 'otsinkovannaya', `du${size}`, length(product)) : filenameToken(product.name);
      }
      return parts('truba-elektrosvarnaya', galvanized && 'otsinkovannaya', section([product.diameterMm, product.wallThicknessMm], 'mm'), length(product), galvanized ? '' : grade(product));
    }
    case 'cat-trp': {
      const size = section([product.profileWidthMm, product.profileHeightMm, product.wallThicknessMm ?? digits(fact(product, 'Стенка'))[0]], 'mm');
      return size ? parts(slug.includes('kvadratnaya') ? 'truba-kvadratnaya' : 'truba-pryamougolnaya', size, length(product), grade(product)) : filenameToken(product.name);
    }
    case 'cat-bal': {
      const profile = beamProfile(product);
      return profile ? parts('balka', filenameToken(profile), grade(product), length(product)) : filenameToken(product.name);
    }
    case 'cat-pnf': {
      const profile = (product.profileMark ?? '').replace('С', 'c').replace('Н', 'n');
      const size = digits(product.sheetSizeMeters).map(value => Math.round(Number(value.replace(',', '.')) * 1000));
      return parts('profnastil', profile, unit(product.wallThicknessMm, 'mm'), section(size, 'mm'),
        product.ralCode ? `ral${product.ralCode}` : product.coatingType === 'galvanized' && 'otsinkovannyy');
    }
    case 'cat-mesh': {
      const packageSize = fact(product, 'Размер рулона') ?? fact(product, 'Размер карты');
      const type = fact(product, 'Тип');
      const kind = product.unit === 'meter' ? filenameToken(type?.replace(/ сетка$/u, '')) : meshKinds[slug];
      return parts('setka', kind, section(digits(fact(product, 'Размер ячейки')), 'mm'),
        unit(digits(fact(product, 'Диаметр проволоки'))[0], 'mm'), section(digits(packageSize), 'm'), filenameToken(fact(product, 'Покрытие')));
    }
    case 'catalog-cat-shveller':
      return product.channelSeries
        ? parts('shveller', `${number(product.channelNumber)}${filenameToken(product.channelSeries)}`, grade(product), length(product))
        : parts('shveller', `n${number(digits(product.name)[0])}`, length(product));
    case 'catalog-cat-ugolok': {
      const dimensions = [...digits(fact(product, 'Размеры уголка')), ...digits(fact(product, 'Толщина полок уголка'))];
      return parts('ugolok-stalnoy', section(dimensions.length === 3 ? dimensions : digits(product.name).slice(0, 3), 'mm'), length(product));
    }
    case 'catalog-cat-kvadrat':
      return parts('kvadrat-stalnoy', section(digits(fact(product, 'Сечение')), 'mm'), length(product));
    case 'catalog-cat-polosa': {
      const dimensions = flatSteelDimensions(product);
      return dimensions ? parts('polosa-stalnaya', section([dimensions.width, dimensions.thickness], 'mm'), length(product)) : filenameToken(product.name);
    }
    case 'catalog-cat-listovoy-prokat': {
      const dimensions = getSheetParameters(product);
      const originalName = slug === 'list-riflennyj' || slug === 'list-goryachekatanyj' ? product.sourceProductName : undefined;
      const qualifier = (originalName ?? product.name).match(/\s(ТУ|ГОСТ|Ф)(?:\s+рифл[её]ный)?$/u)?.[1]
        ?? (originalName ? undefined : getTreadPlatePattern(product));
      return dimensions ? parts('list', sheetKinds[slug], section([dimensions.thickness, dimensions.width, dimensions.length], 'mm'), filenameToken(qualifier)) : filenameToken(product.name);
    }
    case 'catalog-cat-shtaketnik':
      return parts('shtaketnik', filenameToken(fact(product, 'Вид профиля штакетника')),
        section([digits(fact(product, 'Ширина'))[0], digits(fact(product, 'Толщина'))[0]], 'mm'),
        unit(digits(fact(product, 'Длина'))[0], 'm'),
        `ral${digits(fact(product, 'Код цвета'))[0] ?? ''}`, filenameToken(fact(product, 'Тип покраски')));
    default:
      return filenameToken(product.name);
  }
}

function measurementLocation(product) {
  const category = categories.find(item => item.id === product.categoryId);
  const subcategory = subcategories.find(item => item.id === product.subcategoryId);
  assert.ok(category && subcategory, `Missing catalog folder for ${product.id}`);
  const subfolder = subcategory.internal ? '' : `/${subcategory.slug}`;
  return `/images/catalog/${category.slug}${subfolder}/measurement/${measurementName(product, subcategory)}`;
}

const pathsById = new Map();
const allocated = new Set();
for (const product of productVariants) {
  const base = measurementLocation(product);
  const path = allocated.has(base) ? `${base}-${product.id}` : base;
  assert.ok(!allocated.has(path), `Conflicting artwork path for ${product.id}`);
  allocated.add(path);
  pathsById.set(product.id, path);
}

export function catalogMeasurementUrl(product, extension = 'webp') {
  return `${pathsById.get(product.id) ?? measurementLocation(product)}.${extension}`;
}
