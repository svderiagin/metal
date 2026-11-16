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
 const rebar=hits('арматура 12');
 assert.ok(rebar.length,'арматура 12');
 assert.ok(rebar.every(h=>buildTechnicalDocument(h.product).primary.has('12')));
});
test('Grades and standards are never fuzzy',()=>{
 assert.ok(hits('09Г2С').length); assert.ok(hits('ст3').length);
 assert.equal(hits('09Г2С999').length,0);assert.equal(hits('ГОСТ 999999999').length,0);
 assert.ok(hits('09Г2С').every(h=>buildTechnicalDocument(h.product).grades.has('09г2с')));
 const matches=hits('ГОСТ 3262');
 assert.ok(matches.length,'ГОСТ 3262');
 assert.ok(matches.every(h=>[...buildTechnicalDocument(h.product).standards].some(s=>s.split('-')[0]==='3262')));
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
 const hotRolled=createCatalogSearchIndex(products.filter(p=>p.subcategoryId==='rozmet-sub-listovoy-prokat-list-goryachekatanyj'));
 assert.deepEqual(Array.from(hotRolled.search('Лист горячекатаный 3 мм').hits,h=>h.product.id).sort(), ['rozmet-2188','rozmet-28951']);
 for(const sku of ['26569','28931','28971']) assert.equal(hotRolled.search(sku).total,0);
});
test('Exact real product names rank first across every category',()=>{
 for(const p of products) assert.equal(hits(p.name)[0]?.product.name,p.name,p.name);
 for(const p of products) assert.equal(hits(p.sku)[0]?.product.sku,p.sku,p.sku);
});
test('Filters and pagination operate on ranked results',()=>{
 const query='труба';
 const all=hits(query);
 const ids=results=>results.map(({product})=>product.id);
 const availability={categoryId:'cat-trp',inStock:true};
 const available=all.filter(({product})=>product.categoryId===availability.categoryId&&product.inStock);
 const offset=1,limit=2;
 assert.ok(available.length>offset+limit,'fixture must have results before and after the test page');
 assert.deepEqual(ids(index.search(query,availability).hits),ids(available));
 const page=index.search(query,{...availability,offset,limit});
 assert.equal(page.total,available.length);
 assert.deepEqual(ids(page.hits),ids(available.slice(offset,offset+limit)));

 const standard='ГОСТ 3262-75';
 const byStandard=all.filter(({product})=>product.standard===standard);
 assert.ok(byStandard.length,standard);
 assert.deepEqual(ids(index.search(query,{standard}).hits),ids(byStandard));

 const material='Углеродистая сталь';
 const byMaterial=all.filter(({product})=>product.attributes.some(attribute=>attribute.key==='material'&&attribute.value===material));
 assert.ok(byMaterial.length,material);
 assert.deepEqual(ids(index.search(query,{material}).hits),ids(byMaterial));
 assert.equal(index.search('труба',{categoryId:'unknown'}).total,0);
});
test('Full catalog query performance',()=>{
 const start=performance.now();for(let i=0;i<20;i++)for(const q of ['профилная труба','40х40х2','профнастил','09Г2С','арматруа'])index.search(q);
 const elapsed=performance.now()-start;console.log(`100 full-catalog searches: ${elapsed.toFixed(1)} ms`);assert.ok(elapsed<5000);
});
