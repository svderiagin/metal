import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';

const {productVariants} = readProjectData('data/products/index.ts');
const {normalizeBeamVariant, beamProfile, beamSeries} = readProjectData('lib/beam.ts');
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts');
const {metersToTons, tonsToMeters, calculateLineTotal} = readProjectData('lib/orderMeasurement.ts');
const beams = productVariants.filter(p => p.categoryId === 'cat-bal');

test('confirmed 20B1 duplicate is removed while its replacement and B2 remain', () => {
  assert.equal(beams.find(p => p.id === 'local-65601'), undefined);
  const rows = beams.filter(p => beamProfile(p) === '20Б1');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'local-122248');
  assert.equal(rows[0].weightPerMeterKg, 21.3);
  assert.ok(beams.some(p => beamProfile(p) === '20Б2'));
  const overrides = JSON.parse(fs.readFileSync('imports/overrides.json', 'utf8'));
  assert.equal(overrides.excludedSourceIds['65601'].replacementProductId, rows[0].id);
});

test('removed demo beams are absent from source data and the published catalog', () => {
  const {balkaProducts} = readProjectData('data/products/balka.ts');
  for (const id of ['prd-009', 'prd-010', 'prd-011', 'prd-013', 'prd-014']) {
    assert.equal(balkaProducts.find(p => p.id === id), undefined);
    assert.equal(productVariants.find(p => p.id === id), undefined);
  }
});

test('explicitly excluded source records stay absent and their retained cards remain available', () => {
  const overrides = JSON.parse(fs.readFileSync('imports/overrides.json', 'utf8'));
  for (const [sourceId, rule] of Object.entries(overrides.excludedSourceIds)) {
    assert.equal(productVariants.find(p => p.id === `local-${sourceId}`), undefined);
    assert.ok(productVariants.some(p => p.id === rule.replacementProductId));
  }
  // The user explicitly removed the weighed 20Ш2; do not silently remove its other card.
  assert.equal(beams.find(p => p.id === 'local-122246'), undefined);
  assert.equal(beams.find(p => p.id === 'local-73573').weightPerMeterKg, undefined);
  const grades20K1 = beams.filter(p => beamProfile(p) === '20К1').map(p => p.steelGrade);
  assert.deepEqual(Array.from(grades20K1).sort(), ['С255', 'С355']);
});

test('empty general beam subcategory is absent from cards and sidebar data', () => {
  const catalog = readProjectData('lib/catalog.ts');
  const subcategories = catalog.getSubcategoriesByCategoryId('cat-bal');
  assert.deepEqual(Array.from(subcategories, p => p.id).sort(), ['cat-bal-sub-1', 'cat-bal-sub-2', 'cat-bal-sub-3', 'cat-bal-sub-4']);
  const types = catalog.getProductTypesByCategoryId('cat-bal');
  assert.equal(types.length, 4);
  assert.equal(catalog.getSubcategoryById('mirror-family-cat-bal-15'), undefined);
  assert.equal(catalog.getProductTypeById('type-mirror-family-cat-bal-15'), undefined);
  for (const row of beams) {
    assert.ok(catalog.getSubcategoryById(row.subcategoryId));
    assert.ok(catalog.getProductTypeById(row.productTypeId));
  }
});

test('stored beam classifications match the catalog and resolve without runtime repair', () => {
  const {products, families} = JSON.parse(fs.readFileSync('data/imported-catalog.json', 'utf8'));
  assert.ok(!families.some(family => family.id === 'mirror-family-cat-bal-15'));
  for (const source of products.filter(product => product.categoryId === 'cat-bal')) {
    const published = beams.find(product => product.id === source.id);
    assert.equal(source.subcategoryId, published.subcategoryId, source.id);
    assert.equal(source.productTypeId, published.productTypeId, source.id);
    assert.ok(families.some(family => family.id === source.subcategoryId));
  }
});

test('normal B profiles move from the general beam category to normal beams', () => {
  const catalog = readProjectData('lib/catalog.ts');
  const rows = catalog.getProductVariantsByTypeId('type-cat-bal-sub-1');
  assert.equal(rows.length, 14);
  assert.equal(catalog.getProductTypeById('type-cat-bal-sub-1').slug, 'balka-normalnaya');
  for (const row of beams.filter(p => /^\d+(?:[.,]\d+)?Б\d+$/.test(beamProfile(p)))) {
    assert.equal(row.subcategoryId, 'cat-bal-sub-1', row.name);
    assert.equal(row.productTypeId, 'type-cat-bal-sub-1', row.name);
    assert.ok(rows.some(p => p.id === row.id));
  }
  assert.equal(beams.find(p => p.id === 'local-122247').subcategoryId, 'cat-bal-sub-2');
  assert.equal(beams.find(p => p.id === 'local-11123500').subcategoryId, 'cat-bal-sub-3');
});

