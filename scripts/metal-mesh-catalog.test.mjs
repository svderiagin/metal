import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {categories} = readProjectData('data/categories.ts', cache);
const {subcategories} = readProjectData('data/subcategories.ts', cache);
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {createCartLines} = readProjectData('lib/cart.ts', cache);
const images = JSON.parse(fs.readFileSync('data/catalog-images.json', 'utf8'));
const mesh = productVariants.filter(product => product.categoryId === 'cat-mesh');

const expected = [
  ['2249', 1100, 'за рулон'], ['2250', 1300, 'за рулон'], ['2251', 1350, 'за рулон'],
  ['2252', 2650, 'за рулон'], ['2253', 2850, 'за рулон'], ['2254', 3100, 'за рулон'],
  ['2255', 1950, 'за рулон'], ['21517', 205, 'за погонный метр'], ['2264', 190, 'за погонный метр'],
  ['2267', 1650, 'за рулон'], ['28997', 750, 'за рулон'], ['2271', 1300, 'за рулон'],
  ['2272', 1200, 'за рулон'], ['2260', 90, 'за погонный метр'], ['2263', 90, 'за погонный метр'],
  ['2266', 1750, 'за рулон'], ['2265', 1650, 'за рулон'], ['20179', 3600, 'за рулон'],
  ['2262', 5300, 'за рулон'], ['2259', 5790, 'за рулон'], ['20182', 700, 'за рулон'],
  ['28918', 875, 'за рулон'], ['20209', 1200, 'за рулон'], ['20210', 1700, 'за рулон'],
  ['26578', 3700, 'за рулон'], ['2270', 1900, 'за рулон'], ['2261', 3900, 'за рулон'],
  ['20180', 5250, 'за рулон'], ['20181', 4850, 'за рулон'], ['2273', 140, 'за штуку'],
  ['2274', 260, 'за штуку'], ['2276', 235, 'за штуку'], ['2275', 490, 'за штуку'],
  ['20183', 470, 'за штуку'], ['29073', 600, 'за штуку'], ['29074', 850, 'за штуку'],
  ['29075', 1390, 'за штуку'], ['29076', 890, 'за штуку'],
];

test('metal mesh is a standalone category with the three source groups', () => {
  const profileSheetIndex = categories.findIndex(category => category.id === 'cat-pnf');
  assert.equal(categories[profileSheetIndex + 1].id, 'cat-mesh');
  assert.equal(categories[profileSheetIndex + 1].name, 'Сетка металлическая');
  assert.equal(categories[profileSheetIndex + 1].slug, 'setka-metallicheskaya');
  assert.deepEqual(
    Array.from(subcategories.filter(item => item.categoryId === 'cat-mesh'), item => [item.id, item.name, item.slug]),
    [
      ['cat-mesh-sub-1', 'Сетка рабица', 'setka-rabitsa'],
      ['cat-mesh-sub-2', 'Сетка сварная в рулонах', 'setka-svarnaya-v-rulonah'],
      ['cat-mesh-sub-3', 'Сетка сварная в картах', 'setka-svarnaya-v-kartah'],
    ],
  );
});

test('all 38 source positions retain their current prices and sales bases', () => {
  assert.equal(mesh.length, 38);
  assert.deepEqual(
    Array.from(mesh, product => [product.id.replace('mesh-', ''), product.price, product.priceUnit]),
    expected,
  );
  assert.deepEqual(
    ['cat-mesh-sub-1', 'cat-mesh-sub-2', 'cat-mesh-sub-3'].map(id => [id, mesh.filter(product => product.subcategoryId === id).length]),
    [['cat-mesh-sub-1', 7], ['cat-mesh-sub-2', 22], ['cat-mesh-sub-3', 9]],
  );
});

test('source identity, images and technical fields remain traceable', () => {
  assert.equal(new Set(mesh.map(product => product.id)).size, 38);
  assert.equal(new Set(mesh.map(product => product.sku)).size, 38);
  for (const product of mesh) {
    assert.equal(product.priceQualifier, 'exact');
    assert.equal(product.priceConfirmed, true);
    assert.equal(product.imported, true);
    assert.equal(product.availability, 'UNKNOWN');
    assert.equal(product.standard, '');
    assert.equal(product.steelGrade, undefined);
    assert.match(product.sourceReference, /^https:\/\/rozmet\.ru\/production\/rabitsa\//);
    assert.equal(product.sourceProductName, product.name);
    assert.ok(product.specifications.some(specification => specification.name === 'Тип'));
    assert.ok(product.specifications.some(specification => specification.name === 'Единица цены'));
    assert.ok(images.products[product.id]);
    assert.equal(product.imageUrls[0], images.products[product.id]);
  }
});

test('mesh dimensions and exact totals use the transferred data', () => {
  const chainLink = mesh.find(product => product.id === 'mesh-2249');
  assert.ok(chainLink.specifications.some(item => item.name === 'Размер ячейки' && item.value === '55×55 мм'));
  assert.ok(chainLink.specifications.some(item => item.name === 'Диаметр проволоки' && item.value === '1,6 мм'));
  assert.ok(chainLink.specifications.some(item => item.name === 'Размер рулона' && item.value === '1,5×10 м'));
  const rollLine = createCartLines([{productId: chainLink.id, quantity: 2}])[0];
  assert.equal(rollLine.quantityUnit, 'рул.');
  assert.equal(rollLine.estimatedTotal, 2200);

  const byMeter = mesh.find(product => product.id === 'mesh-21517');
  const meterLine = createCartLines([{productId: byMeter.id, quantity: 3}])[0];
  assert.equal(byMeter.unit, 'meter');
  assert.equal(meterLine.quantityUnit, 'м');
  assert.equal(meterLine.estimatedTotal, 615);
});

test('metal mesh uses its dedicated catalog table and quantity rules', () => {
  const catalogSource = fs.readFileSync('components/catalog/ProductVariantCatalog.tsx', 'utf8');
  const tableSource = fs.readFileSync('components/catalog/MetalMeshVariantCatalog.tsx', 'utf8');
  const cartSource = fs.readFileSync('lib/cart.ts', 'utf8');
  const pricingSource = fs.readFileSync('lib/cartPricing.ts', 'utf8');

  assert.match(catalogSource, /variants\.every\(isMetalMeshVariant\)/);
  for (const heading of ['Наименование', 'Ячейка / проволока', 'Рулон / карта', 'Цена', 'Количество', 'Сумма', 'В корзину']) {
    assert.ok(tableSource.includes(heading), `missing table heading: ${heading}`);
  }
  assert.match(tableSource, /inputMode=\{whole \? "numeric" : "decimal"\}/);
  assert.match(tableSource, /absolute inset-y-0 right-2/);
  assert.match(cartSource, /requiresWholeMetalMeshQuantity\(product\)/);
  assert.match(pricingSource, /Укажите целое количество рулонов/);
});
