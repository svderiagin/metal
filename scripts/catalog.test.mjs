import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {discountedPrice,parsePrice} from './pricing.mjs';
import {readProjectData} from './project-data.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('profile pipe category retains two families, original articles and 51 structured offers',()=>{
 const catalog=readProjectData('lib/catalog.ts');
 assert.deepEqual(Array.from(catalog.getSubcategoriesByCategoryId('cat-trp'),s=>s.id),['cat-trp-sub-1','cat-trp-sub-2']);
 assert.deepEqual(Array.from(catalog.getProductTypesByCategoryId('cat-trp'),t=>t.id),['type-cat-trp-sub-1','type-cat-trp-sub-2']);
 const variants=catalog.getProductVariantsByCategoryId('cat-trp');
 assert.deepEqual(Array.from(variants.filter(p=>!p.profileWidthMm),p=>p.id),['prd-087','prd-088','prd-089','prd-090']);
 assert.equal(variants.filter(p=>p.profileWidthMm).length,51);
 assert.ok(!read('data/imported-catalog.json').products.some(p=>p.categoryId==='cat-trp'));
 const mapping=read('data/catalog-images.json');
 const excluded=read('imports/catalog-manifest.json').records.filter(r=>r.status==='excluded'&&r.reason?.includes('только локальные подкатегории квадратной и прямоугольной'));
 assert.equal(excluded.length,118);
 const removedIds=[...Array.from({length:8},(_,i)=>`prd-${String(91+i).padStart(3,'0')}`),...excluded.map(r=>`local-${r.sourceId}`)];
 for(const id of removedIds){assert.equal(catalog.getProductVariantById(id),undefined,id);assert.equal(mapping.products[id],undefined,id);}
 for(const id of Object.keys(mapping.types).filter(id=>id.startsWith('type-cat-trp-')||id.startsWith('type-mirror-family-cat-trp-')))assert.ok(catalog.getProductTypeById(id),id);
});
test('the combined hardcoded catalog has unique identities and resolvable canonical routes',()=>{
 const cache=new Map();
 const {productVariants}=readProjectData('data/products/index.ts',cache);
 const {productTypes}=readProjectData('data/productTypes.ts',cache);
 const {categories}=readProjectData('data/categories.ts',cache);
 const {subcategories}=readProjectData('data/subcategories.ts',cache);
 for(const key of ['id','sku','slug'])assert.equal(new Set(productVariants.map(p=>p[key])).size,productVariants.length,key);
 const routes=new Set();
 for(const type of productTypes){
  const category=categories.find(c=>c.id===type.categoryId);
  const subcategory=subcategories.find(s=>s.id===type.subcategoryId&&s.categoryId===type.categoryId);
  assert(category&&subcategory,type.id);
  assert.equal(type.categorySlug,category.slug);assert.equal(type.subcategorySlug,subcategory.slug);
  const route=`${category.slug}/${subcategory.slug}/${type.slug}`;
  assert(!routes.has(route),route);routes.add(route);
 }
 for(const product of productVariants)assert(productTypes.some(t=>t.id===product.productTypeId&&t.categoryId===product.categoryId&&t.subcategoryId===product.subcategoryId),product.id);
});
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
  assert.equal(p.inStock,false);
  // The VGP audit added tabulated masses only to these seven verified records.
  if(!['МП-258','МП-6204','МП-56374','МП-6224','МП-54870','МП-277','МП-281'].includes(p.sku))assert.equal(p.weight,undefined);
  assert(!/NaN|undefined/.test(JSON.stringify(p)));
  const r=manifest.records.find(r=>r.productId===p.id);
  assert.equal(p.price,r.ourPrice);
  if(p.price!==null){assert(p.price>0&&Number.isFinite(p.price));assert.equal(p.price,discountedPrice(r.priceInput));assert.equal(p.priceUnit,r.priceUnit==='т'?'за тонну':'за килограмм');}
  else assert.equal(p.quoteOnly,true);
 }
});
test('retained supplier products remain priced per tonne',()=>{
 const products=read('data/imported-catalog.json').products;
 assert(products.some(p=>p.unit==='ton'&&p.price));
 assert(products.every(p=>p.unit==='ton'));
 assert(products.every(p=>['cat-arm','cat-trk','cat-bal'].includes(p.categoryId)));
 assert.equal(products.find(p=>p.id==='local-258').price,53640);
 assert.equal(products.find(p=>p.id==='local-65599').price,79470);
});
test('isolated catalogue import is reproducible and preserves supplier rows and editable products', {
  skip: process.env.CATALOG_IMPORT_CHECK !== '1' ? 'Explicit opt-in for the isolated import audit' : false,
}, () => {
  const script = path.resolve('scripts/import-catalog.mjs');
  const catalogPath = 'data/imported-catalog.json';
  const manifestPath = 'imports/catalog-manifest.json';
  const editableFiles = ['data/categories.ts', 'data/subcategories.ts',
    ...fs.readdirSync('data/products', {recursive: true})
      .filter(file => file.endsWith('.ts')).map(file => path.join('data/products', file))];
  const editableContents = editableFiles.map(file => fs.readFileSync(file));
  const approved = read(catalogPath);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'metal-import-check-'));

  try {
    for (const directory of ['data', 'lib', 'imports']) {
      fs.cpSync(directory, path.join(temporary, directory), {recursive: true});
    }
    execFileSync(process.execPath, [script], {cwd: temporary});
    const outputs = [catalogPath, manifestPath];
    const firstPass = outputs.map(file => fs.readFileSync(path.join(temporary, file)));
    execFileSync(process.execPath, [script], {cwd: temporary});
    for (const [index, file] of outputs.entries()) {
      assert.ok(fs.readFileSync(path.join(temporary, file)).equals(firstPass[index]), `${file}: repeated import changed the output`);
    }
    for (const [index, file] of editableFiles.entries()) {
      assert.ok(fs.readFileSync(path.join(temporary, file)).equals(editableContents[index]), `${file}: importer changed an editable source`);
    }

    const catalog = read(path.join(temporary, catalogPath));
    assert.deepEqual(catalog.products.map(product => product.id), approved.products.map(product => product.id));
    for (const [index, product] of catalog.products.entries()) {
      assert.deepEqual(product, approved.products[index], product.id);
    }
    assert.deepEqual(catalog.matchedIds, approved.matchedIds);

    const cache = new Map();
    const {originalCategories} = readProjectData('data/categories.ts', cache);
    const {originalSubcategories} = readProjectData('data/subcategories.ts', cache);
    const {existingVariants} = readProjectData('data/products/index.ts', cache);
    const {isPublicProduct} = readProjectData('data/catalog-visibility.ts', cache);
    assert.deepEqual(catalog.categories.map(category => category.id), Array.from(originalCategories, category => category.id));
    assert.deepEqual(catalog.families.map(family => family.id), Array.from(originalSubcategories, family => family.id));
    const retained = existingVariants.filter(product => isPublicProduct(product) && !catalog.matchedIds.includes(product.id));
    const manifest = read(path.join(temporary, manifestPath));
    assert.equal(manifest.counts.after.variants, retained.length + catalog.products.length);
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
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
