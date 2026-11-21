import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const mapping=read('data/catalog-images.json');
const report=fs.existsSync('imports/image-mapping-report.json')?read('imports/image-mapping-report.json'):null;
const inventory=fs.existsSync('imports/image-source-inventory.json')?read('imports/image-source-inventory.json'):null;
const {normalizeRebarVariant}=readProjectData('lib/rebar.ts');
const {normalizeBeamVariant}=readProjectData('lib/beam.ts');
const {normalizePipeWeight}=readProjectData('lib/pipeWeight.ts');
const {normalizeGalvanizedVgpVariant}=readProjectData('lib/vgp.ts');
const {normalizeGalvanizedElectroweldedVariant}=readProjectData('lib/electroweldedPipe.ts');
const {isPublicProduct}=readProjectData('data/catalog-visibility.ts');
const imported=read('data/imported-catalog.json');
const {productVariants,existingVariants}=readProjectData('data/products/index.ts');
const retainedProductVariants=productVariants.filter(product=>!product.id.startsWith('rozmet-'));
// The legacy mapper reads editable products and the supplier import before public visibility filtering.
const mapperProducts=[
 ...existingVariants.filter(p=>!imported.matchedIds.includes(p.id)),
 ...imported.products,
];
const original=mapperProducts.filter(isPublicProduct).map(normalizeRebarVariant).map(normalizeBeamVariant).map(normalizeGalvanizedVgpVariant).map(normalizeGalvanizedElectroweldedVariant).map(normalizePipeWeight);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');

test('image overlay preserves every product field other than image references',()=>{
 assert.equal(retainedProductVariants.length,original.length);
 for(let i=0;i<original.length;i++){
  const {imageUrls:a,...before}=original[i];const {imageUrls:b,...after}=retainedProductVariants[i];
  assert.equal(JSON.stringify(after),JSON.stringify(before));
  if(!mapping.products[original[i].id])assert.equal(JSON.stringify(b),JSON.stringify(a.length?[mapping.fallback]:[]));
 }
});
test('all public catalog images exist and decode on case-sensitive filesystems',async()=>{
 const {productTypes}=readProjectData('data/productTypes.ts');
 const paths=new Set([...productVariants.flatMap(p=>p.imageUrls),...readProjectData('data/categories.ts').categories.map(c=>c.imageUrl),...productTypes.map(t=>t.imageUrl).filter(Boolean)]);
 for(const url of paths){
  assert(url.startsWith('/images/'),url);assert(fs.existsSync('public'+url),url);
  let directory='public';
  for(const part of url.slice(1).split('/')){assert(fs.readdirSync(directory).includes(part),'Exact path case: '+url);directory+='/'+part;}
  const {info}=await sharp('public'+url).raw().toBuffer({resolveWithObject:true});
  assert(info.width>1&&info.height>1,url);
 }
});

