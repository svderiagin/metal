import fs from 'node:fs';
import path from 'node:path';
import {flight,objects,walk} from './mirror-data.mjs';
const root='www.brokinvest.ru';
const files=fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.html')).sort();
const records=[],pages=[],contexts=new Map(),categories=new Map();
for(const file of files){
 if(pages.length%100===0)console.error('Processed',pages.length,file);
 let count=0;const parseIssues=[];
 try{for(const o of objects(flight(path.join(root,file)),parseIssues))walk(o,v=>{
  if(v.staticPath&&v.title&&'price'in v&&('nomenclature'in v||'stockId'in v)) {records.push({file,record:v});count++;}
  if(v.staticPath&&v.title&&'parentId'in v)categories.set(v.id,{id:v.id,parentId:v.parentId,title:v.title,staticPath:v.staticPath});
  if(v.stock&&v.regionId)contexts.set(v.stock.id,{stock:v.stock,regionId:v.regionId,title:v.title,address:v.address});
 });pages.push({file,count,status:count?'records':'no-product-records',parseIssues});}catch(e){pages.push({file,count,status:'error',error:e.message});}
}
fs.mkdirSync('imports',{recursive:true});
fs.writeFileSync('imports/mirror-inventory.json',JSON.stringify({pages,contexts:[...contexts.values()],categories:[...categories.values()],records},null,2));
console.log(JSON.stringify({pages:pages.length,records:records.length,categories:categories.size,parseIssues:pages.reduce((n,p)=>n+(p.parseIssues?.length||0),0),units:[...new Set(records.map(x=>x.record.unit))]},null,2));
