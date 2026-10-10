import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {discountedPrice,parsePrice} from './pricing.mjs';
import {readProjectData} from './project-data.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('decimal safe discount, examples and half up',()=>{
 for(const [source,expected] of [['50 000,00',45000],['67 950,00',61155],['12 345,67',11111.10],['0.05',0.05],['0.15',0.14]])assert.equal(discountedPrice(source),expected);
});
test('qualifiers, formatting and invalid prices',()=>{
 assert.equal(parsePrice('от 50 000 ₽/т').qualifier,'from');
 assert.equal(discountedPrice('от 50 000 ₽/т'),45000);
 for(const raw of [null,'',0,'0,00','по запросу','NaN','1-2','10 000–20 000','12,345','-5'])assert.equal(discountedPrice(raw),null,String(raw));
});
test('all records accounted for; unique IDs and valid routes',()=>{
 const manifest=read('imports/catalog-manifest.json'),inv=read('imports/mirror-inventory.json');
 assert.equal(manifest.records.length,new Set(inv.records.map(e=>String(e.record.id))).size);
 assert.equal(manifest.records.reduce((n,r)=>n+r.rawOffers.length,0),inv.records.length);
 assert.equal(inv.pages.length,2005);
 assert.equal(inv.pages.filter(p=>p.status==='error').length,0);
 assert.equal(inv.pages.flatMap(p=>p.parseIssues||[]).length,0);
 const pathsById=new Map();for(const e of inv.records){const id=String(e.record.id);const paths=pathsById.get(id)||new Set();paths.add(e.record.staticPath);pathsById.set(id,paths);}
 assert([...pathsById.values()].every(paths=>paths.size===1),'An original ID must not combine different variant URLs');
 const {products,categories,families}=read('data/imported-catalog.json');
 assert(!/brokinvest\.ru|980-98-80|rawOffers|snapshotDate/.test(JSON.stringify({products,categories,families})),'Private provenance and donor contacts must not enter browser data');
 assert.equal(new Set(products.map(p=>p.id)).size,products.length);
 assert.equal(new Set(products.map(p=>p.slug)).size,products.length);
 for(const p of products){
  assert(categories.some(c=>c.id===p.categoryId));assert(families.some(f=>f.id===p.subcategoryId&&f.categoryId===p.categoryId));
  assert.equal(p.inStock,false);assert.equal(p.weight,undefined);
  assert(!/NaN|undefined/.test(JSON.stringify(p)));
  const r=manifest.records.find(r=>r.productId===p.id);
  assert.equal(p.price,r.ourPrice);
  if(p.price!==null){assert(p.price>0&&Number.isFinite(p.price));assert.equal(p.price,discountedPrice(r.priceInput));assert.equal(p.priceUnit,r.priceUnit==='т'?'за тонну':'за килограмм');}
  else assert.equal(p.quoteOnly,true);
 }
});
test('units remain per tonne and per kilogram, never per metre',()=>{
 const products=read('data/imported-catalog.json').products;
 assert(products.some(p=>p.unit==='ton'&&p.price));assert(products.some(p=>p.unit==='kg'&&p.price));
 assert(!products.some(p=>p.unit==='meter'));
 assert.equal(products.find(p=>p.id==='local-80044').price,69750);
 assert.equal(products.find(p=>p.id==='local-67810').price,184500);
});
test('re-import is byte-identical and preserves editable local products',()=>{
 const files=['data/imported-catalog.json','imports/catalog-manifest.json'];const before=files.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/import-catalog.mjs']);
 files.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));
 const data=readProjectData('data/products/index.ts');
 assert.equal(data.productVariants.length,new Set(data.productVariants.map(p=>p.id)).size);
 for(const p of data.existingVariants)assert(data.productVariants.some(v=>v.id===p.id)||read('data/imported-catalog.json').matchedIds.includes(p.id));
});
test('mass conversion keeps precision; incomplete data cannot convert',()=>{
 const {metersToTons,tonsToMeters,calculateLineTotal}=readProjectData('lib/orderMeasurement.ts');
 assert.equal(metersToTons(10,0.888),0.00888);
 assert.equal(calculateLineTotal(metersToTons(10,0.888),45000),399.6);
 assert.equal(tonsToMeters(0.00888,0.888),10);
 assert.equal(metersToTons(10,0),null);assert.equal(tonsToMeters(1,undefined),null);
});
test('persisted cart prices and mass are recomputed from the current variant',()=>{
 const {revalidateCartPrice}=readProjectData('lib/cartPricing.ts');
 const product={price:45000,pricePerTon:45000,weightPerMeterKg:0.888};
 const item={quantity:10,measurement:{inputMode:'meter',meters:10,weightTons:1,pricePerTon:999999,estimatedTotal:999999}};
 const priced=revalidateCartPrice(product,item);
 assert.equal(priced.estimatedTotal,399.6);assert.equal(priced.measurement.weightTons,0.00888);assert.equal(priced.measurement.pricePerTon,45000);
 const incomplete=revalidateCartPrice({price:45000,pricePerTon:45000},item);
 assert(incomplete.invalidReason);assert.equal(incomplete.estimatedTotal,0);
 assert.equal(revalidateCartPrice({price:45000},{quantity:0.5}).estimatedTotal,22500);
 assert(revalidateCartPrice({price:null,quoteOnly:true},{quantity:1}).invalidReason);
});
