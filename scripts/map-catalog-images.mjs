import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('imports/image-source-inventory.json');
const catalog=read('data/imported-catalog.json');
const products=[...readProjectData('data/products/index.ts').existingVariants.filter(p=>!catalog.matchedIds.includes(p.id)),...catalog.products];
const normalize=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/(?<=\d)[х×](?=\d)/g,'x').replace(/\s+/g,' ').trim();
const byName=new Map(source.products.map(p=>[normalize(p.titleFull||p.title),p]));
const bySlug=new Map(source.products.map(p=>[p.slug,p]));
const category=id=>source.categories.find(c=>c.id===id);
const assetFor=id=>{
 const c=category(id),f=c?.files.find(f=>source.images.some(i=>i.file===`_back.brokinvest.ru/api/v1/files/catalog/${f.file}`));
 return f?{file:`_back.brokinvest.ru/api/v1/files/catalog/${f.file}`,pages:c.pages,sourceTitle:c.title,association:'category files in downloaded React server data'}:null;
};
// These scopes were checked against contact sheets and full-size originals.
// They describe visible form only; grades, standards and dimensions are never inferred from a photo.
const assets={
 ribbed:assetFor(10),beam:assetFor(15),channel:assetFor(16),square:assetFor(19),round:assetFor(5),
 hotSheet:assetFor(52),coldSheet:assetFor(53),zincSheet:assetFor(54),lentilSheet:assetFor(56),
 seamless:assetFor(65),erw:assetFor(3),vgp:assetFor(2),rectangular:assetFor(4),
 coil:{file:'_next/image.4bc85aa4cb.webp',pages:['index.html'],sourceTitle:'Рулоны',association:'homepage CategoryCard anchor to catalog/sk-oktyabrskii/rulon.html; img alt="Рулоны"'},
 flatStrip:{file:'_back.brokinvest.ru/api/v1/files/tmp/c6ef5aa9-fed6-4f03-846a-f87283c2fdf3.jpg',pages:['article.html'],sourceTitle:'Металлическая полоса',association:'downloaded editorial img alt="металлическая полоса"; visually verified narrow elongated rectangular solid strips'},
 smooth:{file:'_back.brokinvest.ru/api/v1/files/tmp/054a4653-bf3b-4427-ae0d-099e6f0c8845.jpg',pages:['article/chto-takoe-tverdost-metalla.html'],sourceTitle:'Арматура гладкая',association:'editorial img alt="арматура гладкая" next to reinforcement catalog link; photograph verified smooth round bars, not coils'},
 equalAngle:{file:'_back.brokinvest.ru/api/v1/files/tmp/7819ef62-ab6f-4320-bb92-735304e4ffed.jpg',pages:['article/razmery-stalnyh-ugolkov.html'],sourceTitle:'Стальной угол',association:'editorial article about angle dimensions, img alt="стальной угол"; photograph verified L profiles with equal legs'},
 steelWire:{file:'_back.brokinvest.ru/api/v1/files/catalog/b67a4a1c-94f5-4a74-8d24-757b80bca947.jpeg',pages:category(26)?.pages,sourceTitle:'Метизы',association:'category files; visually inspected steel wire coils'},
 electrodes:{file:'_next/image.4db25c0e51.webp',pages:['index.html'],sourceTitle:'Сварочные материалы',association:'homepage CategoryCard anchor to svarochniematerialy.html; illustration of electrodes'},
};
const squareSource=source.products.find(p=>/квадратн|профиль замкнутый\s+(\d+)x\1x/i.test(normalize(p.titleFull||p.title))&&p.files.some(f=>f.file.startsWith('catalogItem/')));
if(squareSource){const f=squareSource.files.find(f=>f.file.startsWith('catalogItem/'));assets.squarePipe={file:`_back.brokinvest.ru/api/v1/files/${f.file}`,pages:squareSource.pages,sourceTitle:squareSource.title,association:'square tube product files; full contact sheet confirms square hollow cross-section'};}