test('wide-flange and column beams are classified without losing or duplicating products', () => {
  const catalog = readProjectData('lib/catalog.ts');
  for (const [series, subcategoryId, slug] of [
    ['Ш', 'cat-bal-sub-2', 'balka-shirokopolochnaya'],
    ['К', 'cat-bal-sub-3', 'balka-kolonnaya'],
  ]) {
    const type = catalog.getProductTypeById(`type-${subcategoryId}`);
    assert.equal(type.slug, slug);
    const rows = catalog.getProductVariantsByTypeId(type.id);
    for (const row of beams.filter(p => new RegExp(`^\\d+(?:[.,]\\d+)?${series}\\d+$`).test(beamProfile(p)))) {
      assert.equal(row.subcategoryId, subcategoryId, row.name);
      assert.equal(row.productTypeId, type.id, row.name);
      assert.ok(rows.some(p => p.id === row.id));
    }
  }
  assert.equal(beams.filter(p => p.subcategoryId === 'mirror-family-cat-bal-15').length, 0);
  const classified = ['cat-bal-sub-1', 'cat-bal-sub-2', 'cat-bal-sub-3', 'cat-bal-sub-4']
    .flatMap(id => Array.from(catalog.getProductVariantsByTypeId(`type-${id}`)));
  assert.equal(classified.length, 38);
  assert.equal(new Set(classified.map(p => p.id)).size, 38);
});

test('monorail subcategory contains all four M profiles with valid catalog routes', () => {
  const catalog = readProjectData('lib/catalog.ts');
  const category = catalog.getCategoryBySlug('balka');
  const subcategory = catalog.getSubcategoryBySlug(category.id, 'balka-monorelsovaya');
  assert.equal(subcategory.id, 'cat-bal-sub-4');
  assert.equal(subcategory.name, 'Балка монорельсовая');
  const types = catalog.getProductTypesBySubcategoryId(subcategory.id);
  assert.equal(types.length, 1);
  const rows = catalog.getProductVariantsByTypeId(types[0].id);
  assert.deepEqual(Array.from(rows, beamProfile).sort(), ['24М', '30М', '36М', '45М']);
  assert.ok(rows.every(row => row.subcategoryId === subcategory.id && row.weightPerMeterKg > 0));
  assert.equal(types[0].categorySlug, 'balka');
  assert.equal(types[0].slug, 'balka-monorelsovaya');
  assert.ok(beams.filter(row => row.subcategoryId !== subcategory.id).every(row => !/^\d+М$/.test(beamProfile(row))));
});

test('all thirty-eight retained beams keep their prices and rows; lengths are expressed in metres', () => {
  assert.equal(beams.length, 38);
  assert.equal(new Set(beams.map(p => p.id)).size, 38);
  assert.ok(beams.every(p => p.lengthMeters === 6 || p.lengthMeters === 12));
  for (const row of beams) {
    assert.ok(beamProfile(row));
    assert.equal(row.pricePerTon, row.price === null ? undefined : row.price);
    assert.ok(row.steelGrade);
  }
});

test('specified assortment standards supply nominal mass, steel grade standards alone do not', () => {
  const wide = beams.find(p => p.id === 'local-122247');
  assert.equal(beamProfile(wide), '25Ш1');
  assert.equal(wide.weightPerMeterKg, 44.2);
  assert.equal(beams.find(p => p.id === 'local-11123500').weightPerMeterKg, 41.4);
  assert.equal(beams.find(p => p.id === 'local-69356').weightPerMeterKg, 38.3);
  assert.equal(beams.find(p => p.id === 'local-73573').weightPerMeterKg, undefined);
  assert.equal(beams.find(p => p.id === 'prd-012').weight, undefined);
  assert.equal(beams.filter(p => p.weightPerMeterKg > 0).length, 30);
});

test('beam conversions and persisted totals use the same exact nominal mass', () => {
  for (const row of beams.filter(p => p.weightPerMeterKg > 0)) {
    const tons = metersToTons(100, row.weightPerMeterKg);
    assert.ok(Math.abs(tonsToMeters(tons, row.weightPerMeterKg) - 100) < 1e-9);
    const result = revalidateCartPrice(row, {quantity: 100, measurement: {
      inputMode: 'meter', meters: 100, weightTons: 0, pricePerTon: 0, estimatedTotal: 0,
    }});
    if (row.quoteOnly || row.price === null || row.priceQualifier === 'from') assert.ok(result.invalidReason);
    else {
      assert.equal(result.invalidReason, undefined);
      assert.equal(result.measurement.weightTons, tons);
      assert.equal(result.estimatedTotal, calculateLineTotal(tons, row.pricePerTon));
    }
  }
  const other = productVariants.find(p => p.categoryId === 'cat-arm');
  assert.equal(normalizeBeamVariant(other), other);
});

