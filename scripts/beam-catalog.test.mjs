import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const {productVariants} = readProjectData('data/products/index.ts');
const {normalizeBeamVariant, beamProfile} = readProjectData('lib/beam.ts');
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts');
const {metersToTons, tonsToMeters, calculateLineTotal} = readProjectData('lib/orderMeasurement.ts');
const beams = productVariants.filter(p => p.categoryId === 'cat-bal');

test('all fifty beams retain their prices and rows; lengths are expressed in metres', () => {
  assert.equal(beams.length, 50);
  assert.equal(new Set(beams.map(p => p.id)).size, 50);
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
  assert.equal(beams.find(p => p.id === 'local-65597').weightPerMeterKg, undefined);
  assert.equal(beams.find(p => p.id === 'prd-009').weight, undefined);
  assert.equal(beams.filter(p => p.weightPerMeterKg > 0).length, 31);
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
