import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';

const {HERO_SLIDES,AUTO_ROTATE_MS}=readProjectData('data/hero-slides.ts');
assert.equal(AUTO_ROTATE_MS,7000);
const files=HERO_SLIDES.map(s=>path.resolve('public','.'+s.src));
const directory=path.resolve('public/images/hero')+path.sep;
for(const file of files){assert.ok(file.startsWith(directory));assert.ok(!fs.existsSync(file),'Проверка не перезаписывает фотографии владельца: '+file);}
const targets=await(await fetch('http://127.0.0.1:9223/json')).json();
const target=targets.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let next=1;const pending=new Map();let rejectImage='';const errors=[];
socket.addEventListener('message',e=>{
 const m=JSON.parse(e.data);
 if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
 if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value??a.description).join(' '));
 if(m.method==='Fetch.requestPaused')void call('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/webp'}],body:Buffer.from('Повреждённый тестовый файл').toString('base64')});
});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{
 const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.text+' '+result.exceptionDetails.exception?.description);
 return result.result.value;
};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expression){for(let n=0;n<150;n++){if(await evaluate('Boolean('+expression+')'))return;await delay(100);}throw Error('Не выполнено условие: '+expression+' '+JSON.stringify(await evaluate(`({focus:document.activeElement?.outerHTML.slice(0,500),hidden:document.hidden,buttons:[...document.querySelectorAll('section[aria-labelledby="home-hero-title"] button')].map(b=>b.getAttribute('aria-label'))})`)));}
const active=`document.querySelector('section[aria-labelledby="home-hero-title"] img[data-active="true"]')?.getAttribute('src')`;
const timerCount='window.__heroTimers.size';
const play=`document.querySelector('button[aria-label="Включить смену фотографий"]')`;
const pause=`document.querySelector('button[aria-label="Остановить смену фотографий"]')`;
const nextButton=`document.querySelector('button[aria-label="Следующая фотография"]')`;
const previousButton=`document.querySelector('button[aria-label="Предыдущая фотография"]')`;
const results=[];
async function fixture(index){
 const color=['#4e6478','#a58855','#537e67','#684f7b'][index];
 await sharp({create:{width:1200,height:700,channels:3,background:color}}).toFile(files[index]);
}
async function page(count,width=1440,reduced=false){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<640});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
 await call('Page.navigate',{url:'http://127.0.0.1:3000/?hero-check='+Date.now()});
 await wait(`document.readyState==='complete'&&!!document.getElementById('home-hero-title')`);
 await delay(100);
 await evaluate('window.__heroInitialCLS=window.__heroCLS;window.__heroCLS=0;window.__heroShifts=[]');
 await wait(count>1?`document.querySelector('[aria-label="Фотография 1 из ${count}"]')` : count?`!!(${active})`:`document.querySelectorAll('section[aria-labelledby="home-hero-title"] img').length===0`);
 await delay(400);
 const state=await evaluate(`(()=>{const h=document.querySelector('section[aria-labelledby="home-hero-title"]'),r=h.getBoundingClientRect();return {width:innerWidth,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,cta:[...h.querySelectorAll('a')].find(a=>a.textContent==='Перейти в каталог')?.getAttribute('href'),controls:h.querySelectorAll('button').length,buttonSizes:[...h.querySelectorAll('button')].map(b=>[b.offsetWidth,b.offsetHeight]),cls:window.__heroCLS,images:[...h.querySelectorAll('img')].map(i=>({alt:i.alt,fit:getComputedStyle(i).objectFit,transition:getComputedStyle(i).transitionDuration,position:getComputedStyle(i).objectPosition}))};})()`);
 assert.equal(state.overflow,false);assert.equal(state.h1,1);assert.equal(state.cta,'/catalog');assert.equal(state.controls,count>1?3:0);
 for(const size of state.buttonSizes)assert.ok(size[0]>=44&&size[1]>=44);
 for(const image of state.images){assert.equal(image.alt,'');assert.equal(image.fit,'cover');assert.equal(image.transition,reduced?'0s':'0.6s');assert.equal(image.position,width<640?'60% 50%':'50% 50%');}
 if(count>1)assert.ok(await evaluate(`(()=>{const h=document.querySelector('section[aria-labelledby="home-hero-title"]');return h.querySelector('button').getBoundingClientRect().top>Math.max(...[...h.querySelectorAll('a')].map(a=>a.getBoundingClientRect().bottom))+16;})()`),'Кнопки не перекрывают текст и ссылки');
 assert.equal(state.cls,0,'Нет сдвигов макета: '+JSON.stringify(await evaluate('window.__heroShifts')));
 results.push({count,width,reduced,...state});
 if(count===4){
  fs.mkdirSync('.tmp/hero',{recursive:true});
  const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync('.tmp/hero/test-fixtures-'+width+'.png',Buffer.from(screenshot.data,'base64'));
 }
 return state;
}

