import test from 'node:test';
import assert from 'node:assert/strict';
import {getAllProductVariants} from '../../lib/catalog';
import {applyCatalogOverrides} from '../../lib/catalogOverrides';
import {beamProfile, beamReferenceMassKg} from '../../lib/beam';
import {projectCartProduct} from '../../lib/cartProjection';
import type {ProductVariant} from '../../types/product';
import raw from '../../data/rozmet-catalog.json';
import evidence from '../../imports/beam-specifications.verified.json';
import imageSections from '../../imports/beam-image-template/sections.json';
const products = getAllProductVariants();
const angles: Record<string, number> = {
  '25х25х3':1.12, '32х32х3':1.46, '35х35х4':2.10, '40х40х3':1.85, '40х40х4':2.42,
  '45х45х4':2.73, '50х50х4':3.05, '50х50х5':3.77, '63х63х4':3.90, '63х63х5':4.81,
  '75х75х5':5.80, '75х75х6':6.89, '90х90х6':8.33, '100х63х6':7.53, '100х100х7':10.79,
  '100х100х8':12.25, '100х100х10':15.10, '125х125х8':15.46, '125х125х10':19.10,
  '140х140х10':21.45, '160х160х10':24.67, '160х100х10':19.85,
};
const commercialKeys = ['id','sku','slug','categoryId','subcategoryId','productTypeId','price','priceUnit','priceQualifier','unit','currency','availability','inStock','quoteOnly','sourceReference','sourceProductName'] as const;
const audited = products.filter(p => ['rozmet-cat-ugolok','rozmet-cat-kvadrat','rozmet-cat-shveller'].includes(p.categoryId));

test('all 43 audited offers preserve source identity, prices and commercial conditions', () => {
  assert.equal(audited.length, 43);
  for (const p of audited) {
    const original = raw.products.find(x => x.id === p.id) as ProductVariant;
    for (const key of commercialKeys) assert.deepEqual(p[key], original[key], p.id+': '+key);
    assert.deepEqual(p.specifications.filter(s => s.name.startsWith('Условия')), original.specifications.filter(s => s.name.startsWith('Условия')));
    assert.deepEqual(applyCatalogOverrides(p), p, p.id+': idempotent');
    assert.equal(p.weightConfirmed, true);
    assert.equal(projectCartProduct(p).weightPerMeterKg, p.weightPerMeterKg);
    const names = p.specifications.map(s => s.name);
    assert.equal(new Set(names).size, names.length, p.id+': no duplicate facts');
    assert.ok(!names.includes('Вес') && !names.includes('Размер'));
    assert.ok(!/8503-93|8510-93|2591-88|Хлыст – 6 мм/u.test(p.description));
    assert.equal(p.standard, '', 'reference standard does not certify the batch');
    const foreign = {...original, sourceReference:'https://example.test/another-offer'};
    assert.deepEqual(applyCatalogOverrides(foreign), foreign);
  }
});

test('every angle has the nominal table mass from GOST 8509/8510 and the correct leg type', () => {
  const items = audited.filter(p => p.categoryId==='rozmet-cat-ugolok');
  assert.equal(items.length,Object.keys(angles).length);
  for (const p of items) {
    const profile = p.name.split('№').at(-1)!.trim();
    assert.equal(p.weightPerMeterKg, angles[profile],profile);
    const [a,b] = profile.split('х');
    assert.equal(p.specifications.find(s=>s.name==='Тип уголка')?.value,a===b?'Равнополочный':'Неравнополочный');
    assert.equal(p.specifications.find(s=>s.name==='Справочный сортамент')?.value,a===b?'ГОСТ 8509-93':'ГОСТ 8510-86');
  }
});

test('square mass retains GOST precision for calculations and correct section/length semantics', () => {
  for (const p of audited.filter(p=>p.categoryId==='rozmet-cat-kvadrat')) {
    const side = Number(p.name.split('№')[1]);
    assert.equal(p.weightPerMeterKg, Math.round(side*side*0.00785*1000)/1000, p.id);
    assert.equal(p.attributes.find(a=>a.key==='size')?.value,`${side}×${side} мм`);
    assert.equal(p.lengthMeters,6);
  }
  assert.equal(products.find(p=>p.id==='rozmet-26579')?.weightPerMeterKg,2.01);
});

test('channel ranges are not collapsed into a fixed stock length', () => {
  for (const [id,range] of [['rozmet-2236',[6,12]],['rozmet-2237',[6,12]],['rozmet-2241',[11.7,12]]] as const) {
    const p=products.find(p=>p.id===id)!;
    assert.equal(p.lengthMeters,undefined); assert.deepEqual(p.lengthRangeMeters,range);
  }
  assert.equal(products.find(p=>p.id==='rozmet-2235')?.lengthMeters,11.7);
});

test('all 30 beams with a declared assortment match standard dimensions and mass', () => {
  const beams=products.filter(p=>p.categoryId==='cat-bal'&&/35087|19425/.test(p.standard));
  assert.equal(beams.length,30);
  for (const p of beams) {
    const profile=beamProfile(p);
    const ref=evidence.sections[profile as keyof typeof evidence.sections];
    const photo=imageSections[profile as keyof typeof imageSections];
    assert.ok(ref && photo,p.id);
    assert.equal(p.weightPerMeterKg,ref.massKgPerMeter,p.id);
    assert.deepEqual(photo,{height:ref.heightMm,width:ref.flangeWidthMm,web:ref.webThicknessMm,flange:ref.flangeThicknessMm,mass:ref.massKgPerMeter});
    assert.equal(p.lengthMeters,12);
  }
});

test('steel-only beam standards remain unconfirmed; the legacy placeholder has no invented dimensions', () => {
  const unknown=products.filter(p=>p.categoryId==='cat-bal'&&p.standard==='ГОСТ 27772');
  assert.equal(unknown.length,7);
  for (const p of unknown) {
    assert.equal(p.weightPerMeterKg,undefined);
    assert.equal(beamReferenceMassKg(p),evidence.sections[beamProfile(p) as keyof typeof evidence.sections].massKgPerMeter);
  }
  const demo=products.find(p=>p.id==='prd-012')!;
  assert.equal(beamProfile(demo),'—');assert.equal(demo.standard,'');assert.equal(demo.lengthMeters,undefined);
  assert.doesNotMatch(JSON.stringify(demo),/ГОСТ 5781|10 мм/);
});
