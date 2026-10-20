import fs from 'node:fs';
import crypto from 'node:crypto';

const source = JSON.parse(fs.readFileSync('imports/rozmet-source.json', 'utf8'));
const imageSources = [...new Set([...source.sections.map(section=>section.image), ...source.products.flatMap(product=>product.images)])]
  .filter(url=>url && !url.includes('tile-empty')).sort();
const images = imageSources.map(url=>({source:url,local:`/images/catalog/rozmet/${crypto.createHash('sha256').update(url).digest('hex').slice(0,20)}${new URL(url).pathname.match(/\.[a-z0-9]+$/i)?.[0] ?? '.jpg'}`}));
const localImage = new Map(images.map(image => [image.source, image.local]));
const current = JSON.parse(fs.readFileSync('imports/rozmet-protected.snapshot.json','utf8')).products;
const mapping = JSON.parse(fs.readFileSync('data/catalog-images.json', 'utf8'));
const categoryImageOverrides = {
  'rozmet-cat-shveller': '/images/catalog/shveller/shweller-main.jpg',
};
const categories = [], subcategories = [], products = [], sections = [];
const slugOf = url => new URL(url).pathname.split('/').filter(Boolean).at(-1).replaceAll('_', '-');
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 8);
const shorten = text => text.split(/\n\s*\n/)[0] ?? '';
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const units = {H87:['piece','за штуку'], MTR:['meter','за метр'], MTK:['square_meter','за квадратный метр'], KGM:['kg','за килограмм']};
let updated = 0;

for (const url of source.roots) {
  const section = source.sections.find(item => item.url === url);
  const slug = slugOf(url), id = `rozmet-cat-${slug}`;
  const children = source.sections.filter(item => item.url !== url && item.url.startsWith(url));
  const imageUrl = categoryImageOverrides[id] ?? localImage.get(section.image) ?? mapping.fallback;
  categories.push({id, name:section.name, slug, shortDescription:section.intro || shorten(section.details),
    description:[section.intro,section.details].filter(Boolean).join('\n\n'),
    ...(section.intro && section.details ? {descriptionSections:{intro:section.intro,title:`Подробнее о категории «${section.name}»`,details:section.details}} : {}),
    imageUrl, ...(!children.length ? {directProducts:true} : {})});
  mapping.categories[id] = imageUrl;
  const families = children.length ? children : [section];
  for (const child of families) {
    const subId = `rozmet-sub-${slug}-${slugOf(child.url)}`;
    const internal = !children.length;
    subcategories.push({id:subId, categoryId:id, name:child.name, slug:slugOf(child.url),
      shortDescription:child.intro || shorten(child.details), description:[child.intro,child.details].filter(Boolean).join('\n\n'),
      ...(internal ? {internal:true} : {})});
    const childImage = localImage.get(child.image);
    if (childImage) mapping.types[`type-${subId}`] = childImage;
    sections.push({url:child.url,categoryId:id,subcategoryId:subId,internal,descriptionMissing:!child.intro && !child.details});
  }
}

for (const item of source.products) {
  const root = source.roots.find(url => item.url.startsWith(url));
  if (!root) throw new Error(`Missing parent: ${item.url}`);
  const candidates = sections.filter(section => item.url.startsWith(section.url)).sort((a,b) => b.url.length-a.url.length);
  const parent = candidates[0];
  if (!parent) throw new Error(`Missing family: ${item.url}`);
  const unit = units[item.unitCode];
  if (!unit) throw new Error(`Unsupported source unit ${item.unitCode}: ${item.url}`);
  const specs = Object.entries(item.specifications).map(([name,value]) => ({name,value}));
  if (item.size && !specs.some(spec => spec.name === 'Размер' || spec.name === 'Длина')) specs.push({name:'Размер',value:item.size});
  if (item.priceConditions.length) specs.push({name:'Условия цены',value:item.priceConditions.join('; ')});
  if (item.priceConditionsText) specs.push({name:'Условия оплаты',value:item.priceConditionsText});
  const attributes = [];
  const keys = [ ['size',/^(?:Размер|Размеры уголка)$/], ['wallThickness',/^(?:Толщина|Толщина полок уголка)$/],
    ['length',/^Длина$/], ['material',/^Материал$/], ['standard',/^Стандарт$|^ГОСТ$/] ];
  for (const [key,pattern] of keys) {
    const spec = specs.find(spec => pattern.test(spec.name));
    if (spec) attributes.push({key,label:spec.name,value:spec.value});
  }
  const match = current.find(product => product.sourceReference === item.url
    && product.categoryId === parent.categoryId && product.subcategoryId === parent.subcategoryId
    && product.name === item.name && product.sku === item.sku);
  if (match) updated++;
  const imageUrls = [...new Set(item.images.map(url => localImage.get(url)).filter(Boolean))];
  const availability = item.stockText === 'Есть в наличии' && item.availability?.endsWith('/InStock') ? 'IN_STOCK'
    : item.stockText === 'Под заказ' && item.availability?.endsWith('/BackOrder') ? 'ON_ORDER' : 'UNKNOWN';
  const product = {id:match?.id ?? `rozmet-${item.id}`,categoryId:parent.categoryId,subcategoryId:parent.subcategoryId,
    productTypeId:`type-${parent.subcategoryId}`,name:item.name,slug:match?.slug ?? `rozmet-${slugOf(item.url)}-${hash(item.url)}`,
    sku:match?.sku ?? item.sku,shortDescription:shorten(item.description),description:item.description,
    price:item.price, ...(item.price === null ? {quoteOnly:true} : {}),priceQualifier:'exact',currency:'RUB',imported:true,
    unit:unit[0],priceUnit:unit[1],material:'',standard:'',availability,inStock:availability === 'IN_STOCK',featured:false,
    imageUrls,attributes,specifications:specs,sourceReference:item.url,sourceProductName:item.name};
  products.push(product);
  if (imageUrls[0]) mapping.products[product.id] = imageUrls[0];
}

if (products.length !== new Set(products.map(product => product.id)).size) throw new Error('Duplicate source identity');
write('data/rozmet-catalog.json',{categories,subcategories,products});
write('data/rozmet-routes.json',{directCategorySlugs:categories.filter(category=>category.directProducts).map(category=>category.slug)});
write('data/catalog-images.json',mapping);
write('imports/rozmet-manifest.json',{
  source:source.source, collectedAt:new Date().toISOString(),
  categories:categories.map(category => ({id:category.id,name:category.name,slug:category.slug,
    subcategories:subcategories.filter(subcategory => subcategory.categoryId===category.id && !subcategory.internal).map(subcategory=>subcategory.name),
    products:products.filter(product=>product.categoryId===category.id).length})),
  sections,counts:{categories:categories.length,sourceSubcategories:subcategories.filter(item=>!item.internal).length,
    products:products.length,updated,preventedDuplicateRows:source.duplicateRows,images:images.length},
  missing:{productDescriptions:source.products.filter(item=>!item.description).map(item=>item.id),
    productImages:source.products.filter(item=>!item.images.length).map(item=>item.id),
    productSpecifications:source.products.filter(item=>!Object.keys(item.specifications).length).map(item=>item.id),
    categoryDescriptions:source.sections.filter(item=>!item.intro && !item.details).map(item=>item.url)},
  records:products.map(product=>({id:product.id,source:product.sourceReference,categoryId:product.categoryId,
    subcategoryId:product.subcategoryId,price:product.price,unit:product.unit,sku:product.sku})),
});
console.log(JSON.stringify({categories:categories.length,subcategories:subcategories.filter(item=>!item.internal).length,products:products.length,updated,duplicates:source.duplicateRows}));