try{
 await call('Page.enable');await call('Runtime.enable');
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`
  window.__heroTimers=new Map();window.__heroMaxTimers=0;window.__heroCLS=0;window.__heroShifts=[];
  const originalSet=window.setTimeout.bind(window),originalClear=window.clearTimeout.bind(window);
  window.setTimeout=(fn,ms,...args)=>{
   let id;const wrapped=()=>{window.__heroTimers.delete(id);if(typeof fn==='function')fn(...args);};
   id=originalSet(ms===7000?wrapped:fn,ms,...args);
   if(ms===7000){window.__heroTimers.set(id,wrapped);window.__heroMaxTimers=Math.max(window.__heroMaxTimers,window.__heroTimers.size);}return id;
  };
  window.clearTimeout=id=>{window.__heroTimers.delete(id);originalClear(id);};
  window.__heroTick=()=>{const jobs=[...window.__heroTimers.entries()];for(const [id,fn] of jobs){originalClear(id);fn();}};
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){window.__heroCLS+=e.value;window.__heroShifts.push({value:e.value,sources:e.sources.map(s=>({node:s.node?.outerHTML.slice(0,300),old:s.previousRect.toJSON(),new:s.currentRect.toJSON()}))});}}).observe({type:'layout-shift',buffered:true});
 `});
 for(const width of [1440,390]){await page(0,width);assert.equal(await evaluate(timerCount),0);}
 await fixture(0);
 for(const format of ['avif','webp']){
  const url='http://127.0.0.1:3000/_next/image?'+new URLSearchParams({url:HERO_SLIDES[0].src,w:'640',q:'75'});
  const response=await fetch(url,{headers:{Accept:'image/'+format}});
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/'+format);
  assert.equal((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).format,format==='avif'?'heif':'webp');
 }
 for(const width of [1440,390]){await page(1,width);assert.equal(await evaluate(timerCount),0);}
 await fixture(1);await fixture(2);
 for(const width of [1440,390])await page(3,width);
 await fixture(3);await page(4);
 const initial=await evaluate(active);
 await wait(timerCount+'===1');
 const started=Date.now();await delay(6000);assert.equal(await evaluate(active),initial,'Не переключать раньше семи секунд');
 await wait(`(${active})!==${JSON.stringify(initial)}`);
 assert.ok(Date.now()-started>=6000,'Проверен настоящий семисекундный таймер');
 // Наведение останавливает таймер; уход начинает новый отсчёт.
 const rect=await evaluate(`document.querySelector('section[aria-labelledby="home-hero-title"]').getBoundingClientRect().toJSON()`);
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:100,y:rect.y+80});await wait(timerCount+'===0');
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await wait(timerCount+'===1');
 // Нажатие мышью ставит фокус на кнопке: намерение «Пауза» не превращается в «Пуск».
 const rotationRect=await evaluate(`(${pause}).getBoundingClientRect().toJSON()`);
 for(const type of ['mousePressed','mouseReleased'])await call('Input.dispatchMouseEvent',{type,x:rotationRect.x+20,y:rotationRect.y+20,button:'left',clickCount:1});
 await wait(`!!(${play})`);assert.equal(await evaluate(timerCount),0);
 for(const type of ['mousePressed','mouseReleased'])await call('Input.dispatchMouseEvent',{type,x:rotationRect.x+20,y:rotationRect.y+20,button:'left',clickCount:1});
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await wait(timerCount+'===1');
 await evaluate('document.activeElement.blur()');
 // Вход фокуса выключает автопоказ; клавиша Enter на «Пуск» разрешает его при фокусе внутри.
 await evaluate(`(${pause}).focus()`);await wait(timerCount+'===0');assert.ok(await evaluate(`!!(${play})`));
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r'});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});await wait(timerCount+'===1');
 await evaluate(`(${nextButton}).click()`);await wait(timerCount+'===0');assert.ok(await evaluate(`!!(${play})`));
 const before=await evaluate(active);await delay(100);assert.equal(await evaluate(active),before);
 // Быстрые клики и переход через границу списка.
 await evaluate(`for(let i=0;i<4;i++)(${nextButton}).click()`);await delay(100);assert.equal(await evaluate(active),before);
 await evaluate(`(${previousButton}).click();(${nextButton}).click()`);await delay(100);assert.equal(await evaluate(active),before);
 await evaluate(`(${play}).click()`);await wait(timerCount+'===1');
 // Настоящий уход блока из viewport.
 await evaluate(`window.scrollTo({top:document.body.scrollHeight,behavior:'instant'})`);await wait(timerCount+'===0');
 await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);await wait(timerCount+'===1');
 // Скрытую вкладку моделируем через document.hidden и её штатное событие.
 await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))`);await wait(timerCount+'===0');
 await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))`);await wait(timerCount+'===1');
 await evaluate('window.__heroTick()');await delay(100);assert.equal(await evaluate(timerCount),1);assert.equal(await evaluate('window.__heroMaxTimers'),1);
 // Уменьшенное движение: нет автозапуска/анимации, ручное управление работает.
 await page(4,390,true);assert.equal(await evaluate(timerCount),0);
 const reducedInitial=await evaluate(active);await evaluate(`(${nextButton}).click()`);await delay(100);assert.notEqual(await evaluate(active),reducedInitial);
 // Настоящие touch-события: горизонтальный свайп и вертикальная прокрутка.
 await page(4,390);
 const mobileRect=await evaluate(`document.querySelector('section[aria-labelledby="home-hero-title"]').getBoundingClientRect().toJSON()`);
 const swipeInitial=await evaluate(active);const y=Math.round(mobileRect.y+80);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:320,y}]});
 await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:230,y:y+2}]});
 await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:80,y:y+4}]});
 await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(200);
 assert.notEqual(await evaluate(active),swipeInitial);assert.equal(await evaluate(timerCount),0);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:y+160}]});
 for(const offset of [40,90,140])await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:191,y:y+160-offset}]});
 await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(300);
 assert.ok(await evaluate('window.scrollY>30'),'Вертикальная прокрутка не заблокирована');
 // Ошибка декодирования существующего URL: пропуск без битого значка.
 rejectImage=path.basename(files[1]);
 await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Fetch.enable',{patterns:[{urlPattern:'*'+rejectImage+'*',requestStage:'Request'}]});
 await page(3,1440);
 assert.equal(await evaluate(`document.querySelectorAll('section[aria-labelledby="home-hero-title"] img').length`),3);
 await call('Fetch.disable');
 assert.deepEqual(errors,[],'Нет ошибок JavaScript');
 fs.mkdirSync('.tmp/hero',{recursive:true});
 const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync('.tmp/hero/test-fixtures-desktop.png',Buffer.from(screenshot.data,'base64'));
 // Переход по CTA размонтирует карусель и очищает таймер без перезагрузки документа.
 await evaluate(`document.querySelector('section[aria-labelledby="home-hero-title"] a[href="/catalog"]').click()`);
 await wait(`location.pathname==='/catalog'&&!!document.querySelector('input[name="query"]')`);
 assert.equal(await evaluate(timerCount),0,'Таймер очищен при размонтировании');
 console.log('Проверены: 0/1/3/4 изображения, ошибочный URL, 1440/390 px, 7000 мс, стрелки, цикл, быстрые клики, клавиатура, пауза/пуск, наведение, viewport, скрытая вкладка (моделирование), reduced motion, свайп, прокрутка, очистка таймера и переход по CTA. Сдвигов при загрузке/смене фотографий после начальной отрисовки нет.');
 console.log(JSON.stringify(results,null,2));
}finally{
 for(const file of files)if(fs.existsSync(file))fs.unlinkSync(file);
 if(socket.readyState===1){await call('Fetch.disable').catch(()=>{});socket.close();}
}