const {isTreadPlate, isGalvanizedSheet, isColdRolledSheet, isPlainHotRolledSheet, getSheetParameters} = readProjectData('lib/sheetPresentation.ts');
for (const {family, matches, count} of [
 {family: 'tread-plate', matches: isTreadPlate, count: 4},
 {family: 'galvanized-sheet', matches: isGalvanizedSheet, count: 3},
 {family: 'cold-rolled-sheet', matches: isColdRolledSheet, count: 2},
 {family: 'hot-rolled-sheet', matches: isPlainHotRolledSheet, count: 13},
]) {
 test(`${family} products receive distinct source-matched images and retain supplier facts`, async () => {
  const {applyCatalogOverrides} = readProjectData('lib/catalogOverrides.ts');
  const originals = read('data/rozmet-catalog.json').products.filter(matches);
  const illustrations = read(`data/${family}-images.json`).products;
  assert.equal(originals.length, count);
  assert.equal(Object.keys(illustrations).length, originals.length);
  assert.equal(new Set(Object.values(illustrations).map(image => image.imageUrl)).size, originals.length);

  for (const original of originals) {
   const published = productVariants.find(product => product.id === original.id);
   const {imageUrls, ...actual} = published;
   const {imageUrls: oldImages, ...expected} = original;
   assert.ok(oldImages.length);
   assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
   assert.equal(imageUrls.length, 1);
   assert.equal(imageUrls[0], illustrations[original.id].imageUrl);
   assert.equal(illustrations[original.id].sourceUrl, original.sourceReference);
   assert.ok(getSheetParameters(published));
   const {width, height} = await sharp(`public${imageUrls[0]}`).metadata();
   assert.deepEqual([width, height], [2400, 1800]);
   const differentSource = {...original, sourceReference: 'https://example.test/another-sheet'};
   assert.equal(applyCatalogOverrides(differentSource), differentSource);
  }
 });
}
const evidenceSkip=!report||!inventory||!fs.existsSync('brokinvest.ru')?'Optional supplier evidence is not present in this checkout':false;
test('copied image bytes match preserved supplier evidence',{skip:evidenceSkip},async()=>{
 const integrated=new Map(report.records.map(r=>[r.targetImage,r.sourceImage]));
 assert.equal(integrated.size,report.summary.uniqueImagesIntegrated);
 for(const [url,source] of integrated){
  const originalBytes=fs.readFileSync('brokinvest.ru/'+source),copied=fs.readFileSync('public'+url);
  assert.equal(digest(copied),digest(originalBytes));
  assert.equal(digest(originalBytes),inventory.images.find(i=>i.file===source).hash);
  const metadata=await sharp(copied).metadata();assert(metadata.width>1&&metadata.height>1);
 }
});
test('incompatible forms keep fallbacks instead of inheriting generic category imagery',()=>{
 for(const p of retainedProductVariants){
  if(p.form==='coil'||(/овальн|рифлен.*ромб|рифлён.*ромб|RAL|полимер/i.test(p.name)&&!p.profileMark))assert(!mapping.products[p.id],p.name);
  if(report&&p.categoryId==='cat-arm'&&/А240|А1(?:,|\s)/.test(p.name)&&mapping.products[p.id])assert(report.records.some(r=>r.targetId===p.id&&r.role==='smooth'),p.name);
  if(p.categoryId==='cat-otv'||p.categoryId==='cat-she'||p.categoryId==='cat-cve'||p.categoryId==='cat-trn')assert(!mapping.products[p.id],p.name);
 }
 if(report)assert(!report.records.some(r=>r.sourceImage.endsWith('0b3ca4e2-f21f-4255-857a-cc70976cbacf.jpeg')),'ambiguous strip photo must be rejected');
});
test('supplier report covers the mapper input and justifies each family image', {skip:evidenceSkip}, () => {
  const assigned = report.records.filter(record => record.targetKind === 'product');
  const assignmentsByProduct = new Map(assigned.map(record => [record.targetId, record]));
  const ids = [...assigned.map(record => record.targetId), ...report.unmatched.map(record => record.id)];
  assert.deepEqual(ids.sort(), mapperProducts.map(product => product.id).sort());
  assert.equal(report.summary.totalProducts, mapperProducts.length);
  assert.equal(report.summary.productsUpdated, assigned.length);

  for (const record of report.records) {
    assert.ok(record.sourcePages.length, record.targetId);
    assert.ok(record.evidence.length, record.targetId);
    assert.ok(['high', 'medium'].includes(record.confidence), record.targetId);
    for (const sourcePage of record.sourcePages) {
      assert.ok(fs.existsSync(`brokinvest.ru/${sourcePage}`), sourcePage);
    }
  }

  const reportedFamilies = report.records.filter(record => record.targetKind === 'productType');
  const familiesByType = new Map(imported.families.map(family => [`type-${family.id}`, family]));
  assert.equal(report.summary.productTypesUpdated, reportedFamilies.length);
  assert.equal(new Set(reportedFamilies.map(record => record.targetId)).size, reportedFamilies.length);
  for (const record of reportedFamilies) {
    const family = familiesByType.get(record.targetId);
    assert.ok(family, record.targetId);
    const members = mapperProducts.filter(product => product.subcategoryId === family.id);
    assert.ok(members.length, record.targetId);
    const matches = members.map(product => assignmentsByProduct.get(product.id));
    assert.ok(matches.every(match => match && match.role === record.role), record.targetId);
    assert.ok(matches.some(match => match.targetImage === record.targetImage && match.sourceImage === record.sourceImage), record.targetId);
  }
});
