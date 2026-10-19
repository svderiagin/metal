import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readProjectData} from './project-data.mjs';

const catalog = readProjectData('lib/catalog.ts');
const {getChannelProductDescription} = readProjectData('lib/channelDescription.ts');
const category = catalog.getCategoryBySlug('shveller');
const products = catalog.getProductVariantsByCategoryId(category.id);
const rawCatalog = JSON.parse(fs.readFileSync('data/rozmet-catalog.json', 'utf8'));
const verified = JSON.parse(fs.readFileSync('imports/shveller-specifications.verified.json', 'utf8'));
const supplier = JSON.parse(fs.readFileSync('imports/shveller-specifications.source.json', 'utf8'));
const jsx = (type, props) => ({type, props});
const imports = {
  'next/navigation': {
    notFound() {throw new Error('not-found');},
    redirect(url) {throw new Error(`redirect:${url}`);},
  },
  react: {Suspense: 'suspense'},
  'react/jsx-runtime': {jsx, jsxs: jsx},
  '@/lib/catalog': catalog,
  '@/lib/channelDescription': {getChannelProductDescription},
};
for (const name of ['Breadcrumbs', 'CatalogSidebar', 'CatalogDescription', 'CatalogProductDetail', 'ProductTypeResults']) {
  imports[`@/components/catalog/${name}`] = {[name]: name};
}
imports['@/components/layout/PageContainer'] = {PageContainer: 'PageContainer'};
const routeModule = {exports: {}};
const source = ts.transpileModule(fs.readFileSync('app/catalog/[categorySlug]/[subcategorySlug]/page.tsx', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX},
}).outputText;
vm.runInNewContext(source, {
  module: routeModule, exports: routeModule.exports,
  require(name) {assert.ok(name in imports, name); return imports[name];},
});
const route = routeModule.exports;
const props = (categorySlug, subcategorySlug) => ({params: Promise.resolve({categorySlug, subcategorySlug})});

test('all 14 channel products have unique prerendered detail pages and product metadata', async () => {
  assert.equal(products.length, 14);
  assert.equal(new Set(products.map(product => product.slug)).size, 14);
  const paths = route.generateStaticParams();
  for (const product of products) {
    assert.ok(paths.some(path => path.categorySlug === 'shveller' && path.subcategorySlug === product.slug));
    assert.ok(product.imageUrls.length && product.description);
    const page = await route.default(props('shveller', product.slug));
    assert.equal(page.type, 'CatalogProductDetail');
    assert.equal(page.props.variant, product);
    assert.equal(page.props.category, category);
    assert.equal((await route.generateMetadata(props('shveller', product.slug))).title, product.name);
  }
});

test('unknown products and products under the wrong category return not found', async () => {
  await assert.rejects(route.default(props('shveller', 'missing-product')), /not-found/);
  const other = catalog.getAllProductVariants().find(product => product.categoryId !== category.id);
  await assert.rejects(route.default(props('shveller', other.slug)), /not-found/);
  await assert.rejects(route.default(props('missing-category', products[0].slug)), /not-found/);
});

test('other direct categories keep their existing redirects to product rows', async () => {
  const otherCategory = catalog.getCategoryBySlug('ugolok');
  const product = catalog.getProductVariantsByCategoryId(otherCategory.id)[0];
  await assert.rejects(route.default(props('ugolok', product.slug)), {
    message: `redirect:/catalog/ugolok#variant-${product.id}`,
  });
});

test('channel descriptions share concise guidance and use only each product’s explicit parameters', () => {
  const baseline = JSON.stringify(products);
  for (const product of products) {
    const description = getChannelProductDescription(product);
    assert.ok(description.length < 700, product.name);
    assert.match(description, /Для несущих элементов сечение подбирают расчётом\./);
    assert.doesNotMatch(description, /Розмет|РОЗМЕТ|высококачествен|привлекательн|грандиозн|ГОСТ/);
  }
  const five = products.find(product => product.name === 'Швеллер № 5');
  assert.match(getChannelProductDescription(five), /высота — 50 мм; ширина полки — 32 мм; толщина стенки — 4,4 мм/);
  assert.match(getChannelProductDescription(five), /длина по каталогу — 11,7 м; теоретическая масса 1 м — 4,84 кг\/м/);
  assert.doesNotMatch(getChannelProductDescription({...five, specifications: []}), /Параметры:/);
  const ten = products.find(product => product.name === 'Швеллер № 10');
  assert.match(getChannelProductDescription(ten), /высота — 100 мм; ширина полки — 46 мм/);
  assert.match(getChannelProductDescription(ten), /длина по каталогу — 12 м; теоретическая масса 1 м — 8,59 кг\/м/);
  const sixteen = products.find(product => product.name === 'Швеллер № 16');
  assert.match(getChannelProductDescription(sixteen), /длина по каталогу — 11,7–12 м/);
  assert.equal(JSON.stringify(products), baseline);
  const other = catalog.getAllProductVariants().find(product => product.categoryId !== category.id);
  assert.equal(getChannelProductDescription(other), other.description || other.shortDescription);
});

test('all channel specifications match the verified standard and supplier length without changing commercial data', () => {
  assert.equal(verified.rows.length, 14);
  assert.equal(supplier.products.length, 14);
  const format = value => String(value).replace('.', ',');
  const commercialData = product => JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(product).filter(([key]) => !['specifications', 'imageUrls'].includes(key)))));
  for (const product of products) {
    const original = rawCatalog.products.find(item => item.id === product.id);
    assert.deepEqual(commercialData(product), commercialData(original), product.id);
    const number = product.name.match(/№\s*(\d+(?:[.,]\d+)?)/)[1].replace(/[.,]/g, '-');
    assert.deepEqual([...product.imageUrls], [`/images/catalog/shveller/shveller-${number}-clean.webp`], product.id);
    const row = verified.rows.find(item => item.number === product.name.replace(/^Швеллер\s*№\s*/, '').replace('.', ','));
    assert.ok(row, product.name);
    const source = supplier.products.find(item => item.id === product.id);
    assert.equal(source.url, product.sourceReference);
    const length = source.tabSpecifications.find(item => item.name === 'Длина')
      || source.tabSpecifications.find(item => item.name === 'Размер');
    const expected = [
      ['Высота', `${format(row.h)} мм`],
      ['Ширина полки', `${format(row.b)} мм`],
      ['Толщина стенки', `${format(row.s)} мм`],
      ['Толщина полки', `${format(row.t)} мм`],
      ['Теоретическая масса', `${row.massKgPerMeter.toFixed(2).replace('.', ',')} кг/м`],
      ['Длина по каталогу', length.value.replace(/(\d)\.(?=\d)/g, '$1,').replace(/(\d)\s*-\s*(?=\d)/g, '$1–')],
    ];
    for (const [name, value] of expected) {
      assert.deepEqual(JSON.parse(JSON.stringify(product.specifications.filter(item => item.name === name))), [{name, value}], `${product.id}: ${name}`);
    }
    assert.ok(!product.specifications.some(item => ['Размер', 'Вес', 'Ширина', 'Толщина', 'Длина'].includes(item.name)), product.id);
  }
  const six = products.find(item => item.name === 'Швеллер № 6.5');
  assert.equal(six.specifications.find(item => item.name === 'Теоретическая масса').value, '5,90 кг/м');
});

test('verification overlay leaves every other imported product unchanged', () => {
  for (const original of rawCatalog.products.filter(item => item.categoryId !== category.id)) {
    const actual = catalog.getAllProductVariants().find(item => item.id === original.id);
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), original, original.id);
  }
});
