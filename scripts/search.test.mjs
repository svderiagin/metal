import {test} from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {readProjectData} from './project-data.mjs';
const {productVariants: products}=readProjectData('data/products/index.ts');
const {productTypes}=readProjectData('data/productTypes.ts');
const {categories}=readProjectData('data/categories.ts');
const {createCatalogSearchIndex}=readProjectData('lib/search/index.ts');
const {buildTechnicalDocument}=readProjectData('lib/search/technical.ts');
const started=performance.now();
const index=createCatalogSearchIndex(products,productTypes,categories);
console.log(`Index: ${products.length} products, ${(performance.now()-started).toFixed(1)} ms`);
const hits=q=>index.search(q).hits;
test('Russian morphology, cases, order and metal families',()=>{
 for(const q of ['трубы профильные','профильных труб','строительную арматуру','профнастил','металлическая сетка','двутавровые балки','круглая труба']) assert.ok(hits(q).length,q);
 assert.deepEqual(hits('труба профильная').map(h=>h.product.id),hits('профильная труба').map(h=>h.product.id));
});
test('Scoped synonyms and abbreviations',()=>{
 for(const q of ['проф труба','профтруба','двутавр','оцинковка','вгп','эсв','рабица']) assert.ok(hits(q).length,q);
 assert.equal(hits('вгп')[0].product.categoryId,'cat-trk');
});
test('Exact dimensions, equivalent notation, incompatible dimensions excluded',()=>{
 const expected=hits('40х40х2').map(h=>h.product.id);assert.ok(expected.length);
 for(const q of ['40x40x2','40×40×2','40 40 2']) assert.deepEqual(hits(q).map(h=>h.product.id),expected);
 assert.ok(hits('профнастил 0.3').length);
 assert.ok(hits('арматура ф12').length);assert.deepEqual(hits('арматура ф12').map(h=>h.product.id),hits('арматура Ø12').map(h=>h.product.id));
 assert.ok(hits('40х40х999').length===0);
 assert.ok(hits('40х40х2').every(h=>buildTechnicalDocument(h.product).dimensions.some(d=>d.slice(0,3).join('x')==='40x40x2')));
 assert.ok(hits('арматура 12').every(h=>buildTechnicalDocument(h.product).primary.has('12')));
});
test('Grades and standards are never fuzzy',()=>{
 assert.ok(hits('09Г2С').length); assert.ok(hits('ст3').length);
 assert.equal(hits('09Г2С999').length,0);assert.equal(hits('ГОСТ 999999999').length,0);
 assert.ok(hits('09Г2С').every(h=>buildTechnicalDocument(h.product).grades.has('09г2с')));
 assert.ok(hits('ГОСТ 8639').every(h=>[...buildTechnicalDocument(h.product).standards].some(s=>s.split('-')[0]==='8639')));
});
test('Controlled spelling corrections and partial input',()=>{
 for(const q of ['профилная труба','арматруа','оцинкованый профнастил','труба проф']) assert.ok(hits(q).length,q);
 assert.ok(index.search('арматруа').correctedQuery);
 assert.equal(hits('абракадабразавр').length,0);
});
test('Family-local index supports the same technical and typo query',()=>{
 const family=productTypes.find(t=>t.id===hits('профильная труба 12')[0].product.productTypeId);
 const subset=products.filter(p=>p.productTypeId===family.id);
 const local=createCatalogSearchIndex(subset);
 const result=local.search('профилная труба 12');
 assert.ok(result.total,JSON.stringify({family:family.name,subset:subset.map(p=>p.name),result}));
});
test('Exact real product names rank first across every category',()=>{
 for(const p of products) assert.equal(hits(p.name)[0]?.product.name,p.name,p.name);
 for(const p of products) assert.equal(hits(p.sku)[0]?.product.sku,p.sku,p.sku);
});
test('Filters and pagination operate on ranked results',()=>{
 const all=index.search('труба',{categoryId:'cat-trp',inStock:true});
 assert.ok(all.total);assert.ok(all.hits.every(h=>h.product.categoryId==='cat-trp'&&h.product.inStock));
 assert.deepEqual(index.search('труба',{categoryId:'cat-trp',inStock:true,offset:2,limit:3}).hits.map(h=>h.product.id),all.hits.slice(2,5).map(h=>h.product.id));
 const sample=all.hits[0].product;
 assert.ok(index.search('труба',{standard:sample.standard}).hits.every(h=>h.product.standard===sample.standard));
 const material=sample.attributes.find(a=>a.key==='material')?.value;
 if(material) assert.ok(index.search('труба',{material}).hits.every(h=>h.product.attributes.some(a=>a.key==='material'&&a.value===material)));
 assert.equal(index.search('труба',{categoryId:'unknown'}).total,0);
});
test('Full catalog query performance',()=>{
 const start=performance.now();for(let i=0;i<20;i++)for(const q of ['профилная труба','40х40х2','профнастил','09Г2С','арматруа'])index.search(q);
 const elapsed=performance.now()-start;console.log(`100 full-catalog searches: ${elapsed.toFixed(1)} ms`);assert.ok(elapsed<5000);
});
