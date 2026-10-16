import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {subcategories} = readProjectData('data/subcategories.ts', cache);
const {categories} = readProjectData('data/categories.ts', cache);
const {createCartLines} = readProjectData('lib/cart.ts', cache);
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts', cache);
const mappings = JSON.parse(fs.readFileSync('data/catalog-images.json', 'utf8'));
const profnastil = productVariants.filter(product => product.profileMark);

const expected = [
  ['С8', 0.3, '3005', 'вишня', 'painted', '1,2×2', 800],
  ['С8', 0.3, '6005', 'зелёный', 'painted', '1,2×2', 800],
  ['С8', 0.3, '8017', 'коричневый', 'painted', '1,2×2', 800],
  ['С8', 0.3, undefined, undefined, 'galvanized', '1,2×2', 780],
  ['С8', 0.3, '7024', 'серый', 'painted', '1,2×2', 800],
  ['С8', 0.45, '6005', 'зелёный', 'painted', '1,2×2', 1200],
  ['С8', 0.45, '8017', 'коричневый', 'painted', '1,2×2', 1200],
  ['С8', 0.45, '7024', 'серый', 'painted', '1,2×2', 1200],
  ['С20', 0.3, '3005', 'вишня', 'painted', '1,15×2', 800],
  ['С20', 0.3, '6005', 'зелёный', 'painted', '1,15×2', 800],
  ['С20', 0.3, '8017', 'коричневый', 'painted', '1,15×2', 800],
  ['С20', 0.3, undefined, undefined, 'galvanized', '1,15×2', 800],
  ['С20', 0.45, '7024', 'серый', 'painted', '1,15×2', 1200],
  ['С20', 0.45, '6005', 'зелёный', 'painted', '1,15×2', 1200],
  ['С20', 0.45, '8017', 'коричневый', 'painted', '1,15×2', 1200],
  ['Н75', 0.5, undefined, undefined, 'galvanized', '0,75×6', 4300],
  ['Н75', 0.7, undefined, undefined, 'galvanized', '0,75×6', 5100],
];

test('the three profile-sheet subcategories contain exactly 17 requested rows', () => {
  const roundPipeIndex = categories.findIndex(item => item.id === 'cat-trk');
  assert.equal(categories[roundPipeIndex + 1].id, 'cat-pnf');
  assert.equal(categories[roundPipeIndex + 1].name, 'Профнастил');
  assert.equal(categories[roundPipeIndex + 1].slug, 'profnastil');
  assert.deepEqual(
    Array.from(subcategories.filter(item => item.categoryId === 'cat-pnf'),
      item => Array.of(item.id, item.name, item.slug)),
    [
      ['cat-pnf-sub-1', 'Профнастил С8', 'profnastil-s8'],
      ['cat-pnf-sub-2', 'Профнастил С20', 'profnastil-s20'],
      ['cat-pnf-sub-3', 'Профнастил Н75', 'profnastil-n75'],
    ],
  );
  assert.equal(subcategories.some(item => item.categoryId === 'cat-lis' && item.slug.startsWith('profnastil-')), false);
  assert.equal(profnastil.length, 17);
  assert.deepEqual(
    ['С8', 'С20', 'Н75'].map(mark => [mark, profnastil.filter(product => product.profileMark === mark).length]),
    [['С8', 8], ['С20', 7], ['Н75', 2]],
  );
});

test('the profile-sheet category uses the supplied guidance and hides only its page-header image', () => {
  const category = categories.find(item => item.id === 'cat-pnf');
  assert.equal(category.descriptionSections.intro,
    'Профнастил — профилированные стальные листы для кровли, заборов, облицовки фасадов и хозяйственных построек. Применяется при строительстве частных домов, дач, гаражей и навесов. В ассортименте представлены профили С8, С20 и Н75 с оцинкованным или окрашенным покрытием.');
  assert.equal(category.descriptionSections.title, 'Как выбрать профнастил');
  assert.equal(category.descriptionSections.details,
    'При выборе профнастила учитывают толщину стали, полезную ширину и длину листа, тип покрытия и условия эксплуатации. Для кровли дополнительно важны уклон, шаг обрешётки, снеговая и ветровая нагрузки.\n\nОсновной стандарт для соответствующих профилированных стальных листов — **ГОСТ 24045-2016**. Характеристики конкретных изделий уточняйте в каталоге.');
  assert.equal(`${category.descriptionSections.intro}\n\n${category.descriptionSections.details}`, category.description);
  assert.deepEqual(
    Array.from(subcategories.filter(item => item.categoryId === 'cat-pnf'), item => item.shortDescription),
    [
      'Стеновой профиль с высотой волны 8 мм. Подходит для заборов, облицовки фасадов и обшивки хозяйственных построек.',
      'Универсальный профиль для заборов, фасадов и кровли частных домов, гаражей и навесов. Жёстче С8, подходит для кровли при правильном выборе толщины и шага обрешётки.',
      'Несущий профиль высотой 75 мм для кровельных настилов и конструкций с повышенными нагрузками. Применяется с учётом расчётных пролётов и нагрузок.',
    ],
  );
  assert.deepEqual(
    Array.from(subcategories.filter(item => item.categoryId === 'cat-pnf'), item => item.description),
    [
      'Стеновой профнастил для заборов, облицовки фасадов и обшивки хозяйственных построек. Небольшая высота профиля обеспечивает аккуратный внешний вид, но ограничивает жёсткость листа. При выборе учитывают толщину стали, размеры листа и тип покрытия.',
      'Универсальный профнастил для заборов, фасадов, кровли частных домов, гаражей и навесов. Обладает большей жёсткостью по сравнению с С8. При выборе для кровли учитывают толщину стали, уклон крыши, шаг обрешётки и снеговые нагрузки.',
      'Несущий профнастил для кровельных настилов, перекрытий и конструкций с повышенными нагрузками. Высота профиля 75 мм обеспечивает высокую жёсткость листа. Толщину стали и допустимый пролёт выбирают по расчётным нагрузкам.',
    ],
  );
  const categoryPage = fs.readFileSync('app/catalog/[categorySlug]/page.tsx', 'utf8');
  assert.match(categoryPage, /category\.id !== "cat-pnf"/);
  assert.ok(categoryPage.indexOf('description={introDescription}') < categoryPage.indexOf('<ProductTypeResults'));
  assert.ok(categoryPage.indexOf('<ProductTypeResults') < categoryPage.indexOf('description={detailedDescription}'));
  assert.match(categoryPage, /category\.descriptionSections\?\.title/);
  assert.match(categoryPage, /mt-12 max-w-\[800px\]/);
  assert.match(categoryPage, /text-2xl font-bold/);
  assert.match(categoryPage, /variant="categoryDetails"/);
  const descriptionComponent = fs.readFileSync('components/catalog/CatalogDescription.tsx', 'utf8');
  assert.match(descriptionComponent, /list-disc/);
  assert.match(descriptionComponent, /part\.slice\(2, -2\)/);
  assert.match(descriptionComponent, /max-w-\[80ch\]/);
  assert.match(descriptionComponent, /max-w-\[800px\] space-y-4 text-base font-normal leading-\[1\.6\]/);
  assert.match(descriptionComponent, /variant === "category" \|\| variant === "categoryDetails" \? \[block\] : paragraphs\(block\)/);
  const productTypeCard = fs.readFileSync('components/catalog/ProductTypeCard.tsx', 'utf8');
  assert.match(productTypeCard, /standard !== "Уточняется"/);
  assert.match(productTypeCard, /<div className="flex-1">/);
  assert.match(productTypeCard, /mt-5 border-t border-slate-100 pt-5/);
});

