import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';
const {beamSubcategoryId} = readProjectData('lib/beam.ts');
import {discountedPrice,parsePrice} from './pricing.mjs';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const inventory=json('imports/mirror-inventory.json');
const overrides=json('imports/overrides.json');
const baselinePath='imports/baseline.json';
if(!fs.existsSync(baselinePath))write(baselinePath,{
 categories:readProjectData('data/categories.ts').categories,
 families:readProjectData('data/subcategories.ts').subcategories,
 products:readProjectData('data/products/index.ts').productVariants,
});
const baseline={categories:readProjectData('data/categories.ts').originalCategories||json(baselinePath).categories,families:readProjectData('data/subcategories.ts').originalSubcategories||json(baselinePath).families,products:readProjectData('data/products/index.ts').existingVariants||json(baselinePath).products};
const clean=x=>String(x??'').replace(/[\s\u00a0\u202f]+/g,' ').trim();
const identity=x=>clean(x).toLowerCase().replace(/[хx×]/g,'×').replace(/(\d),(\d)/g,'$1.$2');
const categories=structuredClone(baseline.categories),families=structuredClone(baseline.families);
const byId=new Map(inventory.categories.map(c=>[c.id,c]));
const classified=(r)=>{
 const n=clean(r.titleFull||r.title).toLowerCase();
 if(/^арматура/.test(n))return 'cat-arm';
 if(/^балка/.test(n))return 'cat-bal';
 if(/^швеллер/.test(n))return 'cat-shv';
 if(/^угол/.test(n))return 'cat-ugo';
 if(/^лист|^профнастил/.test(n))return 'cat-lis';
 if(/^рулон/.test(n))return 'mirror-coils';
 if(/^труб/.test(n))return /профил|квадрат|прямоуг/.test(n)?'cat-trp':/нерж/.test(n)?'cat-trn':'cat-trs';
 if(/^профиль замкнутый/.test(n))return 'cat-trp';
 if(/^круг|^прокат круг/.test(n))return 'cat-kru';
 if(/^квадрат/.test(n))return 'cat-kva';
 if(/^полос/.test(n))return 'cat-pol';
 if(/^лент/.test(n))return 'mirror-strip';
 if(/^электрод|^проволока свар/.test(n))return 'mirror-welding';
 if(/^проволок/.test(n))return 'cat-pro';
 if(/^катанк/.test(n))return 'cat-kat';
 if(/^отвод/.test(n))return 'cat-otv';
 if(/^шестигран/.test(n))return 'cat-she';
 return null;
};
// Resolve existing IDs from actual category slugs rather than guessing prefixes.
const categoryAlias={ 'cat-shv':'shveller','cat-ugo':'ugolok','cat-trp':'truby-profilnye','cat-trn':'truby-nerzhaveyushchie','cat-trs':'truby-stalnye','cat-pro':'provoloka','cat-she':'shestigrannik'};
const newCategories=[['mirror-coils','Рулоны','rulony'],['mirror-strip','Лента','lenta'],['mirror-welding','Сварочные материалы','svarochnye-materialy']];
const guidance={
 'cat-arm':'Арматурный прокат для железобетонных конструкций. При выборе сопоставляйте номинальный диаметр, класс, марку стали, форму поставки и длину; класс и марка стали — разные характеристики.',
 'cat-bal':'Двутавровые балки различаются полным обозначением сечения и серией. Для подбора сверяйте обозначение профиля, материал, стандарт и длину.',
 'shveller':'Швеллеры с П-образным сечением. Номер и серия профиля определяют исполнение; дополнительно сопоставляйте марку стали, стандарт и длину.',
 'ugolok':'Уголковый прокат с двумя полками. Для равнополочных и неравнополочных исполнений нужны размеры обеих полок, толщина, марка стали и длина.',
 'cat-lis':'Листовой прокат различается способом изготовления, поверхностью и покрытием. Сверяйте толщину, ширину и длину листа, марку материала и стандарт; профнастил выбирайте также по обозначению профиля.',
 'truby-stalnye':'Круглые стальные трубы разных исполнений. Для подбора нужны диаметр, толщина стенки, материал и длина. У ВГП условный проход DN следует отличать от наружного диаметра.',
 'truby-profilnye':'Профильные трубы с некруглым сечением. Сопоставляйте обе стороны профиля, толщину стенки, марку стали, стандарт и длину.',
 'cat-kru':'Сплошной круглый прокат. Основной размер — диаметр; также сопоставляйте марку материала, стандарт и условие длины.',
 'cat-kva':'Сплошной квадратный прокат. Размер обозначает сторону сечения; выбирайте материал, исполнение и длину по характеристикам позиции.',
 'cat-pol':'Полосовой прокат прямоугольного сечения. Для подбора нужны ширина и толщина полосы, материал, стандарт и длина.',
 'provoloka':'Стальная проволока различается диаметром, состоянием и поверхностью. Сверяйте марку материала, покрытие и форму поставки конкретного исполнения.',
 'shestigrannik':'Сплошной прокат шестигранного сечения. Размер под ключ обозначает расстояние между параллельными гранями; дополнительно сопоставляйте материал, стандарт и длину по полному обозначению.',
 'mirror-coils':'Плоский прокат в рулонах. В отличие от листа фиксированной длины, рулон выбирают по толщине, ширине, материалу и покрытию.',
 'mirror-strip':'Металлическая лента различается шириной, толщиной и состоянием материала. Сопоставляйте размеры и исполнение, указанные для конкретной позиции.',
 'mirror-welding':'Электроды и сварочная проволока предназначены для сварочных работ. Выбирайте вид материала, марку, диаметр и форму поставки по обозначению конкретной позиции.',
};
function categoryId(r){const c=classified(r);return categoryAlias[c]?categories.find(x=>x.slug===categoryAlias[c])?.id:c;}
function categoryFor(r){
 const id=categoryId(r);if(!id)return null;
 let c=categories.find(x=>x.id===id);
 if(!c){const n=newCategories.find(x=>x[0]===id);if(!n)return null;c={id,name:n[1],slug:n[2],shortDescription:guidance[id],description:guidance[id],imageUrl:'/images/categories/listovoy-prokat.svg'};categories.push(c);}
 return c;
}
const sourceGroups=new Map();
for(const entry of inventory.records){const key=String(entry.record.id);const a=sourceGroups.get(key)||[];a.push(entry);sourceGroups.set(key,a);}
const unitsByPath=new Map();for(const {record:r} of inventory.records){const units=unitsByPath.get(r.staticPath)||new Set();if(r.unit)units.add(r.unit);unitsByPath.set(r.staticPath,units);}
const distinctOffers=new Set(inventory.records.map(({record:r})=>JSON.stringify([r.staticPath,r.stockId,r.price,r.unit||(unitsByPath.get(r.staticPath).size===1?[...unitsByPath.get(r.staticPath)][0]:null)])));
const imported=[],manifest=[],matched=new Set();
const regionStocks=new Set(inventory.contexts.filter(x=>x.regionId===1).map(x=>x.stock.id));
for(const [sourceId,entries] of [...sourceGroups].sort((a,b)=>Number(a[0])-Number(b[0]))){
 const candidates=entries;
 const applicable=candidates.filter(e=>regionStocks.has(e.record.stockId));
 // Prefer explicitly saved default Moscow context (stock 5), never cheapest across warehouses.
 const preferred=applicable.filter(e=>e.record.stockId===5);
 const pool=preferred.length?preferred:applicable;
 const selected=(pool.length?pool:candidates).slice().sort((a,b)=>Number(!!b.record.unit)-Number(!!a.record.unit)||a.file.localeCompare(b.file))[0];
 const r=selected.record;
 const issues=[];
 const category=categoryFor(r);
 const entry={sourceId,files:entries.map(e=>e.file),originalUrl:`https://www.brokinvest.ru/product/${r.staticPath}`,rawOffers:entries.map(e=>({file:e.file,record:e.record})),issues};
 const exclusion=overrides.excludedSourceIds?.[sourceId];
 if(exclusion){manifest.push({...entry,status:'excluded',reason:exclusion.reason,replacementProductId:exclusion.replacementProductId});continue;}
 // Owner keeps only the two local square/rectangular pipe families; do not recreate the removed imported family.
 if(category?.id==='cat-trp'){manifest.push({...entry,status:'excluded',reason:'Удалено по указанию владельца: оставлены только локальные подкатегории квадратной и прямоугольной профильной трубы.'});continue;}
 if(!category){manifest.push({...entry,status:'excluded',reason:'Не определён продуктовый раздел; требуется разбор записи'});continue;}
 if(!clean(r.title)||!r.staticPath){manifest.push({...entry,status:'incomplete',reason:'Нет однозначного обозначения'});continue;}
 if(!pool.length)issues.push('Нет московского предложения: цена по запросу');
 const knownUnits=[...new Set(entries.map(e=>e.record.unit).filter(Boolean))];
 const sourceUnit=r.unit||(knownUnits.length===1?knownUnits[0]:null);
 const compare=pool.map(e=>JSON.stringify([e.record.price,e.record.unit??sourceUnit]));
 const priceConflict=new Set(compare).size>1;
 if(priceConflict)issues.push('Конфликт цен одинаково применимых записей: цена по запросу');
 const unit=sourceUnit;
 const units={'т':['ton','за тонну'],'м':['meter','за метр'],'шт':['piece','за штуку'],'шт.':['piece','за штуку'],'кг':['kg','за килограмм']};
 if(!units[unit])issues.push('Единица цены не сохранена или не поддерживается: цена по запросу');
 const priceInput=overrides.sourcePrices?.[sourceId]??r.price;
 let price=pool.length&&!priceConflict&&units[unit]?discountedPrice(priceInput):null;
 if(discountedPrice(r.price)===null)issues.push('Нулевая, отсутствующая или ненормализуемая исходная цена: цена по запросу');
 const chars=(r.characteristics||[]).filter(c=>clean(c.value));
 const isVgp=/водогаз|ВГП/i.test(r.titleFull||r.title);
 const characteristicLabel=c=>c.slug==='surface_type'?'Поверхность':isVgp&&c.slug==='diameter'?'Условный проход DN, мм':category.id==='cat-arm'&&['size','diameter'].includes(c.slug)?'Номинальный диаметр, мм':clean(c.title);
 const specSignatures=new Set(pool.filter(e=>e.record.unit).map(e=>JSON.stringify([e.record.titleFull,e.record.gost,e.record.material,e.record.characteristics])));
 if(specSignatures.size>1)issues.push('Расхождение характеристик между сохранёнными копиями; исходные значения сохранены в rawOffers');
 const specificationMap=new Map();
 for(const c of chars)specificationMap.set(characteristicLabel(c),clean(c.value));
 if(clean(r.gost))specificationMap.set('Стандарт',clean(r.gost));
 if(clean(r.material))specificationMap.set('Материал',clean(r.material));
 // The full designation is retained intact even when individual fields were not captured.
 const name=clean(r.titleFull||r.title);
 const designationGrade=clean(name.match(/(?:^| )((?:Ст\d[а-яА-Я0-9/()]*|09Г2С|25Г2С|35ГС|[СC]\d{3}))(?= |$)/u)?.[1]);
 if(designationGrade&&!chars.some(c=>c.slug==='steel_grade'))specificationMap.set('Марка стали',designationGrade);
 if(/бухт|бунт/i.test(name))specificationMap.set('Форма поставки',/бухт/i.test(name)?'Бухта':'Бунт');
 if(/^Рулон/i.test(name))specificationMap.set('Форма поставки','Рулон');
 const rebarClass=category.id==='cat-arm'?clean(name.match(/(?:^| )([АA]\d{3}[СC]?)(?= |$)/u)?.[1]):'';
 if(rebarClass)specificationMap.set('Класс арматуры',rebarClass);
 const rebarGrade=category.id==='cat-arm'?clean(name.match(/(?:25Г2С|35ГС|Ст\d[а-яА-Я0-9]*)/u)?.[0]):'';
 if(rebarGrade&&!chars.some(c=>c.slug==='steel_grade'))specificationMap.set('Марка стали',rebarGrade);
 specificationMap.set('Полное обозначение',name);
 const specs=[...specificationMap].map(([name,value])=>({name,value}));
 const get=slug=>clean(chars.find(c=>c.slug===slug)?.value);
 const rawCat=r.admin_sub_categories?.[0]||r.admin_category;
 let family=rawCat&&rawCat.parentId?byId.get(rawCat.id):null;
 if(category.id==='cat-arm'){
   const token=/А500[СC]/i.test(name)?13:/25Г2С/i.test(name)?12:/А240|А1\b/i.test(name)?11:null;
   if(token)family=byId.get(token);
 }
 if(category.id==='cat-lis'){
   const token=/профнастил/i.test(name)?66:/полимер/i.test(name)?67:/рифл/i.test(name)?56:/оцинк/i.test(name)?54:/холоднокат/i.test(name)?53:/горячекат/i.test(name)?52:null;
   if(token)family=byId.get(token);
 }
 if(category.id==='cat-trp')family=byId.get(4);
 if(category.id==='cat-trs')family=byId.get(/водогаз|ВГП/i.test(name)?2:/бесшов/i.test(name)?65:3);
 if(category.id==='mirror-coils')family=byId.get(/полимер/i.test(name)?73:/оцинк|\bОЦ\b| оц /i.test(name)?72:/холоднокат| хк /i.test(name)?71:/горячекат| гк /i.test(name)?70:69);
 const familyName=family?.title||r.admin_category?.title||category.name;
 const familySlug=family?.staticPath||r.admin_category?.staticPath||category.slug;
 // Group actual product types, not each size/filter combination.
 let familyId=`mirror-family-${category.id}-${family?.id||r.admin_category?.id||'general'}`;
 const mappedFamily={11:'cat-arm-sub-4',12:'cat-arm-sub-3',13:'cat-arm-sub-1',52:'cat-lis-sub-1',53:'cat-lis-sub-2',54:'cat-lis-sub-3',56:'cat-lis-sub-4',2:'cat-trs-sub-3',3:'cat-trs-sub-4',65:'cat-trs-sub-1'}[family?.id];
 const beamFamily=category.id==='cat-bal'?beamSubcategoryId({name,categoryId:category.id,attributes:[]}):undefined;
 const existingFamily=families.find(f=>f.id===(beamFamily||mappedFamily)&&f.categoryId===category.id)||(families.find(f=>f.categoryId===category.id&&identity(f.name)===identity(familyName)));
 if(existingFamily)familyId=existingFamily.id;
 let f=families.find(f=>f.id===familyId);
 if(!f){f={id:familyId,categoryId:category.id,name:familyName,slug:familySlug,shortDescription:'',description:''};families.push(f);}
 const attrs=[];
 const attr=(key,label,value)=>{if(value)attrs.push({key,label,value});};
 attr('material','Материал',clean(r.material)||get('material'));
 attr('standard','Стандарт',clean(r.gost));
 attr('grade','Марка стали',get('steel_grade'));
 if(!get('steel_grade'))attr('grade','Марка стали',designationGrade||rebarGrade);
 attr('class','Класс арматуры',rebarClass);
 const dimension=chars.filter(c=>['size','diameter','thickness','width','height','gage'].includes(c.slug));
 attr('size','Размеры',dimension.map(c=>`${characteristicLabel(c)}: ${clean(c.value)}`).join('; '));
 attr('length',clean(chars.find(c=>c.slug==='length')?.title)||'Длина',get('length'));
 const desc=specs.filter(s=>s.name!=='Полное обозначение').map(s=>`${s.name}: ${s.value}`).join('; ');
 const exactMatch=baseline.products.filter(p=>identity(p.name)===identity(name));
 const overrideMatch=overrides.matches[sourceId];
 const old=overrideMatch?baseline.products.find(p=>p.id===overrideMatch):exactMatch.length===1?exactMatch[0]:null;
 if(old)matched.add(old.id);
 const id=old?.id||`local-${sourceId}`;
 const product={id,categoryId:category.id,subcategoryId:f.id,productTypeId:`type-${f.id}`,name,slug:old?.slug||r.staticPath,sku:old?.sku||`МП-${sourceId}`,shortDescription:desc||name,description:`${name}. ${desc?desc+'. ':''}При заказе сверяйте полное обозначение и характеристики исполнения.`,price,quoteOnly:price===null,priceQualifier:parsePrice(priceInput)?.qualifier||'exact',currency:'RUB',unit:units[unit]?.[0]||'piece',priceUnit:units[unit]?.[1]||'',material:clean(r.material)||get('material'),standard:clean(r.gost),availability:'UNKNOWN',inStock:false,featured:false,imageUrls:old?.imageUrls||[],attributes:attrs,specifications:specs,imported:true};
 if(price!==null&&unit==='т')product.pricePerTon=price;
 const duplicate=imported.find(p=>p.slug===product.slug&&identity(p.name)===identity(product.name));
 if(duplicate){
   if(duplicate.price!==product.price){duplicate.price=null;duplicate.quoteOnly=true;delete duplicate.pricePerTon;issues.push('Конфликт цены у повторного идентификатора того же обозначения');}
   manifest.push({...entry,status:'merged-duplicate',productId:duplicate.id,reason:'Повторный ID с тем же URL и полным обозначением; сохранён первый стабильный ID'});
   continue;
 }
 if(imported.some(p=>p.slug===product.slug))product.slug+=`-${sourceId}`;
 // No estimated mass, guessed geometry, factory expansion or donor availability.
 Object.assign(product,overrides.products[sourceId]||{});
 imported.push(product);
 manifest.push({...entry,status:old?'updated':'imported',productId:id,chosenFile:selected.file,stockId:r.stockId,regionRule:'Москва, регион 1; склад 5 — сохранённый основной контекст; иные регионы не дают публичной цены',originalPrice:r.price,sourcePriceOverride:overrides.sourcePrices?.[sourceId]??null,priceInput,priceUnit:unit??null,currency:'RUB',qualifier:product.priceQualifier,ourPrice:price,updatedAt:r.updatedAt??null,normalizedSpecifications:specs,priceContext:{kind:'saved-public-product-price',regionId:pool.length?1:null,stockId:r.stockId,tier:null,volumeThreshold:null,vatQualifier:null,unitEvidenceFiles:entries.filter(e=>e.record.unit===unit).map(e=>e.file)}});
}
const used=new Set(imported.map(p=>p.categoryId));
for(const c of categories)if(used.has(c.id)){
 const description=guidance[c.id]||guidance[c.slug];if(description)c.description=c.shortDescription=description;
 Object.assign(c,overrides.categories[c.id]||{});
}
for(const f of families)if(imported.some(p=>p.subcategoryId===f.id)){
 const c=categories.find(c=>c.id===f.categoryId);
 const definitions={
  'cat-arm-sub-1':'Арматура рифлёная А500С. Класс следует отличать от марки стали; выбирайте номинальный диаметр, длину и стандарт исполнения.',
  'cat-arm-sub-3':'Арматура рифлёная А400 (А3), 25Г2С. Сопоставляйте номинальный диаметр и длину, а также стандарт конкретной позиции: в обозначениях встречаются разные ГОСТ.',
  'cat-arm-sub-4':'Арматура гладкая А240 (А1). В отличие от рифлёных исполнений имеет гладкую поверхность. Для подбора нужны номинальный диаметр, длина и стандарт позиции.',
  'cat-lis-sub-1':'Горячекатаный листовой прокат. Для выбора нужны толщина, ширина и длина листа, марка стали и стандарт; размеры приведены в миллиметрах.',
  'cat-lis-sub-2':'Холоднокатаный листовой прокат. Способ прокатки отличает его от горячекатаного; дополнительно сверяйте толщину, формат, марку стали и указанное состояние поверхности.',
  'cat-lis-sub-3':'Листы с оцинкованной поверхностью. Покрытие отличает их от листа без покрытия; выбирайте толщину, ширину, длину и обозначение исполнения.',
  'cat-lis-sub-4':'Листы с рифлением поверхности. Сопоставляйте обозначение рифления, толщину и формат листа, материал и стандарт конкретного исполнения.',
  'cat-trs-sub-3':'Водогазопроводные трубы. DN обозначает условный проход, который отличается от наружного диаметра. Для выбора нужны DN, толщина стенки, длина и исполнение поверхности.',
  'cat-trs-sub-4':'Электросварные прямошовные трубы. В отличие от бесшовных исполнений имеют сварной шов; выбирайте наружный диаметр, толщину стенки, материал и условие длины.',
  'cat-trs-sub-1':'Бесшовные трубы горячедеформированного исполнения. Для подбора сопоставляйте наружный диаметр и стенку, марку стали, стандарты и мерную либо немерную длину.',
 };
 const standards=[...new Set(imported.filter(p=>p.subcategoryId===f.id).map(p=>p.standard).filter(Boolean))];
 f.description=(definitions[f.id]||`${f.name}. ${c.description}`)+(standards.length&&standards.length<=4?` Стандарты представленных исполнений: ${standards.join('; ')}.`:'');
 f.shortDescription=f.description;
 Object.assign(f,overrides.families[f.id]||{});
}
const retained=baseline.products.filter(p=>!matched.has(p.id));
write('data/imported-catalog.json',{categories,families,products:imported,matchedIds:[...matched]});
write('imports/catalog-manifest.json',{snapshotDate:null,regionStocks:[...regionStocks],rule:'Регион 1, основной сохранённый склад 5; минимальная цена между складами не выбирается. Неизвестный регион, единица или конфликт — запрос цены. Тарифы объёма не выявлены в структурированных записях.',records:manifest,counts:{before:{categories:baseline.categories.length,types:baseline.families.length,variants:baseline.products.length},after:{categories:categories.length,types:families.length,variants:retained.length+imported.length},sourceOccurrences:inventory.records.length,sourceProducts:sourceGroups.size,distinctSourceOffers:distinctOffers.size,imported:manifest.filter(x=>x.status==='imported').length,updated:matched.size,duplicates:inventory.records.length-distinctOffers.size,mergedIds:manifest.filter(x=>x.status==='merged-duplicate').length,excluded:manifest.filter(x=>x.status==='excluded').length,incomplete:manifest.filter(x=>x.status==='incomplete').length,quoteOnly:imported.filter(x=>x.quoteOnly).length}});
console.log(json('imports/catalog-manifest.json').counts);