test('profile codes determine classification even if a source row names the wrong subcategory', () => {
  const row = beams.find(p => p.id === 'local-122247');
  const normalized = normalizeBeamVariant({...row, subcategoryId: 'cat-bal-sub-3', productTypeId: 'type-cat-bal-sub-3'});
  assert.equal(normalized.subcategoryId, 'cat-bal-sub-2');
  assert.equal(normalized.productTypeId, 'type-cat-bal-sub-2');
  for (const field of ['id', 'name', 'slug', 'sku', 'price', 'inStock', 'availability', 'standard', 'steelGrade', 'weightPerMeterKg']) {
    assert.equal(normalized[field], row[field], field);
  }
});

test('equivalent profile spellings classify consistently without inventing demo profiles', () => {
  const source = beams.find(p => p.id === 'local-122247');
  for (const [name, profile, subcategoryId] of [
    ['Балка 25sh1x12000', '25Ш1', 'cat-bal-sub-2'],
    ['Балка 20 B 1×12000', '20Б1', 'cat-bal-sub-1'],
    ['Балка 20\u00a0k\u00a01х12000', '20К1', 'cat-bal-sub-3'],
    ['Балка 24mх12000', '24М', 'cat-bal-sub-4'],
    ['Балка 25 Ш 1х12000', '25Ш1', 'cat-bal-sub-2'],
  ]) {
    const row = normalizeBeamVariant({...source, name});
    assert.equal(beamProfile(row), profile);
    assert.equal(row.subcategoryId, subcategoryId);
    assert.equal(row.id, source.id);
    assert.equal(row.price, source.price);
  }
  assert.equal(beamProfile(beams.find(p => p.id === 'prd-012')), '10 мм');
});

test('beam names, series and individual profiles work in global and table search', () => {
  const {createCatalogSearchIndex} = readProjectData('lib/search/index.ts');
  const {productTypes} = readProjectData('data/productTypes.ts');
  for (const index of [createCatalogSearchIndex(productVariants, productTypes), createCatalogSearchIndex(beams)]) {
    for (const query of ['балка', 'двутавр', 'двутавровая балка']) {
      const result = index.search(query, {categoryId:'cat-bal'});
      assert.equal(result.total, 38, query);
      assert.ok(result.hits.every(h => h.product.categoryId === 'cat-bal'));
    }
    for (const [series, count, word] of [['Б', 14, 'нормальная'], ['Ш', 12, 'широкополочная'], ['К', 8, 'колонная'], ['М', 4, 'монорельсовая']]) {
      for (const query of [`балка ${series}`, `двутавр ${series}`, `балка ${word}`]) {
        const result = index.search(query);
        assert.equal(result.total, count, query);
        assert.ok(result.hits.every(h => beamSeries(h.product) === series));
      }
    }
    for (const [profile, count] of [['20Б1', 1], ['20К1', 2], ['24М', 1], ['35Ш2', 1]]) {
      const result = index.search(profile);
      assert.equal(result.total, count, profile);
      assert.ok(result.hits.every(h => beamProfile(h.product) === profile));
    }
    assert.equal(index.search('20Б999').total, 0);
    assert.equal(index.search('20Б1 ГОСТ 27772').total, 1);
  }
});

test('display names preserve category slugs and images', () => {
  const catalog = readProjectData('lib/catalog.ts');
  assert.equal(catalog.getCategoryBySlug('balka').name, 'Балка');
  for (const [id, name] of [['cat-bal-sub-1', 'Балка нормальная'], ['cat-bal-sub-2', 'Балка широкополочная'], ['cat-bal-sub-3', 'Балка колонная'], ['cat-bal-sub-4', 'Балка монорельсовая']]) {
    const subcategory = catalog.getSubcategoryById(id);
    const type = catalog.getProductTypeById(`type-${id}`);
    assert.equal(subcategory.name, name);
    assert.equal(type.name, subcategory.name);
    assert.ok(type.imageUrl);
    assert.equal(type.subcategorySlug, subcategory.slug);
    assert.equal(type.slug, subcategory.slug);
  }
});
