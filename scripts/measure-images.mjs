import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Read-only page diagnostics. Use a dedicated local Chrome/CDP profile:
// cold runs clear its HTTP cache; forms and APIs are never submitted.
const base=process.env.PERF_URL??'http://127.0.0.1:3100';
const label=process.env.PERF_LABEL??'before';
const runs=Number(process.env.PERF_RUNS??3);
const pages=(process.env.PERF_PAGES??'/,/catalog,/catalog/armatura,/catalog/armatura/armatura-a500s/armatura-a500s,/catalog/shveller/shveller-stalnoy/shveller-stalnoy').split(',');
const profiles=[{name:'desktop',width:1440,height:1000,dpr:1},{name:'mobile',width:390,height:844,dpr:2}].filter(p=>!process.env.PERF_PROFILE||p.name===process.env.PERF_PROFILE);
const folder='.tmp/image-performance/'+label;fs.mkdirSync(folder,{recursive:true});
const cdp=process.env.AUDIT_CDP??'http://127.0.0.1:9225';
const tab=await (await fetch(cdp+'/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
const keepAlive=setInterval(()=>{},1000);
let next=0,requests=new Map(),navigation=0,traceResolve;const pending=new Map(),errors=[],results=[];
ws.addEventListener('message',event=>{
 const m=JSON.parse(event.data);
 if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);}
 const p=m.params;
 if(m.method==='Network.requestWillBeSent'){
  if(p.type==='Document'&&!navigation)navigation=p.timestamp;
  const entry={url:p.request.url,type:p.type,start:p.timestamp,priority:p.request.initialPriority,initiator:p.initiator,redirect:p.redirectResponse,requestId:p.requestId};requests.set(p.requestId,entry);
 }
 if(m.method==='Network.responseReceived'&&requests.has(p.requestId))Object.assign(requests.get(p.requestId),{responseTime:p.timestamp,...p.response});
 if(m.method==='Network.resourceChangedPriority'&&requests.has(p.requestId))requests.get(p.requestId).finalPriority=p.newPriority;
 if(m.method==='Network.dataReceived'&&requests.has(p.requestId)){const r=requests.get(p.requestId);r.received=(r.received??0)+p.encodedDataLength;}
 if(m.method==='Network.loadingFinished'&&requests.has(p.requestId))Object.assign(requests.get(p.requestId),{end:p.timestamp,transferred:p.encodedDataLength});
 if(m.method==='Network.loadingFailed'&&requests.has(p.requestId))requests.get(p.requestId).failure=p.errorText;
 if(m.method==='Runtime.exceptionThrown')errors.push(p.exceptionDetails.exception?.description??p.exceptionDetails.text);
 if(m.method==='Tracing.tracingComplete')traceResolve?.(p.stream);
});
ws.addEventListener('close',()=>{
 for(const p of pending.values())p.reject(Error('Chrome CDP connection closed'));
 pending.clear();
});
function call(method,params={}){return new Promise((resolve,reject)=>{
 const id=++next;
 const timeout=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},30000);
 pending.set(id,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});
 ws.send(JSON.stringify({id,method,params}));
});}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const observer=`(()=>{
 window.__perf={lcp:[],shifts:[],longTasks:[],firstImage:null,firstFullImage:null,imageLoads:[],elementPaints:[]};
 new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__perf.lcp.push({time:e.startTime,size:e.size,url:e.url,element:e.element?.tagName,text:e.element?.textContent?.slice(0,80)}))).observe({type:'largest-contentful-paint',buffered:true});
 new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__perf.shifts.push({time:e.startTime,value:e.value,sources:e.sources.map(s=>({node:s.node?.tagName,className:s.node?.className,text:s.node?.textContent?.slice(0,80),previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))});})).observe({type:'layout-shift',buffered:true});
 new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__perf.longTasks.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true});
 new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__perf.elementPaints.push({time:e.renderTime||e.loadTime,url:e.url,identifier:e.identifier}))).observe({type:'element',buffered:true});
 const observe=()=>document.querySelectorAll('main img').forEach(img=>{if(img.dataset.perfObserved)return;img.dataset.perfObserved='true';img.setAttribute('elementtiming','photo');img.addEventListener('load',()=>window.__perf.imageLoads.push({time:performance.now(),url:img.currentSrc,complete:img.complete}));});
 new MutationObserver(observe).observe(document,{childList:true,subtree:true});
 const visible=()=>{const imgs=[...document.querySelectorAll('main img')];const img=imgs.find(img=>{const r=img.getBoundingClientRect(),s=getComputedStyle(img);return img.complete&&img.naturalWidth>0&&r.width>100&&r.height>40&&r.bottom>0&&r.top<innerHeight&&s.visibility!=='hidden'&&Number(s.opacity)>0.01;});if(img){const entry={time:performance.now(),url:img.currentSrc,opacity:getComputedStyle(img).opacity};window.__perf.firstImage??=entry;if(Number(entry.opacity)>0.99)window.__perf.firstFullImage??=entry;}requestAnimationFrame(visible);};requestAnimationFrame(visible);
 })();`;
