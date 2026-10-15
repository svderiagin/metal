import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {getProductTypeSummary} = readProjectData('lib/productTypeSummary.ts', cache);
const catalog = readProjectData('lib/catalog.ts', cache);
const {originalSubcategories} = readProjectData('data/subcategories.ts', cache);
const types = catalog.getProductTypesByCategoryId('cat-arm');
const products = catalog.getAllProductVariants();
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const imported = read('data/imported-catalog.json');
const overrides = read('imports/overrides.json');
const expected = [
  ['cat-arm-sub-1', 'Сталь; марка уточняется', 'ГОСТ 34028-2016', 49500],
  ['cat-arm-sub-2', 'Низколегированная сталь 35ГС', 'ГОСТ 5781-82', 50000],
  ['cat-arm-sub-3', 'Низколегированная сталь 25Г2С', 'ГОСТ 5781-82', 51300],
  ['cat-arm-sub-4', 'Сталь; марка уточняется', 'ГОСТ 5781-82 или ГОСТ 34028-2016', 45000],
];

test('all four rebar cards use category guidance and real family prices without guessing batch properties', () => {
  for (const [id, material, standard, price] of expected) {
    const type = types.find(type => type.subcategoryId === id);
    const summary = getProductTypeSummary(type, products);
    assert.equal(summary.material, material);
    assert.equal(summary.standard, standard);
    assert.equal(summary.standardLabel, 'ГОСТ класса');
    assert.equal(summary.minimumPrice, price);
    assert.equal(summary.priceUnit, price === null ? '' : 'за тонну');
    assert.doesNotMatch(summary.standard, /8509|10704|19903/);
    assert.doesNotMatch(summary.material, /3сп|Углеродистая/);
    for (const source of [originalSubcategories.find(f => f.id === id), imported.families.find(f => f.id === id), overrides.families[id]]) {
      assert.equal(source.materialDescription, material);
      assert.equal(source.referenceStandard, standard);
      assert.equal(source.shortDescription, type.shortDescription);
    }
  }
  const demos = products.filter(p => p.demo);
  assert.deepEqual(Array.from(demos, p => p.sku), ['MS-0003','MS-0004','MS-0005','MS-0006','MS-0007','MS-0008']);
  assert.ok(demos.every(p => /демонстрационн/.test(p.description)));
  assert.ok(products.some(p => p.id === 'local-80044' && p.standard === 'ГОСТ 34028'), 'actual supplier standard is preserved');
});

test('card prices reject demo, archived, foreign, quote-only, invalid and incompatible units', () => {
  const type = types[0];
  const valid = products.find(p => p.productTypeId === type.id && p.price);
  const cheap = {...valid, price:1};
  const excluded = [
    {...cheap, demo:true}, {...cheap, id:'prd-071'}, {...cheap, sku:'MS-0072'},
    {...cheap, productTypeId:types[2].id}, {...cheap, subcategoryId:'wrong'}, {...cheap, categoryId:'wrong'},
    {...cheap, quoteOnly:true}, {...cheap, priceQualifier:'from'},
    {...cheap, price:NaN}, {...cheap, price:Infinity}, {...cheap, price:0}, {...cheap, price:-1}, {...cheap, price:null},
  ];
  assert.equal(getProductTypeSummary(type, [valid, ...excluded]).minimumPrice, valid.price);
  for (const unit of ['meter', 'piece', 'kg']) {
    assert.equal(getProductTypeSummary(type, [valid, {...valid, unit}]).minimumPrice, null, unit);
  }
  assert.equal(getProductTypeSummary(type, [valid, {...valid, priceUnit:'за метр'}]).minimumPrice, null);
  assert.equal(getProductTypeSummary(type, []).minimumPrice, null);
  assert.equal(getProductTypeSummary(type, [{...cheap, demo:true, priceConfirmed:true}]).minimumPrice, 1);
});

test('owner-approved 35GS offers are in stock at 50000 per tonne without certifying their original demo facts', () => {
  const type = types.find(t => t.subcategoryId === 'cat-arm-sub-2');
  const rows = products.filter(p => p.productTypeId === type.id);
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.price, 50000);
    assert.equal(row.pricePerTon, 50000);
    assert.equal(row.unit, 'ton');
    assert.equal(row.priceUnit, 'за тонну');
    assert.equal(row.inStock, true);
    assert.equal(row.availability, 'IN_STOCK');
    assert.equal(row.demo, true);
    assert.equal(row.priceConfirmed, true);
  }
  assert.equal(getProductTypeSummary(type, rows).minimumPrice, 50000);
  const unconfirmed = rows.map(p => ({...p, priceConfirmed:false}));
  assert.equal(getProductTypeSummary(type, unconfirmed).minimumPrice, null);
});

test('minimum is taken from the supplied filtered subset; other categories keep their material and standard', () => {
  const type = types[2];
  const row = products.find(p => p.id === 'local-80044');
  assert.equal(getProductTypeSummary(type, [row]).minimumPrice, 69750);
  const otherType = catalog.getAllProductTypes().find(t => t.subcategoryId === 'cat-trp-sub-1');
  const rows = products.filter(p => p.productTypeId === otherType.id);
  const summary = getProductTypeSummary(otherType, rows);
  for (const [key, field] of [['material','material'], ['standard','standard']]) {
    const expectedValues = [...new Set(rows.flatMap(p => p.attributes.filter(a => a.key === key).map(a => a.value)))].join(', ');
    assert.equal(summary[field], expectedValues);
  }
  assert.equal(summary.standardLabel, 'Стандарт');
  assert.equal(summary.minimumPrice, Math.min(...rows.map(p => p.price)));
});

test('isolated re-import preserves card guidance for imported and local-only families and leaves supplier facts and prices unchanged', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'metal-rebar-cards-'));
  try {
    for (const folder of ['data', 'lib', 'imports']) fs.cpSync(folder, path.join(temporary, folder), {recursive:true});
    // In particular 35GS has no imported products: its override must still be applied.
    const localSource = path.join(temporary, 'data/subcategories.ts');
    const offerSource = path.join(temporary, 'data/products/armatura.ts');
    const ownerOffers = fs.readFileSync(offerSource, 'utf8');
    fs.writeFileSync(localSource, fs.readFileSync(localSource, 'utf8').replaceAll('Низколегированная сталь 35ГС', 'stale local material'));
    execFileSync(process.execPath, [path.resolve('scripts/import-catalog.mjs')], {cwd:temporary, stdio:'pipe'});
    assert.equal(fs.readFileSync(offerSource, 'utf8'), ownerOffers, 'import must retain owner-approved local prices');
    const regenerated = read(path.join(temporary, 'data/imported-catalog.json'));
    for (const [id, material, standard] of expected) {
      const family = regenerated.families.find(f => f.id === id);
      assert.equal(family.materialDescription, material);
      assert.equal(family.referenceStandard, standard);
      assert.equal(family.shortDescription, overrides.families[id].shortDescription);
      assert.equal(family.description, imported.families.find(f => f.id === id).description);
    }
    assert.equal(JSON.stringify(regenerated.products), JSON.stringify(imported.products));
    assert.equal(JSON.stringify(regenerated.matchedIds), JSON.stringify(imported.matchedIds));
    assert.equal(JSON.stringify(read('data/imported-catalog.json')), JSON.stringify(imported));
  } finally { fs.rmSync(temporary, {recursive:true, force:true}); }
});
