import fs from 'node:fs';
import path from 'node:path';
import {flight,objects,walk} from './mirror-data.mjs';
const root='www.brokinvest.ru';
const inventory=JSON.parse(fs.readFileSync('imports/mirror-inventory.json','utf8'));
const findings=[];const missing=new Set();
for(const page of inventory.pages.filter(p=>/^(catalog|product)/.test(p.file))){
 const full=path.join(root,page.file),html=fs.readFileSync(full,'utf8');
 const savedUrl=objects(flight(full)).flatMap(o=>{const values=[];walk(o,v=>{if(Array.isArray(v.c)&&v.c.includes('product'))values.push(v.c.join('/'));});return values;})[0]||null;
 for(const m of html.matchAll(/href="([^"#]+\.html(?:\?[^"#]*)?)(?:#[^"]*)?"/g)){
  const href=m[1];if(!/product|catalog/.test(href)||/^https?:/.test(href))continue;
  const target=path.resolve(path.dirname(full),href.split('?')[0]);
  if(!target.startsWith(path.resolve(root)+path.sep))continue;
  if(!fs.existsSync(target))missing.add(path.relative(root,target));
 }
 const totals=[];
 for(const o of objects(flight(full)))walk(o,v=>{
  for(const k of ['total','totalCount','last_page','lastPage','per_page','perPage','current_page','currentPage'])if(typeof v[k]==='number')totals.push({field:k,value:v[k]});
 });
 const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 findings.push({file:page.file,records:page.count,savedUrl,totals,encoding:/charSet="utf-8"/i.test(html)?'utf-8':'not-declared',replacementCharacters:html.includes('\ufffd'),status:page.count?'usable':/404|страница не найдена|not found/i.test(visible)?'error-page':'family-or-empty',title:visible.slice(0,200)});
}
const report={relevantPages:findings.length,pages:findings,missingLocalLinks:[...missing].sort(),sectionsWithoutProducts:findings.filter(p=>!p.records).map(p=>({file:p.file,status:p.status,title:p.title})),parseIssues:inventory.pages.filter(p=>p.parseIssues?.length||p.status==='error')};
fs.writeFileSync('imports/completeness.json',JSON.stringify(report,null,2)+'\n');
console.log({relevantPages:report.relevantPages,missingLinks:missing.size,sectionsWithoutProducts:report.sectionsWithoutProducts.length,parseIssues:report.parseIssues.length,pagination:findings.filter(p=>p.totals.length).slice(0,3)});
