import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {flight,objects,walk} from './mirror-data.mjs';
const root='brokinvest.ru';
console.log('Scanning source files');
const files=fs.readdirSync(root,{recursive:true}).filter(f=>fs.statSync(path.join(root,f)).isFile());
const images=files.filter(f=>/\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(f)).map(file=>({file:file.replaceAll('\\','/'),hash:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
const products=new Map(),categories=new Map();
let processed=0;
for(const file of files.filter(f=>f.endsWith('.html'))){
 if(processed++%100===0)console.log('HTML',processed,file);
 for(const o of objects(flight(path.join(root,file))))walk(o,v=>{
  if(!v.staticPath||!v.title)return;
  const isProduct='price'in v&&('nomenclature'in v||'stockId'in v);
  if(!isProduct&&!('parentId'in v))return;
  const map=isProduct?products:categories;
  const key=isProduct?v.staticPath:String(v.id);
  const old=map.get(key)||{id:v.id,title:v.title,titleFull:v.titleFull,slug:v.staticPath,parentId:v.parentId,characteristics:v.characteristics,files:[],pages:[]};
  const page=file.replaceAll('\\','/');
  if(!old.pages.includes(page))old.pages.push(page);
  for(const item of [...(v.files||[]),...(v.gallery||[])]){
   const f=typeof item==='string'?{file:item.replace(/^.*\/api\/v1\/files\//,''),originalUrl:item}:item;
   const local=images.find(i=>i.file.replace(/\.[^.\/]+$/,'')===`_back.brokinvest.ru/api/v1/files/${f.file}`.replace(/\.[^.\/]+$/,''));
   const file=local?local.file.replace('_back.brokinvest.ru/api/v1/files/',''):f.file;
   if(file){
    let evidence=old.files.find(x=>x.file===file);
    if(!evidence){evidence={file,label:f.original_title,categoryId:f.category_id,originalUrl:f.originalUrl,pages:[]};old.files.push(evidence);}
    if(!evidence.pages.includes(page))evidence.pages.push(page);
   }
  }
  map.set(key,old);
 });
}
const result={htmlPages:processed,images,products:[...products.values()],categories:[...categories.values()]};
fs.writeFileSync('imports/image-source-inventory.json',JSON.stringify(result,null,2));
console.log({images:images.length,products:products.size,categories:categories.size});
for(const c of categories.values())if(c.files.length)console.log(c.id,c.title,JSON.stringify(c.files));
console.log('product specific',result.products.filter(p=>p.files.some(f=>!f.categoryId)).map(p=>({name:p.title,files:p.files})));