function roleFor(p){
 const n=normalize(p.name),details=normalize(p.name+' '+p.specifications.map(s=>`${s.name}: ${s.value}`).join('; '));
 const demoThickness=!p.imported?Number(n.match(/(\d+(?:[.,]\d+)?) мм/)?.[1]?.replace(',','.')):null;
 if(p.categoryId==='cat-lis'&&demoThickness&&((/холоднокатан/.test(n)&&demoThickness>3)||(/оцинк/.test(n)&&demoThickness>4)))return null;
 if(/оцинк|нержав|алюмин|медн|латун|полимер|ral|рифлен.*ромб/.test(n)){
  if(p.categoryId==='cat-lis'&&/^лист (оц|оцинк)/.test(n)&&!/(полимер|ral)/.test(n))return 'zincSheet';
  if(p.categoryId==='mirror-coils'&&/^рулон оц/.test(n)&&!/(полимер|ral)/.test(n))return 'coil';
  return null;
 }
 switch(p.categoryId){
  case 'cat-arm':return p.form==='coil'||/бунт|бухт/.test(details)?null:/гладк|а1\b|а240/.test(details)?'smooth':'ribbed';
  case 'cat-bal':return /сварн|специальн|балка \d+м/.test(n)?null:'beam';
  case 'cat-shv':return /гнут/.test(n)?null:'channel';
  case 'cat-kva':return /калибр/.test(n)?null:'square';
  case 'cat-kru':return /горячекатан/.test(n)?'round':null;
  case 'cat-pol':return 'flatStrip';
  case 'cat-ugo':{
   if(/неравнополочн/.test(n))return null;
   if(/равнополочн/.test(n))return 'equalAngle';
   const dims=n.match(/уголок\s+(\d+)x(\d+)x/);return dims&&dims[1]===dims[2]?'equalAngle':null;
  }
  case 'cat-lis':
   if(/горячекатан/.test(n))return 'hotSheet';
   if(/холоднокатан/.test(n))return 'coldSheet';
   if(/рифлен/.test(n)&&/чечевиц/.test(details)&&!/ромб/.test(details))return 'lentilSheet';
   return null;
  case 'cat-trs':return /бесшовн/.test(n)?'seamless':/электросвар|эсв|эшп/.test(n)?'erw':/водогаз|вгп/.test(n)?'vgp':null;
  case 'cat-trp':{
   if(/оваль/.test(n))return null;
   if(/квадратн/.test(n))return 'squarePipe';
   if(/прямоугольн/.test(n))return 'rectangular';
   const dims=n.match(/(?:замкнутый|профильная)\s+(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)/);
   return dims?dims[1]===dims[2]?'squarePipe':'rectangular':null;
  }
  case 'mirror-coils':return /холоднокатан/.test(n)?'coil':null;
  case 'mirror-welding':return /^электроды\s/.test(n)?'electrodes':null;
  default:return null;
 }
}

