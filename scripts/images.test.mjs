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
const {isPublicProduct}=readProjectData('data/catalog-visibility.ts');
const imported=read('data/imported-catalog.json');
const {productVariants,existingVariants}=readProjectData('data/products/index.ts');
const retainedProductVariants=productVariants.filter(product=>!product.id.startsWith('rozmet-'));
const original=[
 ...existingVariants.filter(p=>!imported.matchedIds.includes(p.id)),
 ...imported.products,
].filter(isPublicProduct).map(normalizeRebarVariant).map(normalizeBeamVariant).map(normalizePipeWeight);
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
  const metadata=await sharp('public'+url).metadata();assert(metadata.width>1&&metadata.height>1,url);
 }
});
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
test('report covers every product and mapped family, with provenance and confidence',{skip:evidenceSkip},()=>{
 const assigned=report.records.filter(r=>r.targetKind==='product');
 assert.equal(assigned.length,Object.keys(mapping.products).length);
 assert.equal(assigned.length+report.unmatched.length,productVariants.length);
 assert.equal(new Set([...assigned.map(p=>p.targetId),...report.unmatched.map(p=>p.id)]).size,productVariants.length);
 for(const r of report.records){assert(r.sourcePages.length);assert(r.evidence.length);assert(['high','medium'].includes(r.confidence));assert(fs.existsSync('brokinvest.ru/'+r.sourcePages[0]));}
 for(const [id,url] of Object.entries(mapping.types)){
  const members=productVariants.filter(p=>p.productTypeId===id);assert(members.length);assert(members.every(p=>mapping.products[p.id]));
  assert(assigned.some(r=>r.targetImage===url));
 }
});
