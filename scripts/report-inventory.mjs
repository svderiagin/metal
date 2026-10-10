import fs from 'node:fs';
const i=JSON.parse(fs.readFileSync('imports/mirror-inventory.json','utf8'));
const m=JSON.parse(fs.readFileSync('imports/catalog-manifest.json','utf8'));
const groups=new Map();for(const e of i.records){if(!groups.has(e.record.id))groups.set(e.record.id,e.record);}
console.log('counts',m.counts);
console.log('excluded',m.records.filter(e=>e.status==='excluded').map(e=>[e.sourceId,e.rawOffers[0].record.title]));
console.log('categories',Object.entries([...groups.values()].reduce((a,r)=>(a[r.admin_category?.title||'list-only']=(a[r.admin_category?.title||'list-only']||0)+1,a),{})));
console.log('units',Object.entries(i.records.reduce((a,e)=>(a[e.record.unit||'missing']=(a[e.record.unit||'missing']||0)+1,a),{})));
console.log('issues',m.records.reduce((a,e)=>{for(const issue of e.issues)a[issue]=(a[issue]||0)+1;return a;},{}));
console.log('examples',m.records.filter(e=>e.ourPrice>0).slice(0,6).map(e=>[e.sourceId,e.rawOffers[0].record.title,e.originalPrice,e.ourPrice,e.priceUnit]));
console.log('kg',m.records.filter(e=>e.priceUnit==='кг').slice(0,4).map(e=>[e.sourceId,e.rawOffers[0].record.title,e.originalPrice,e.ourPrice,e.issues]));
console.log('relevant empty pages',i.pages.filter(e=>!e.count&&/^(catalog|product)/.test(e.file)).map(e=>e.file));
const complete=JSON.parse(fs.readFileSync('imports/completeness.json','utf8'));
console.log('missing-links',complete.missingLocalLinks);
console.log('pagination',JSON.stringify(complete.pages.filter(p=>p.totals.length&&p.file.split(/[\\/]/).length===3).map(p=>({file:p.file,records:p.records,totals:p.totals})),null,2));
const data=JSON.parse(fs.readFileSync('data/imported-catalog.json','utf8'));
console.log('category-counts',data.categories.map(c=>({name:c.name,count:data.products.filter(p=>p.categoryId===c.id).length})));
console.log('source-updated-range',i.records.map(e=>e.record.updatedAt).filter(Boolean).sort().filter((x,n,a)=>n===0||n===a.length-1));
console.log('nonzero weightToMeters',i.records.filter(e=>e.record.weightToMeters>0).map(e=>[e.record.id,e.record.weightToMeters,e.record.unit]).slice(0,10));
