import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readProjectData} from './project-data.mjs';

const json = file=>JSON.parse(fs.readFileSync(file,'utf8'));
const source=json('imports/rozmet-source.json'), imported=json('data/rozmet-catalog.json');
const baseline=json('imports/rozmet-protected.snapshot.json');
const cache=new Map();
const {categories}=readProjectData('data/categories.ts',cache);
const {subcategories}=readProjectData('data/subcategories.ts',cache);
const {productVariants}=readProjectData('data/products/index.ts',cache);
const {productTypes}=readProjectData('data/productTypes.ts',cache);
const catalog=readProjectData('lib/catalog.ts',cache);
const {catalogProductPath}=readProjectData('lib/catalogLinks.ts',cache);
const {revalidateCartPrice}=readProjectData('lib/cartPricing.ts',cache);
const {createCartLines}=readProjectData('lib/cart.ts',cache);
const protectedIds=new Set(baseline.categories.map(item=>item.id));

test('re-import from saved evidence is identical and does not duplicate products',()=>{
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'metal-rozmet-import-'));
  try {
    for(const file of ['imports/rozmet-source.json','imports/rozmet-protected.snapshot.json','data/catalog-images.json']) {
      const target=path.join(temporary,file);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.copyFileSync(file,target);
    }
    execFileSync(process.execPath,[path.resolve('scripts/import-rozmet.mjs')],{cwd:temporary});
    for(const file of ['data/rozmet-catalog.json','data/rozmet-routes.json','data/catalog-images.json']) {
      assert.equal(fs.readFileSync(path.join(temporary,file),'utf8'),fs.readFileSync(file,'utf8'),file);
    }
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

test('all protected category positions, data, product types and image bytes are unchanged',()=>{
  for(const [key,actual] of [['categories',categories],['subcategories',subcategories],['products',productVariants],['types',productTypes]]) {
    const selected=actual.filter(item=>protectedIds.has(key==='categories'?item.id:item.categoryId));
    assert.equal(JSON.stringify(selected),JSON.stringify(baseline[key]),key);
  }
  for(const {id,index} of baseline.categoryOrder) assert.equal(categories[index].id,id);
  for(const [image,hash] of Object.entries(baseline.imagesSha256)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public'+image)).digest('hex'),hash,image);
  }
});

test('every discovered source section and unique product is imported once under its original parent',()=>{
  assert.equal(imported.categories.length,source.roots.length);
  assert.equal(imported.subcategories.filter(item=>!item.internal).length,source.sections.length-source.roots.length);
  assert.equal(imported.products.length,source.products.length);
  for(const key of ['id','slug','sku']) assert.equal(new Set(productVariants.map(item=>item[key])).size,productVariants.length,key);
  for(const product of imported.products) {
    const parent=catalog.getSubcategoryById(product.subcategoryId);
    const category=catalog.getCategoryById(product.categoryId);
    assert.ok(parent&&category,product.id);
    assert.equal(parent.categoryId,category.id);
    const section=source.sections.filter(item=>product.sourceReference.startsWith(item.url)).sort((a,b)=>b.url.length-a.url.length)[0];
    assert.ok(section,product.id);
    assert.equal(parent.name,section.name);
    assert.ok(catalog.getProductTypeById(product.productTypeId));
  }
});

test('names, source articles, final prices, descriptions, explicit specifications and units match source cards',()=>{
  const units={H87:'piece',MTR:'meter',MTK:'square_meter',KGM:'kg'};
  for(const product of imported.products) {
    const original=source.products.find(item=>item.url===product.sourceReference);
    assert.ok(original,product.id);
    for(const field of ['name','price','description','sku']) assert.equal(product[field],original[field],product.id+': '+field);
    assert.equal(product.unit,units[original.unitCode]);
    assert.equal(product.price,Number(original.schemaPrice));
    for(const [name,value] of Object.entries(original.specifications)) assert.ok(product.specifications.some(item=>item.name===name&&item.value===value),product.id+': '+name);
    assert.equal(product.imageUrls.length,original.images.length);
    assert.equal(product.weight,undefined);
    assert.equal(product.standard,'');
    assert.equal(product.material,'');
  }
  for(const section of source.sections) {
    const item=source.roots.includes(section.url)
      ? imported.categories.find(item=>item.name===section.name)
      : imported.subcategories.find(item=>item.name===section.name);
    assert.equal(item.description,[section.intro,section.details].filter(Boolean).join('\n\n'));
  }
});

test('source leaves have no visible artificial level and real subcategories resolve through existing routes',()=>{
  for(const category of imported.categories) {
    const type=productTypes.find(type=>type.categoryId===category.id);
    const url=catalogProductPath(category.slug,type.subcategorySlug,type.slug,'sample');
    if(category.directProducts) assert.equal(url,`/catalog/${category.slug}#variant-sample`);
    else assert.equal(url,`/catalog/${category.slug}/${type.subcategorySlug}/${type.slug}#variant-sample`);
  }
});

test('source piece quantities are integers while metre, square-metre and kilogram prices calculate correctly in cart and server',()=>{
  const {formatUnitPrice}=readProjectData('lib/currency.ts');
  for(const unit of ['piece','meter','square_meter','kg']) {
    const product=imported.products.find(item=>item.unit===unit&&item.availability==='IN_STOCK');
    assert.ok(product,unit);
    const quantity=unit==='piece'?3:2.5;
    const price=revalidateCartPrice(product,{quantity});
    assert.equal(price.invalidReason,undefined);
    assert.equal(price.estimatedTotal,Math.round(product.price*quantity*100)/100);
    const line=createCartLines([{productId:product.id,quantity}])[0];
    assert.equal(line.estimatedTotal,price.estimatedTotal);
    if(unit==='square_meter') {assert.equal(line.quantityUnit,'м²');assert.ok(formatUnitPrice(product.price,product.priceUnit).endsWith('/м²'));}
    if(unit==='piece') assert.ok(revalidateCartPrice(product,{quantity:1.5}).invalidReason);
  }
});