const previous=read('data/catalog-images.json');
const map={fallback:'/images/catalog/image-unavailable.svg',products:{},categories:{},types:{}};
const records=[],unmatched=[],copied=new Map();
fs.mkdirSync('public/images/catalog',{recursive:true});
function integrate(asset){
 assert(asset&&fs.existsSync(path.join('brokinvest.ru',asset.file)),`Missing reviewed asset ${asset?.file}`);
 const entry=source.images.find(i=>i.file===asset.file);assert(entry);
 if(copied.has(entry.hash))return copied.get(entry.hash);
 const url=`/images/catalog/${entry.hash.slice(0,20)}${path.extname(asset.file).toLowerCase()}`;
 fs.copyFileSync(path.join('brokinvest.ru',asset.file),'public'+url);
 copied.set(entry.hash,url);return url;
}
for(const p of products){
 const role=roleFor(p);let asset=assets[role];
 const exact=bySlug.get(p.slug)||byName.get(normalize(p.name));
 // A product-specific square tube photo takes precedence over an equivalent family photo.
 if(role==='squarePipe'&&exact){const f=exact.files.find(f=>f.file.startsWith('catalogItem/')&&source.images.some(i=>i.file===`_back.brokinvest.ru/api/v1/files/${f.file}`));if(f)asset={file:`_back.brokinvest.ru/api/v1/files/${f.file}`,pages:exact.pages,sourceTitle:exact.title,association:'exact product files; square cross-section visually verified'};}
 if(!asset){unmatched.push({id:p.id,name:p.name,existingImages:p.imageUrls,fallbackAction:p.imageUrls.length?'Missing original image reference replaced by shared neutral placeholder':'Existing text placeholder preserved',reason:'No downloaded, visually verified image for this product form, surface or subtype'});continue;}
 const target=integrate(asset);map.products[p.id]=target;
 const directFile=exact?.files.find(f=>asset.file.endsWith('/'+f.file));
 const direct=!!directFile;
 const evidencePages=directFile?.pages?.length?directFile.pages:exact?.pages.filter(p=>p.startsWith('product/'));
 records.push({targetKind:'product',targetId:p.id,targetName:p.name,targetImage:target,sourceImage:asset.file,sourcePages:direct?evidencePages.slice(0,1):asset.pages.slice(0,1),sourceTitle:asset.sourceTitle,sourceProduct:exact?.titleFull||exact?.title,role,matchPriority:direct?1:3,confidence:direct?'high':'medium',evidence:[asset.association,direct?'Exact source product explicitly references this image (possibly inherited category illustration)':'Explicit source family association plus reviewed visual equivalence',`Visible scope: ${role}; checked against target name and specifications. Illustration is not evidence of grade, ГОСТ or exact dimensions.`]});
}
const categoryRoles={'cat-arm':'ribbed','cat-bal':'beam','cat-kva':'square','cat-kru':'round','cat-lis':'hotSheet','cat-trs':'seamless','cat-trp':'rectangular','cat-shv':'channel','cat-pol':'flatStrip','cat-ugo':'equalAngle','cat-pro':'steelWire','mirror-coils':'coil','mirror-welding':'electrodes'};
for(const c of catalog.categories){const role=categoryRoles[c.id],asset=assets[role];if(!asset)continue;const target=integrate(asset);map.categories[c.id]=target;records.push({targetKind:'category',targetId:c.id,targetName:c.name,targetImage:target,sourceImage:asset.file,sourcePages:asset.pages.slice(0,1),sourceTitle:asset.sourceTitle,confidence:'high',matchPriority:4,evidence:[asset.association,'Representative category image only; not propagated to incompatible product variants']});}
for(const f of catalog.families){
 const members=products.filter(p=>p.subcategoryId===f.id),matches=records.filter(r=>r.targetKind==='product'&&members.some(p=>p.id===r.targetId));
 // Mixed/unmatched families keep their text placeholder, avoiding a bar photo for coil variants etc.
 if(!members.length||matches.length!==members.length||new Set(matches.map(r=>r.role)).size!==1)continue;
 const r=matches[0],id=`type-${f.id}`;map.types[id]=r.targetImage;records.push({...r,targetKind:'productType',targetId:id,targetName:f.name,confidence:'medium',evidence:[...r.evidence,'All variants in this family passed the same reviewed visual scope']});
}
const before=products.filter(p=>p.imageUrls.some(url=>fs.existsSync('public'+url))).length;
const after=products.filter(p=>map.products[p.id]||p.imageUrls.some(url=>fs.existsSync('public'+url))).length;
const summary={sourceDirectory:'brokinvest.ru',sourceHtmlPages:2005,discoveredImageFiles:source.images.length,discoveredUniqueImageContents:new Set(source.images.map(i=>i.hash)).size,uniqueImagesIntegrated:copied.size,totalProducts:products.length,productsUpdated:Object.keys(map.products).length,categoriesUpdated:Object.keys(map.categories).length,productTypesUpdated:Object.keys(map.types).length,productsWithImageBefore:before,productsWithImageAfter:after,coverageBeforePercent:Number((100*before/products.length).toFixed(2)),coverageAfterPercent:Number((100*after/products.length).toFixed(2)),originalProductsWithImageReferences:products.filter(p=>p.imageUrls.length).length,originalProductsWithBrokenImageReferences:products.filter(p=>p.imageUrls.length&&!p.imageUrls.some(url=>fs.existsSync('public'+url))).length,productsWithNewSourcePhotos:Object.keys(map.products).length,productsWithoutReliableNewMatch:unmatched.length};
const review=[
 {sourceCategory:'Полоса',image:category(20)?.files,decision:'Rejected for strip products: photograph shows broad stacked plates; source association alone does not establish narrow strip geometry.'},
 {sourceCategory:'Арматура А1 / А240',decision:'Rejected inherited ribbed bar image. Verified smooth-bar editorial photo used for straight A1/A240 bars; coils remain unmatched.'},
 {sourceCategory:'Лист с рифлением',decision:'Lentil pattern verified visually; rejected for rhombus pattern and unspecified pattern.'},
 {sourceCategory:'Электроды',decision:'Packaging photo not assigned to named brands/models. Generic coated-stick electrode illustration represents the shared visible product type without asserting brand, coating chemistry or standard.'},
 {sourceCategory:'Уголок',decision:'Original category file absent. Editorial equal-leg angle photograph used for equal-leg variants only; unequal-leg, galvanized and stainless variants remain unmatched.'},
 {sourceCategory:'Рулоны',decision:'Silver unpainted coil illustration excluded from RAL/polymer coated and hot rolled variants.'},
 {sourceCategory:'Editorial images',decision:'Some editorial alt labels contradict the visible product (angles labelled channels, ribbed bars labelled smooth). These contradictory images were rejected; only visually corroborated descriptions were used.'},
];
fs.writeFileSync('data/catalog-images.json',JSON.stringify(map,null,2)+'\n');
const currentPaths=new Set(copied.values());
for(const old of new Set(Object.values(previous.products).concat(Object.values(previous.categories),Object.values(previous.types)))){
 if(/^\/images\/catalog\/[a-f0-9]{20}\.(jpg|jpeg|png|webp)$/.test(old)&&!currentPaths.has(old)&&fs.existsSync('public'+old))fs.unlinkSync('public'+old);
}
fs.writeFileSync('imports/image-mapping-report.json',JSON.stringify({summary,coverageDefinition:'Products with resolvable real images. Missing original SVG references and the neutral image-unavailable placeholder are not counted. Source grade/standard/dimensions are never inferred from appearance.',records,unmatched,manualReview:review},null,2)+'\n');
fs.writeFileSync('docs/catalog-images.md',`# Catalog images

Regenerate with:

1. \`node scripts/scan-images.mjs\`
2. \`node scripts/supplement-content-images.mjs\`
3. \`node scripts/map-catalog-images.mjs\`

The downloaded mirror is read only. Runtime mappings are separate from the catalog import so re-importing prices and specifications preserves images. The scanner extracts product files, gallery URLs (including renamed download extensions), categories and source page evidence. Editorial image alt text and surrounding descriptions are inventoried separately and checked visually before use.

${Object.entries(summary).map(([k,v])=>`- ${k}: ${v}`).join('\n')}

Coverage counts resolvable real images only: ${summary.coverageBeforePercent}% before, ${summary.coverageAfterPercent}% after. All 122 original product image references pointed to missing SVG files; absent images are now represented by a shared neutral placeholder where a fallback previously existed. Placeholders are excluded from coverage. Images illustrate reviewed form and surface, not certified grade, standard or exact dimensions.

Full per-target provenance, confidence and unassigned products: [mapping report](../imports/image-mapping-report.json). Recursive source inventory: [source inventory](../imports/image-source-inventory.json). Browser results: [browser verification](../imports/image-browser-verification.json).

## Rejected or uncertain source associations

${review.map(r=>`- ${r.sourceCategory}: ${r.decision}`).join('\n')}

No uncertain matches are automatically assigned. Medium confidence means a reviewed family illustration reused for visually equivalent variants, rather than a photograph of that exact size. Mixed families retain their existing card placeholder. There are seven rejected or restricted source association groups above, all documented for optional manual review.

## Validation

- \`node --test scripts/images.test.mjs\`: image paths, decoding, source byte identity, incompatible subtype exclusions and preservation of every non-image product field.
- \`npm run catalog:check\`: catalog and cart checks, including byte-identical re-import.
- \`npm run lint -- --ignore-pattern 'brokinvest.ru/**'\`: application lint. Unscoped lint also scans downloaded donor JavaScript, which contains unrelated lint errors.
- \`npm run build\`: production build and TypeScript validation.
- \`node scripts/check-catalog-images-browser.mjs\`: running local server on port 3000 and headless Chrome debugging on port 9223; desktop/mobile checks for loaded images, alt text, expected mapping, preserved aspect ratio and horizontal overflow.
`);
console.log(summary);