test('profile, thickness, coating, size and exact per-piece price match the supplied matrix', () => {
  assert.deepEqual(
    Array.from(profnastil, product => Array.of(product.profileMark, product.wallThicknessMm, product.ralCode,
      product.colorName, product.coatingType, product.sheetSizeMeters, product.price)),
    expected,
  );
  for (const product of profnastil) {
    assert.equal(product.categoryId, 'cat-pnf');
    assert.equal(product.unit, 'piece');
    assert.equal(product.priceUnit, 'за штуку');
    assert.equal(product.priceQualifier, 'exact');
    assert.equal(product.quoteOnly, undefined);
    assert.equal(product.availability, 'UNKNOWN');
    assert.equal(product.inStock, false);
    assert.equal(product.steelGrade, undefined);
    assert.equal(product.standard, '');
    assert.equal(product.weight, undefined);
    assert.equal(product.specifications.find(item => item.name === 'Единица продажи')?.value, 'Штука');
  }
});

test('full names follow the requested colored and galvanized formats', () => {
  for (const product of profnastil) {
    const thickness = String(product.wallThicknessMm).replace('.', ',');
    const expectedName = product.coatingType === 'galvanized'
      ? `Профнастил ${product.profileMark} оцинкованный, ${thickness} мм, ${product.sheetSizeMeters} м`
      : `Профнастил ${product.profileMark}, ${thickness} мм, RAL ${product.ralCode} (${product.colorName}), ${product.sheetSizeMeters} м`;
    assert.equal(product.name, expectedName);
  }
});

test('profile-sheet identities and matching tuples are unique', () => {
  assert.equal(new Set(profnastil.map(product => product.id)).size, 17);
  assert.equal(new Set(profnastil.map(product => product.sku)).size, 17);
  assert.equal(new Set(profnastil.map(product => product.slug)).size, 17);
  assert.equal(new Set(profnastil.map(product => [product.profileMark, product.wallThicknessMm,
    product.ralCode ?? 'galvanized', product.sheetSizeMeters].join('|'))).size, 17);
});

test('quantity and current per-piece price are revalidated in the cart', () => {
  const product = profnastil.find(item => item.id === 'profnastil-c8-03-ral-3005');
  const [line] = createCartLines([{productId: product.id, quantity: 5}]);
  assert.equal(line.quantity, 5);
  assert.equal(line.quantityUnit, 'шт.');
  assert.equal(line.price, 800);
  assert.equal(line.estimatedTotal, 4000);
  assert.equal(line.wholeQuantity, true);
  assert.equal(line.invalidReason, undefined);
  assert.match(revalidateCartPrice(product, {quantity: 1.5}).invalidReason, /целое количество листов/);
});

test('the responsive catalog table exposes exactly the requested columns and whole-number input', () => {
  const source = fs.readFileSync('components/catalog/ProfileSheetVariantCatalog.tsx', 'utf8');
  for (const label of ['Толщина, мм', 'Цвет / покрытие', 'Размер листа, м', 'Цена, ₽/шт.',
    'Количество, шт.', 'Сумма', 'В корзину']) assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /inputMode="numeric"/);
  assert.match(source, /step=\{1\}/);
  assert.match(source, /Number\.isInteger\(quantity\)/);
});

test('each profile family and product uses its existing matching image asset', () => {
  const images = {С8: 'profnastil_c8.jpg', С20: 'profnastil_c20.jpg', Н75: 'profnastil_h75.jpg'};
  for (const product of profnastil) assert.match(mappings.products[product.id], new RegExp(`${images[product.profileMark]}$`));
  for (const [id, mark] of [['type-cat-pnf-sub-1', 'С8'], ['type-cat-pnf-sub-2', 'С20'], ['type-cat-pnf-sub-3', 'Н75']]) {
    assert.match(mappings.types[id], new RegExp(`${images[mark]}$`));
  }
});
