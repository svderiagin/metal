import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';

const {HERO_SLIDES}=readProjectData('data/hero-slides.ts');
const base=process.env.HERO_TEST_URL??'http://127.0.0.1:3000';
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const imageReport=[];
for(const slide of HERO_SLIDES){
 const file=path.resolve('public','.'+slide.src);
 const bytes=fs.readFileSync(file);
 const metadata=await sharp(bytes).metadata();
 assert.equal(metadata.format,'jpeg');
 await sharp(bytes).resize({width:100}).raw().toBuffer();
 const original=path.resolve('images/hero',path.basename(file));
 if(fs.existsSync(original))assert.equal(hash(bytes),hash(fs.readFileSync(original)),'Исходная фотография не изменена');
 const response=await fetch(base+slide.src);
 assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^image\/jpeg/);
 const served=Buffer.from(await response.arrayBuffer());assert.equal(hash(served),hash(bytes));
 imageReport.push({file:path.relative(process.cwd(),file),url:slide.src,width:metadata.width,height:metadata.height,bytes:bytes.length,format:'JPEG',http:200});
}
for(const format of ['avif','webp']){
 const version=hash(fs.readFileSync(path.resolve('public','.'+HERO_SLIDES[0].src))).slice(0,12);
 const response=await fetch(base+'/_next/image?'+new URLSearchParams({url:HERO_SLIDES[0].src+'?v='+version,w:'640',q:'75'}),{headers:{Accept:'image/'+format}});
 assert.equal(response.status,200,response.status===200?'':await response.clone().text());assert.equal(response.headers.get('content-type'),'image/'+format);
 const optimized=Buffer.from(await response.arrayBuffer());
 await sharp(optimized).raw().toBuffer();
 assert.ok((await sharp(optimized).stats()).channels.some(c=>c.stdev>5),'Оптимизатор отдаёт настоящую фотографию, а не однотонный тестовый кадр');
}
fs.mkdirSync('.tmp/local-audit', {recursive:true});
fs.writeFileSync('.tmp/local-audit/hero-image-files.json', JSON.stringify(imageReport,null,2)+'\n');
process.env.AUDIT_URL ??= base;
process.env.AUDIT_CDP ??= 'http://127.0.0.1:9223';
await import('./check-local-browser.mjs');
