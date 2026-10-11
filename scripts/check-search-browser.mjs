import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';
const {productTypes}=readProjectData('data/productTypes.ts');
const {productVariants}=readProjectData('data/products/index.ts');
const targets=await(await fetch('http://127.0.0.1:9223/json')).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let next=1;const pending=new Map();
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const pause=()=>new Promise(r=>setTimeout(r,100));
async function wait(expression){for(let n=0;n<150;n++){if(await evaluate(expression))return;await pause();}throw Error('Timed out: '+expression+' '+await evaluate('document.querySelector("main")?.textContent.slice(0,3000)'));}
const results=[];
try{
 await call('Page.enable');
 for(const width of [1440,390]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await call('Page.navigate',{url:'http://127.0.0.1:3000/catalog?q='+encodeURIComponent('профильных труб')});
  await wait(`document.querySelector('input[name="query"]')?.value==='профильных труб'&&!!document.querySelector('main li a[href*="#variant-"]')`);
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'overflow');
  for(const query of ['40x40x2','арматруа','оцинкованый лист','абракадабразавр']){
   await evaluate(`(()=>{const el=document.querySelector('input[name="query"]');el.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(query)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
   await wait(`document.querySelector('main')?.textContent.includes(${JSON.stringify('«'+query+'»')})`);
   const state=await evaluate(`({links:[...document.querySelectorAll('main li a[href*="#variant-"]')].map(a=>({name:a.textContent,href:a.getAttribute('href')})),text:document.querySelector('main').textContent,focused:document.activeElement?.name})`);
   assert.equal(state.focused,'query','typing retains focus');
   if(query==='абракадабразавр')assert.equal(state.links.length,0);else assert.ok(state.links.length,query);
   if(query==='40x40x2')assert.ok(state.links.every(a=>/40[хx]40[хx]2(?:[хx]|\D|$)/.test(a.name)),JSON.stringify(state.links));
   if(query==='арматруа')assert.ok(state.text.includes('имели в виду'));
   results.push({width,query,count:state.links.length,first:state.links[0]?.name});
  }
  const product=productVariants.find(p=>p.categoryId==='cat-trp'&&/40х40х2х/.test(p.name));
  const type=productTypes.find(t=>t.id===product.productTypeId);
  assert.ok(type);
  await call('Page.navigate',{url:'http://127.0.0.1:3000/catalog/'+type.categorySlug+'/'+type.subcategorySlug+'/'+type.slug});
  await wait(`!!document.querySelector('input[placeholder="Название, размер, марка"]')`);
  await evaluate(`new Promise(r=>setTimeout(r,500))`);
  await evaluate(`(()=>{const el=document.querySelector('input[placeholder="Название, размер, марка"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'профилная труба 40х40х2');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await wait(`document.querySelector('input[placeholder="Название, размер, марка"]')?.value==='профилная труба 40х40х2'`);
  await pause();
  const rows=await evaluate(`[...document.querySelectorAll('[id^="variant-"]')].map(el=>el.textContent)`);
  assert.ok(rows.length,'variant table supports morphology and typos');
  assert.ok(rows.every(row=>/40[хx]40[хx]2(?:[хx]|\D|$)/.test(row)),'variant table excludes incompatible dimensions');
  await call('Page.navigate',{url:'http://127.0.0.1:3000/catalog/'+type.categorySlug});
  await wait(`!!document.querySelector('input[placeholder="Название, размер или марка стали"]')`);
  await evaluate(`new Promise(r=>setTimeout(r,500))`);
  await evaluate(`(()=>{const el=document.querySelector('input[placeholder="Название, размер или марка стали"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'абракадабразавр');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await wait(`document.querySelector('main')?.textContent.includes('По выбранным условиям ничего не найдено')`);
  results.push({width,categoryEmptyState:true,variantRows:rows.length});
 }
 fs.writeFileSync('imports/search-browser-verification.json',JSON.stringify(results,null,2)+'\n');console.log(results);
}finally{socket.close();}