async function traceEnd(file){const complete=new Promise(resolve=>traceResolve=resolve);await call('Tracing.end');const handle=await complete;const chunks=[];for(;;){const r=await call('IO.read',{handle,size:65536});chunks.push(r.base64Encoded?Buffer.from(r.data,'base64'):Buffer.from(r.data));if(r.eof)break;}await call('IO.close',{handle});fs.writeFileSync(file,Buffer.concat(chunks));traceResolve=undefined;}
async function measure(profile,page,run,warm=false){
 await call('Page.navigate',{url:'about:blank'});await delay(80);requests=new Map();navigation=0;
 await call('Network.setCacheDisabled',{cacheDisabled:!warm});
 if(!warm)await call('Network.clearBrowserCache');
 const cache=process.env.PERF_COLD_IMAGE_CACHE;
 if(cache&&!warm){const resolved=path.resolve(cache);if(!['.tmp/image-performance','.tmp/perf-targeted'].some(folder=>resolved.startsWith(path.resolve(folder)+path.sep))||!resolved.endsWith('/cache/images'))throw Error('Cache clearing restricted to task copy');fs.rmSync(resolved,{recursive:true,force:true});}
 const tracing=process.env.PERF_TRACE==='1'&&page==='/'&&run===0&&!warm;
 if(tracing)await call('Tracing.start',{categories:'devtools.timeline,blink.user_timing,loading,disabled-by-default-devtools.timeline',transferMode:'ReturnAsStream'});
 await call('Page.navigate',{url:base+page});
 // Fixed 8-second initial window; requests continue naturally, no interaction or scroll.
 await delay(8000);
 const state=await evaluate(`(()=>{const perf=window.__perf;return {...perf,paints:performance.getEntriesByType('paint').map(e=>e.toJSON()),domElements:document.querySelectorAll('*').length,tableRows:document.querySelectorAll('tbody tr').length,navigation:performance.getEntriesByType('navigation').map(e=>e.toJSON()),resources:performance.getEntriesByType('resource').map(e=>e.toJSON()),ready:document.readyState,overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.querySelectorAll('main img')].map(img=>{const r=img.getBoundingClientRect(),s=getComputedStyle(img);return {src:img.getAttribute('src'),currentSrc:img.currentSrc,srcset:img.srcset,sizes:img.sizes,loading:img.loading,fetchPriority:img.fetchPriority,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,renderedWidth:r.width,renderedHeight:r.height,top:r.top,bottom:r.bottom,opacity:s.opacity,position:s.objectPosition,fit:s.objectFit};})};})()`);
 if(tracing)await traceEnd(folder+'/'+profile.name+'-trace.json');
 const network=[...requests.values()].map(r=>({...r,startMs:(r.start-navigation)*1000,endMs:r.end?(r.end-navigation)*1000:null,ttfbMs:r.timing?r.timing.receiveHeadersStart-r.timing.sendEnd:null}));
 const initial=network.filter(r=>r.type==='Image'&&r.startMs<8000);
 const entry={profile,page,run,warm,settings:{downloadBytesPerSecond:200000,uploadBytesPerSecond:93750,latencyMs:150,cpuSlowdown:4,windowMs:8000},state,network,summary:{fcpMs:state.paints?.find(e=>e.name==='first-contentful-paint')?.startTime??null,blockingTimeMs:state.longTasks?.reduce((sum,t)=>sum+Math.max(0,t.duration-50),0)??0,lcpMs:state.lcp?.at(-1)?.time??null,cls:state.shifts?.reduce((a,e)=>a+e.value,0)??null,firstImageMs:state.firstImage?.time??null,firstFullImageMs:state.firstFullImage?.time??null,imageRequests8s:initial.length,imageBytes8s:initial.reduce((a,r)=>a+(r.transferred??((r.received??0)+(r.encodedDataLength??0))),0),imageBytesTotal:network.filter(r=>r.type==='Image').reduce((a,r)=>a+(r.transferred??0),0),scriptBytes:network.filter(r=>r.type==='Script').reduce((a,r)=>a+(r.transferred??0),0),longTaskMs:state.longTasks?.reduce((a,t)=>a+t.duration,0)??0,failures:network.filter(r=>r.failure||r.status>=400).map(r=>({url:r.url,status:r.status,failure:r.failure}))}};
 results.push(entry);console.log(JSON.stringify({profile:profile.name,page,run,warm,...entry.summary}));fs.writeFileSync(folder+'/measurements.json',JSON.stringify({base,label,results,errors},null,2));
 if(run===0&&!warm){const screenshot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(folder+'/'+profile.name+'-'+page.replaceAll('/','_')+'.png',Buffer.from(screenshot.data,'base64'));}
 // Record actual delivered dimensions/format once per URL; no extra HTTP request.
 if(run===0&&!warm)for(const r of network.filter(r=>r.type==='Image'&&r.end&&!r.failure)){
  try{const body=await call('Network.getResponseBody',{requestId:r.requestId});const bytes=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');const m=await sharp(bytes).metadata();r.decodedMetadata={bytes:bytes.length,width:m.width,height:m.height,format:m.format};}catch(error){r.metadataError=error.message;}
 }
 fs.writeFileSync(folder+'/measurements.json',JSON.stringify({base,label,results,errors},null,2));
}
try{
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable',{maxTotalBufferSize:100000000,maxResourceBufferSize:20000000});
 if(process.env.PERF_IMAGE_ACCEPT)await call('Network.setExtraHTTPHeaders',{headers:{Accept:process.env.PERF_IMAGE_ACCEPT}});
 await call('Page.addScriptToEvaluateOnNewDocument',{source:observer});
 await call('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:'cellular4g'});
 await call('Emulation.setCPUThrottlingRate',{rate:4});
 for(const profile of profiles){
  await call('Emulation.setDeviceMetricsOverride',{width:profile.width,height:profile.height,deviceScaleFactor:profile.dpr,mobile:profile.name==='mobile'});
  for(const page of pages){for(let run=0;run<runs;run++)await measure(profile,page,run);await call('Network.setCacheDisabled',{cacheDisabled:false});await call('Page.navigate',{url:base+page});await delay(8000);await measure(profile,page,runs,true);}
 }
}finally{await call('Emulation.setCPUThrottlingRate',{rate:1});await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});clearInterval(keepAlive);ws.close();await fetch(cdp+'/json/close/'+tab.id);}
