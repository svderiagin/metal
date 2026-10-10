import fs from 'node:fs';
import assert from 'node:assert/strict';
const targets=await (await fetch('http://127.0.0.1:9223/json')).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let next=1;const pending=new Map();
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);if(m.error)reject(m.error);else resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
async function ready(){for(let n=0;n<100;n++){if(await evaluate('document.readyState === "complete" && !!document.querySelector("h1")'))return;await new Promise(r=>setTimeout(r,150));}throw new Error('Page timeout');}
async function go(url){await call('Page.navigate',{url:'http://127.0.0.1:3000'+url});await ready();await new Promise(r=>setTimeout(r,600));}
const catalog=JSON.parse(fs.readFileSync('data/imported-catalog.json','utf8'));
const familyPath=f=>`/catalog/${catalog.categories.find(c=>c.id===f.categoryId).slug}/${f.slug}/${f.slug}`;
fs.mkdirSync('.tmp/catalog-check',{recursive:true});
const results=[];
try{
 await call('Page.enable');
 for(const width of [1440,390]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  for(const catId of ['cat-arm','cat-bal','cat-trs','cat-lis','cat-trp','mirror-coils']){
   const families=catalog.families.filter(f=>f.categoryId===catId);
   const f=families.sort((a,b)=>catalog.products.filter(p=>p.subcategoryId===b.id).length-catalog.products.filter(p=>p.subcategoryId===a.id).length)[0];
   await go(familyPath(f));
   const state=await evaluate('({title:document.querySelector("h1")?.textContent,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rows:document.querySelectorAll("tbody tr").length,cards:document.querySelectorAll("article[id^=variant-mobile]").length,text:document.body.innerText})');
   if(state.scrollWidth>width){console.log('overflow',await evaluate(`Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1&&e.getBoundingClientRect().width>0).slice(0,20).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,80),width:e.getBoundingClientRect().width}))`));}
   assert(state.scrollWidth<=width,`${catId} overflows at ${width}: ${state.scrollWidth}`);
   assert(state.rows<=40&&state.cards<=40);
   assert(state.text.includes('Наличие уточняется'));
   await evaluate('document.querySelector("section[aria-labelledby=variants-heading]").scrollIntoView({block:"start",behavior:"instant"})');
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`.tmp/catalog-check/${catId}-${width}.png`,Buffer.from(shot.data,'base64'));
   results.push({width,category:catId,title:state.title,rows:state.rows,scrollWidth:state.scrollWidth});
  }
 }
 // Exercise empty state/reset using the controlled search input.
 await evaluate(`(()=>{const i=document.querySelector('input[type="search"][placeholder="Название, размер, марка"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'НЕСУЩЕСТВУЮЩАЯ_ПОЗИЦИЯ');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await new Promise(r=>setTimeout(r,250));
 assert((await evaluate('document.body.innerText')).includes('Варианты не найдены'));
 await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Сбросить')).click()`);
 await new Promise(r=>setTimeout(r,250));assert(!(await evaluate('document.body.innerText')).includes('Варианты не найдены'));
 const largest=catalog.families.filter(f=>f.categoryId==='cat-trp').sort((a,b)=>catalog.products.filter(p=>p.subcategoryId===b.id).length-catalog.products.filter(p=>p.subcategoryId===a.id).length)[0];
 await go(familyPath(largest));
 const first=await evaluate(`document.querySelector('article[id^=variant-mobile]').id`);
 await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Далее').click()`);
 await new Promise(r=>setTimeout(r,250));assert.notEqual(await evaluate(`document.querySelector('article[id^=variant-mobile]').id`),first);
 const standard=await evaluate(`(()=>{const s=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.trim().startsWith('Стандарт')).querySelector('select');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}));return s.value;})()`);
 await new Promise(r=>setTimeout(r,250));assert((await evaluate(`Array.from(document.querySelectorAll('tbody tr')).map(r=>r.textContent)`)).every(text=>text.includes(standard)));
 // Quote-only route must lead to our inquiry and carry the exact designation.
 const q=catalog.products.find(p=>p.quoteOnly);
 await go(familyPath(catalog.families.find(f=>f.id===q.subcategoryId)));
 const quoteLink=await evaluate(`document.querySelector('a[href*="product="]')?.getAttribute('href')`);
 assert(quoteLink?.includes('#request'));
 await go(quoteLink);assert((await evaluate('document.querySelector("textarea[name=message]")?.value')).includes('Прошу рассчитать поставку:'));
 // Only a mocked local response: an HTTP failure must never show success.
 await evaluate(`(()=>{window.fetch=async()=>new Response(JSON.stringify({error:'Тестовый отказ отправки'}),{status:503,headers:{'content-type':'application/json'}});for(const [name,value] of Object.entries({name:'Тест',phone:'+7 900 000-00-00',email:'test@example.invalid'})){const i=document.querySelector('form input[name='+name+']');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,value);i.dispatchEvent(new Event('input',{bubbles:true}));}document.querySelector('input[name=consent]').checked=true;document.querySelector('textarea[name=message]').form.requestSubmit();})()`);
 await new Promise(r=>setTimeout(r,300));assert((await evaluate('document.body.innerText')).includes('Тестовый отказ отправки'));assert(!(await evaluate('document.body.innerText')).includes('Заявка принята.'));
 // Stale persisted measurement must not produce a false total, and unknown IDs remain visible.
 const constants=fs.readFileSync('lib/constants.ts','utf8');const key=constants.match(/CART_STORAGE_KEY\s*=\s*"([^"]+)"/)[1];
 await evaluate(`localStorage.setItem(${JSON.stringify(key)},'[]')`);
 const priced=catalog.products.find(p=>p.price&&p.unit==='ton');
 await go(`/catalog/${catalog.categories.find(c=>c.id===priced.categoryId).slug}/${priced.slug}`);
 await evaluate(`(()=>{const card=document.getElementById('variant-mobile-${priced.id}');const i=card.querySelector('input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'0.5');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await new Promise(r=>setTimeout(r,200));
 await evaluate(`document.getElementById('variant-mobile-${priced.id}').querySelector('button').click()`);
 await new Promise(r=>setTimeout(r,200));await go('/cart');
 const validCart=await evaluate('document.body.innerText');const expected=new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(priced.price*0.5);
 assert(validCart.replace(/\s/g,'').includes(expected.replace(/\s/g,'')),`Expected ${expected}: ${validCart.slice(0,1600)}`);
 await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify([{productId:priced.id,quantity:0.5},{productId:q.id,quantity:1},{productId:'missing-product',quantity:1}]))})`);
 await go('/cart');const cart=await evaluate('document.body.innerText');assert(cart.includes('Требует уточнения'));assert(cart.includes('Позиция больше не доступна'));
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.tmp/catalog-check/cart-390.png',Buffer.from(shot.data,'base64'));
 await go('/checkout');const blockedCheckout=await evaluate('document.body.innerText');assert(blockedCheckout.includes('Расчёт заказа требует уточнения'));assert(!(await evaluate('!!document.querySelector("form")')));
 fs.writeFileSync('.tmp/catalog-check/results.json',JSON.stringify({results,emptyReset:true,quoteRoute:true,mockedSubmissionFailure:true,addToCart:true,persistedCart:true,blockedCheckout:true},null,2));
 console.log(JSON.stringify({results,emptyReset:true,quoteRoute:true,mockedSubmissionFailure:true,addToCart:true,persistedCart:true,blockedCheckout:true},null,2));
}finally{await call('Browser.close').catch(()=>{});socket.close();}
