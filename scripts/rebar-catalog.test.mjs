import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const {productVariants} = readProjectData('data/products/index.ts');
const {normalizeRebarVariant} = readProjectData('lib/rebar.ts');
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts');
const {metersToTons, calculateMeasuredLineTotal} = readProjectData('lib/orderMeasurement.ts');

test('every remaining rebar category retains all rows and supports the reference table', () => {
  const counts = new Map([['cat-arm-sub-2', 17], ['cat-arm-sub-3', 9], ['cat-arm-sub-4', 15]]);
  for (const [id, count] of counts) {
    const rows = productVariants.filter(p => p.subcategoryId === id);
    assert.equal(rows.length, count);
    assert.equal(new Set(rows.map(p => p.id)).size, count);
    for (const row of rows) {
      assert.ok(row.diameterMm > 0, row.name);
      assert.ok(row.weightPerMeterKg > 0, row.name);
      assert.ok(['bar', 'coil'].includes(row.form));
      assert.ok(row.steelGrade);
      assert.ok(row.lengthMeters === undefined || row.lengthMeters <= 18);
      if (row.price !== null) assert.equal(row.pricePerTon, row.price);
      const meters = row.form === 'bar' ? row.lengthMeters : 100;
      assert.ok(meters > 0, row.id);
      const tons = metersToTons(meters, row.weightPerMeterKg);
      const priced = revalidateCartPrice(row, {quantity: meters, measurement: {
        inputMode: 'meter', meters, weightTons: tons,
        pricePerTon: row.pricePerTon ?? 0, estimatedTotal: 0,
      }});
      if (row.quoteOnly || row.demo) {
        assert.ok(priced.invalidReason);
        assert.equal(priced.estimatedTotal, 0);
      } else {
        assert.equal(priced.invalidReason, undefined);
        assert.equal(priced.estimatedTotal, calculateMeasuredLineTotal(meters, row.weightPerMeterKg, row.pricePerTon));
      }
    }
  }
});

test('A240 bars and coils omit the redundant surface field from specifications and descriptions', () => {
  for (const product of productVariants.filter(p => p.subcategoryId === 'cat-arm-sub-4')) {
    assert.ok(!product.specifications.some(spec => spec.name === 'Поверхность'), product.id);
    for (const text of [product.shortDescription, product.description]) {
      assert.doesNotMatch(text, /поверхность\s*:|рифл/iu, product.id);
    }
  }
});

test('35GS supplier references distinguish bars from coils and require an individual quote', () => {
  const diametersByForm = {
    bar: [6, 8, 10, 14, 16, 18, 22, 25, 28, 32, 36, 40],
    coil: [6, 8, 10],
  };
  for (const [form, diameters] of Object.entries(diametersByForm)) {
    for (const diameter of diameters) {
      const id = `rebar-a400-35gs-${diameter}-${form}`;
      const row = productVariants.find(p => p.id === id);
      assert.ok(row, id);
      assert.equal(row.subcategoryId, 'cat-arm-sub-2', id);
      assert.equal(row.form, form, id);
      assert.equal(row.diameterMm, diameter, id);
      assert.equal(row.steelGrade, '35ГС', id);
      assert.equal(row.unit, 'ton', id);
      assert.ok(row.pricePerTon > 0, id);
      assert.equal(row.quoteOnly, true, id);
      assert.equal(row.inStock, false, id);
      assert.equal(row.availability, 'UNKNOWN', id);
      if (form === 'coil') assert.equal(row.lengthMeters, undefined, id);
      else assert.equal(row.lengthMeters, diameter <= 8 ? 6 : 11.7, id);
      const exactPrice = form === 'coil' || diameter === 28;
      assert.equal(row.priceQualifier, exactPrice ? 'exact' : 'from', id);
      if (diameter === 25) {
        assert.equal(row.sourceReference, 'https://novametcom.ru/produkciya/prod/armatura-25-a3-35gs-15/', id);
        assert.equal(row.pricePerTon, 58086, id);
        assert.equal(row.standard, 'ГОСТ 5781-82', id);
      } else {
        assert.equal(new URL(row.sourceReference).hostname, exactPrice ? 'metallmk.ru' : 'as-tim.ru', id);
      }
    }
  }
  assert.equal(productVariants.find(p => p.id === 'rebar-a400-35gs-14-bar').weightPerMeterKg, 1.21);
});

test('imported rebar preserves quote-only and unknown stock states and converts millimetres', () => {
  const quote = productVariants.find(p => p.id === 'local--705');
  assert.equal(quote.price, null);
  assert.equal(quote.pricePerTon, undefined);
  assert.equal(quote.quoteOnly, true);
  assert.equal(quote.availability, 'UNKNOWN');
  assert.equal(quote.lengthMeters, 11.7);
  assert.equal(quote.weightPerMeterKg, 1.998);
  const coil = productVariants.find(p => p.id === 'local-111021');
  assert.equal(coil.form, 'coil');
  assert.equal(coil.lengthMeters, undefined);
});

test('normalization leaves other catalog categories untouched', () => {
  const product = productVariants.find(p => p.categoryId !== 'cat-arm');
  assert.equal(normalizeRebarVariant(product), product);
});
