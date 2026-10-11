import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';

const {HERO_SLIDES,AUTO_ROTATE_MS}=readProjectData('data/hero-slides.ts');
const base=process.env.HERO_TEST_URL??'http://127.0.0.1:3000';
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const imageReport=[];
for(const slide of HERO_SLIDES){
 const file=path.resolve('public','.'+slide.src);
 const bytes=fs.readFileSync(file);
 const metadata=await sharp(bytes).metadata();
 assert.equal(metadata.format,'heif');assert.equal(metadata.compression,'av1');
 await sharp(bytes).resize({width:100}).raw().toBuffer();
 const original=path.resolve('images/hero',path.basename(file));
 if(fs.existsSync(original))assert.equal(hash(bytes),hash(fs.readFileSync(original)),'Исходная фотография не изменена');
 const response=await fetch(base+slide.src);
 assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^image\/avif/);
 const served=Buffer.from(await response.arrayBuffer());assert.equal(hash(served),hash(bytes));
 imageReport.push({file:path.relative(process.cwd(),file),url:slide.src,width:metadata.width,height:metadata.height,bytes:bytes.length,format:'AVIF',http:200});
}
for(const format of ['avif','webp']){
 const version=hash(fs.readFileSync(path.resolve('public','.'+HERO_SLIDES[0].src))).slice(0,12);
 const response=await fetch(base+'/_next/image?'+new URLSearchParams({url:HERO_SLIDES[0].src+'?v='+version,w:'640',q:'75'}),{headers:{Accept:'image/'+format}});
 assert.equal(response.status,200,response.status===200?'':await response.clone().text());assert.equal(response.headers.get('content-type'),'image/'+format);
 const optimized=Buffer.from(await response.arrayBuffer());
 await sharp(optimized).raw().toBuffer();
 assert.ok((await sharp(optimized).stats()).channels.some(c=>c.stdev>5),'Оптимизатор отдаёт настоящую фотографию, а не однотонный тестовый кадр');
}
const targets=await(await fetch('http://127.0.0.1:9223/json')).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const errors=[];const networkErrors=[];let fault='';const held=[];
socket.addEventListener('message',e=>{
 const m=JSON.parse(e.data);
 if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
 if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value??a.description).join(' '));
 if(m.method==='Network.responseReceived'&&m.params.response.url.includes('/_next/image')&&m.params.response.status>=400)networkErrors.push(m.params.response);
 if(m.method==='Fetch.requestPaused'){
  if(fault==='stall')held.push(m.params.requestId);
  else void call('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/avif'}],body:Buffer.from('Некорректное изображение для проверки').toString('base64')});
 }
});
const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{
 const value=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(value.exceptionDetails)throw Error(value.exceptionDetails.exception?.description??value.exceptionDetails.text);
 return value.result.value;
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expression){for(let n=0;n<1200;n++){if(await evaluate('Boolean('+expression+')'))return;await sleep(100);}throw Error('Не выполнено: '+expression);}
const hero=`document.querySelector('section[aria-labelledby="home-hero-title"]')`;
const active=`(${hero})?.querySelector('img[data-active="true"]')?.getAttribute('src')`;
const next=`(${hero}).querySelector('button[aria-label="Следующая фотография"]')`;
const previous=`(${hero}).querySelector('button[aria-label="Предыдущая фотография"]')`;
const play=`(${hero}).querySelector('button[aria-label="Включить смену фотографий"]')`;
const results=[];
async function page(width,count=4,reduced=false){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<640});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
 await call('Page.navigate',{url:base+'/?hero-images-check='+Date.now()});
 await wait(`document.querySelector('[aria-label^="Фотография "][aria-label$=" из ${count}"]')${fault==='stall'?'':"&&document.readyState==='complete'"}`);
 await evaluate(`(${hero}).querySelector('button[aria-label="Остановить смену фотографий"]')?.click()`);
 await sleep(700);
 const state=await evaluate(`(()=>{const h=${hero},r=h.getBoundingClientRect(),images=[...h.querySelectorAll('img')];return {width:innerWidth,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,cta:h.querySelector('a[href="/catalog"]')?.textContent,images:images.map(i=>({src:i.currentSrc,decoded:i.complete&&i.naturalWidth>0,opacity:getComputedStyle(i).opacity,width:i.offsetWidth,height:i.offsetHeight})),buttons:h.querySelectorAll('button').length};})()`);
 assert.equal(state.overflow,false);assert.equal(state.h1,1);assert.equal(state.cta,'Перейти в каталог');assert.equal(state.buttons,3);
 assert.equal(state.images.filter(i=>i.decoded).length,count);assert.ok(state.images.every(i=>i.width>0&&i.height>0));assert.equal(state.images.filter(i=>Number(i.opacity)>.99).length,1);
 const variation=await evaluate(`(()=>{const img=(${hero}).querySelector('img[data-active="true"]'),c=document.createElement('canvas');c.width=64;c.height=64;const context=c.getContext('2d');context.drawImage(img,0,0,64,64);const pixels=context.getImageData(0,0,64,64).data,reds=[];for(let i=0;i<pixels.length;i+=4)reds.push(pixels[i]);const mean=reds.reduce((a,b)=>a+b,0)/reds.length;return Math.sqrt(reds.reduce((a,b)=>a+(b-mean)**2,0)/reds.length);})()`);
 assert.ok(variation>5,'В браузере показана фотография, а не закэшированный однотонный тестовый фон');
 fs.mkdirSync('.tmp/hero',{recursive:true});
 const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(`.tmp/hero/owner-${width}-${count}${reduced?'-reduced':''}.png`,Buffer.from(screenshot.data,'base64'));
 results.push(state);
}
try{
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await page(1440);
 const initial=await evaluate(active);
 await evaluate(`(${previous}).click()`);await sleep(100);assert.notEqual(await evaluate(active),initial);
 await evaluate(`(${next}).click()`);await sleep(100);assert.equal(await evaluate(active),initial);
 await evaluate(`for(let i=0;i<4;i++)(${next}).click()`);await sleep(100);assert.equal(await evaluate(active),initial);
 await evaluate(`(${play}).focus()`);await evaluate(`(${play}).click()`);
 const start=Date.now();await sleep(AUTO_ROTATE_MS-700);assert.equal(await evaluate(active),initial);
 await wait(`(${active})!==${JSON.stringify(initial)}`);const elapsed=Date.now()-start;
 assert.ok(elapsed>=AUTO_ROTATE_MS-700);results.push({autoplayElapsedMs:elapsed});
 await page(390);
 const mobileInitial=await evaluate(active);await evaluate(`(${next}).click()`);await sleep(100);assert.notEqual(await evaluate(active),mobileInitial);
 await evaluate(`(${previous}).click()`);await sleep(100);assert.equal(await evaluate(active),mobileInitial);
 await page(390,4,true);const still=await evaluate(active);await sleep(700);assert.equal(await evaluate(active),still);assert.ok(await evaluate(`!!(${play})`));
 // Первый снимок намеренно повреждаем только в HTTP-ответе; файлы владельца не меняются.
 fault='invalid';await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Fetch.enable',{patterns:[{urlPattern:'*'+path.basename(HERO_SLIDES[0].src)+'*',requestStage:'Request'}]});
 await page(1440,3);assert.ok(!(await evaluate(active)).includes(path.basename(HERO_SLIDES[0].src)));
 await call('Fetch.disable');
 // Проверяем, что зависшая первая загрузка также не блокирует остальные три.
 fault='stall';await call('Fetch.enable',{patterns:[{urlPattern:'*'+path.basename(HERO_SLIDES[0].src)+'*',requestStage:'Request'}]});
 await page(1440,3);assert.ok(held.length);results.push({failedImageSkipped:true,stalledImageSkipped:true});
 await call('Fetch.disable');
 assert.deepEqual(errors,[]);assert.deepEqual(networkErrors,[]);
 const report={base,imageReport,results,consoleErrors:errors,optimizationErrors:networkErrors};
 fs.writeFileSync('.tmp/hero/owner-verification.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({images:imageReport,layouts:results.map(r=>({width:r.width,photos:r.images?.length,autoplayElapsedMs:r.autoplayElapsedMs,failedImageSkipped:r.failedImageSkipped,stalledImageSkipped:r.stalledImageSkipped})),consoleErrors:0,optimizationErrors:0},null,2));
}finally{
 await call('Fetch.disable').catch(()=>{});socket.close();
}
