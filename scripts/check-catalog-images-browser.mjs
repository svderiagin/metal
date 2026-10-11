import fs from 'node:fs';
import assert from 'node:assert/strict';
const mapping=JSON.parse(fs.readFileSync('data/catalog-images.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('data/imported-catalog.json','utf8'));
const report=JSON.parse(fs.readFileSync('imports/image-mapping-report.json','utf8'));
const targets=await(await fetch('http://127.0.0.1:9223/json')).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let next=1;const pending=new Map();
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const families=new Map();
for(const r of report.records.filter(r=>r.targetKind==='product'))if(!families.has(r.role)){
 const product=catalog.products.find(p=>p.id===r.targetId);if(!product)continue;
 const f=catalog.families.find(f=>f.id===product.subcategoryId),c=catalog.categories.find(c=>c.id===product.categoryId);
 families.set(r.role,`/catalog/${c.slug}/${f.slug}/${f.slug}`);
}
const pages=[...new Set(['/','/catalog',...catalog.categories.filter(c=>mapping.categories[c.id]).map(c=>`/catalog/${c.slug}`),...families.values()])];
fs.mkdirSync('.tmp/images',{recursive:true});
const results=[];
try{
 await call('Page.enable');
 for(const width of [1440,390]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  for(const page of pages){
   await call('Page.navigate',{url:'http://127.0.0.1:3000'+page});
   for(let n=0;n<100;n++){if(await evaluate(`document.readyState==="complete"&&!!document.querySelector("h1")&&location.pathname===${JSON.stringify(page)}`))break;await new Promise(r=>setTimeout(r,100));}
   const state=await evaluate(`(async()=>{
    const imgs=[...document.querySelectorAll('img')].filter(i=>i.getClientRects().length);
    await Promise.all(imgs.map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));
    return {title:document.querySelector('h1')?.textContent,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:imgs.map(i=>({alt:i.alt,src:new URL(i.currentSrc,location.href).searchParams.get('url')||new URL(i.currentSrc,location.href).pathname,loaded:i.complete&&i.naturalWidth>0,fit:getComputedStyle(i).objectFit}))};
   })()`);
   assert(state.title,`${page} missing title`);assert(state.scrollWidth<=width,`${page} overflow ${width}`);
   assert(state.images.length,`${page} no visible images`);
   for(const img of state.images){assert(img.loaded,`${page}: broken ${img.src}`);assert(img.alt);assert.equal(img.fit,'contain');
    const matches=report.records.filter(r=>r.targetName===img.alt);
    if(matches.length)assert(matches.some(r=>r.targetImage===img.src),`${page}: unexpected image for ${img.alt}`);
   }
   results.push({page,width,images:state.images.length,broken:0});
   if(page==='/catalog'||page===families.get('squarePipe')){await evaluate(`document.querySelector('main img')?.scrollIntoView({block:'center',behavior:'instant'})`);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`.tmp/images/${page==='/catalog'?'catalog':'square-pipes'}-${width}.png`,Buffer.from(shot.data,'base64'));}
  }
 }
 fs.writeFileSync('imports/image-browser-verification.json',JSON.stringify({pagesChecked:results.length,results},null,2)+'\n');
 console.log({pagesChecked:results.length,brokenImages:0,widths:[1440,390]});
}finally{socket.close();}
