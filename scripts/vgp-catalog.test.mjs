import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const catalog = readProjectData('lib/catalog.ts', cache);
const {existingVariants} = readProjectData('data/products/index.ts', cache);
const {normalizePipeWeight, roundSteelPipeMass} = readProjectData('lib/pipeWeight.ts', cache);
const {createCatalogSearchIndex} = readProjectData('lib/search/index.ts', cache);
const {createCartLines} = readProjectData('lib/cart.ts', cache);
const {formatUnitPrice} = readProjectData('lib/currency.ts', cache);
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts', cache);
const {wholeVgpOrder} = readProjectData('lib/vgp.ts', cache);
const imported = JSON.parse(fs.readFileSync('data/imported-catalog.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('imports/catalog-manifest.json', 'utf8'));
const products = catalog.getAllProductVariants();
const vgp = products.filter(p => p.subcategoryId === 'cat-trk-sub-1');
// Independently transcribed from GOST 3262-75, table 1 (edition with amendments 1–6).
const expected = [
  ['МП-258', 15, 21.3, 2.8, 6000, 'Обыкновенная', 1.28, 53640],
  ['МП-6204', 20, 26.8, 2.8, 6000, 'Обыкновенная', 1.66, 52740],
  ['МП-56374', 25, 33.5, 2.8, 6000, 'Лёгкая', 2.12, 52740],
  ['МП-6224', 32, 42.3, 2.8, 6000, 'Лёгкая', 2.73, 53640],
  ['МП-54870', 32, 42.3, 3.2, 6000, 'Обыкновенная', 3.09, 51300],
  ['МП-277', 40, 48, 3.5, 12000, 'Обыкновенная', 3.84, 62100],
  ['МП-281', 50, 60, 3.5, 12000, 'Обыкновенная', 4.88, 50940],
];

test('seven public VGP products have verified table values, unchanged tonne prices and no guessed party facts', () => {
  assert.equal(vgp.length, 7);
  for (const [sku, dn, diameter, wall, length, series, mass, price] of expected) {
    const p = vgp.find(p => p.sku === sku);
    assert.ok(p, sku);
    assert.equal(p.name, `Труба ВГП Ду${dn}×${String(wall).replace('.', ',')}×${length}`);
    assert.equal(p.standard, 'ГОСТ 3262-75');
    assert.equal(p.nominalBoreMm, dn); assert.equal(p.diameterMm, diameter);
    assert.equal(p.wallThicknessMm, wall); assert.equal(p.lengthMeters, length / 1000);
    assert.equal(p.weightPerMeterKg, mass); assert.equal(p.weight.value, mass);
    assert.equal(p.weight.unit, 'кг/м');
    assert.equal(p.specifications.find(s => s.name === 'Серия по толщине стенки').value, series);
    assert.equal(p.price, price); assert.equal(p.pricePerTon, price);
    assert.equal(p.unit, 'ton'); assert.equal(p.priceUnit, 'за тонну');
    assert.match(formatUnitPrice(price, p.priceUnit), /₽\/т$/);
    const order = wholeVgpOrder(p, p.lengthMeters, 'meter');
    assert.equal(revalidateCartPrice(p, {quantity: p.lengthMeters, measurement: {inputMode:'meter', ...order}}).estimatedTotal,
      Math.round(order.weightTons * price * 100) / 100);
    assert.equal(p.availability, 'UNKNOWN'); assert.equal(p.material, '');
    assert.equal(p.steelGrade, undefined); assert.equal(p.form, undefined);
    assert.ok(!p.specifications.some(s => /марка|производитель|резьб|муфт|тип длины|ндс/i.test(s.name)));
    assert.ok(!/ТМ|сертифицирован|соответствует/i.test(JSON.stringify([p.name, p.shortDescription, p.description, p.specifications])));
    const evidence = manifest.records.find(r => r.productId === p.id);
    assert.match(evidence.rawOffers[0].record.titleFull, /ТМ/);
    assert.equal(JSON.stringify(evidence.normalizedSpecifications), JSON.stringify(p.specifications));
  }
});

test('all seven VGP rows convert whole pipes precisely and reject fractional lengths in cart and server pricing', () => {
  for (const p of vgp) {
    for (const pieces of [1, 2, 3, 100]) {
      const meters = pieces * p.lengthMeters;
      const byMeters = wholeVgpOrder(p, meters, 'meter');
      const byTons = wholeVgpOrder(p, meters * p.weightPerMeterKg / 1000, 'ton');
      assert.equal(byMeters.pieces, pieces);
      assert.equal(JSON.stringify(byTons), JSON.stringify(byMeters));
      const line = createCartLines([{productId:p.id, quantity:byTons.weightTons,
        measurement:{inputMode:'ton', ...byTons, pricePerTon:1, estimatedTotal:1}}])[0];
      assert.equal(line.invalidReason, undefined);
      assert.equal(line.measurement.meters, meters);
      assert.equal(line.measurement.weightTons, byMeters.weightTons);
      assert.equal(line.estimatedTotal, Math.round(byMeters.weightTons * p.price * 100) / 100);
    }
    assert.equal(wholeVgpOrder(p, p.lengthMeters + 0.01, 'meter').pieces, 2);
    for (const mode of ['meter', 'ton']) {
      const partialMeters = p.lengthMeters / 2;
      const priced = revalidateCartPrice(p, {quantity:partialMeters, measurement:{inputMode:mode,
        meters:partialMeters, weightTons:partialMeters * p.weightPerMeterKg / 1000}});
      assert.ok(priced.invalidReason, `${p.sku} ${mode}`);
      assert.equal(priced.estimatedTotal, 0);
    }
    assert.ok(revalidateCartPrice(p, {quantity:0.5}).invalidReason, 'legacy generic tonnes must be reviewed');
    for (const quantity of [NaN, Infinity, -1, Number.MAX_VALUE]) assert.equal(wholeVgpOrder(p, quantity, 'meter'), null);
    assert.equal(wholeVgpOrder({...p, weightPerMeterKg:undefined}, 6, 'meter'), null);
    assert.equal(wholeVgpOrder({...p, lengthMeters:undefined}, 6, 'meter'), null);
  }
});

test('archived MS-0071/MS-0072 remain editable but cannot be found, counted or purchased', () => {
  for (const id of ['prd-071', 'prd-072']) {
    assert.ok(existingVariants.some(p => p.id === id));
    assert.equal(catalog.getProductVariantById(id), undefined);
    const line = createCartLines([{productId:id, quantity:1}])[0];
    assert.ok(line.invalidReason); assert.equal(line.estimatedTotal, 0);
  }
  const search = createCatalogSearchIndex(products);
  for (const query of ['MS-0071', 'MS-0072']) assert.equal(search.search(query).total, 0);
});

test('VGP search accepts Ду, synonyms, equivalent dimensions and exact ГОСТ years', () => {
  for (const search of [createCatalogSearchIndex(products, catalog.getAllProductTypes(), catalog.getAllCategories()), createCatalogSearchIndex(vgp)]) {
    for (const query of ['Труба ВГП 15', 'Водогазопроводная труба Ду15', 'Труба водогазопроводная 15х2.8', 'ВГП 15×2,8']) {
      assert.deepEqual(Array.from(search.search(query).hits, h => h.product.sku), ['МП-258'], query);
    }
    assert.equal(search.search('ВГП Ду16').total, 0);
    assert.equal(search.search('ВГП ГОСТ 3262-75').total, 7);
    assert.equal(search.search('ВГП ГОСТ 3262-99').total, 0);
  }
});

test('pipe mass uses the hollow section only with valid outer diameter and wall; other metal rules stay unchanged', () => {
  assert.equal(roundSteelPipeMass(21.3, 2.8), 1.277);
  for (const args of [[0,2], [20,0], [20,10], [20,11], [Infinity,2], [20,NaN], [1e154,1e153], [1e-6,1e-8]]) assert.equal(roundSteelPipeMass(...args), undefined);
  const base = {categoryId:'cat-trk', weight:{value:2.4,unit:'кг/м'}, specifications:[], attributes:[]};
  assert.equal(normalizePipeWeight(base).weight, undefined);
  assert.equal(normalizePipeWeight({...base, nominalBoreMm:15, wallThicknessMm:2.8}).weight, undefined, 'Ду cannot stand in for outer diameter');
  assert.equal(normalizePipeWeight({...base, diameterMm:21.3, wallThicknessMm:2.8}).weight.value, 1.277);
  assert.equal(normalizePipeWeight({...base, diameterMm:21.3, wallThicknessMm:2.8, weightPerMeterKg:1.28}).weight.value, 1.28);
  assert.equal(normalizePipeWeight({...base, weightPerMeterKg:2.4}).weightPerMeterKg, undefined, 'Missing geometry cannot enable conversion');
  for (const p of existingVariants.filter(p => ['cat-trn','cat-trp','cat-trk'].includes(p.categoryId))) {
    if (p.diameterMm === undefined || p.wallThicknessMm === undefined) assert.equal(normalizePipeWeight(p).weight, undefined, p.id);
  }
  for (const categoryId of ['cat-arm','cat-bal','cat-lis','cat-kru']) {
    const p = {...base, categoryId}; assert.equal(normalizePipeWeight(p), p);
  }
  const noGeometry = normalizePipeWeight({...base, price:50000, pricePerTon:50000});
  assert.ok(revalidateCartPrice(noGeometry, {quantity:1, measurement:{inputMode:'meter',meters:10,weightTons:1}}).invalidReason);
});

test('import in an isolated copy retains corrected VGP data and excludes archived demos without changing the working catalog', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'metal-vgp-import-'));
  try {
    for (const directory of ['data','lib','imports']) fs.cpSync(directory, path.join(temporary,directory), {recursive:true});
    execFileSync(process.execPath, [path.resolve('scripts/import-catalog.mjs')], {cwd:temporary, stdio:'pipe'});
    const regenerated = JSON.parse(fs.readFileSync(path.join(temporary,'data/imported-catalog.json'),'utf8'));
    const counts = JSON.parse(fs.readFileSync(path.join(temporary,'imports/catalog-manifest.json'),'utf8')).counts;
    for (const [sku] of expected) {
      assert.equal(JSON.stringify(regenerated.products.find(p => p.sku === sku)), JSON.stringify(imported.products.find(p => p.sku === sku)), sku);
    }
    assert.ok(counts.after.variants > 0);
    assert.ok(!regenerated.products.some(p => ['MS-0071','MS-0072'].includes(p.sku)));
    assert.equal(JSON.stringify(JSON.parse(fs.readFileSync('data/imported-catalog.json','utf8'))), JSON.stringify(imported));
  } finally { fs.rmSync(temporary, {recursive:true, force:true}); }
});
