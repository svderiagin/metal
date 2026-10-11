import fs from 'node:fs';
import {flight} from './mirror-data.mjs';
const target='imports/image-source-inventory.json';
const source=JSON.parse(fs.readFileSync(target,'utf8'));
const text=flight('brokinvest.ru/article.html');
const images=[];
for(const m of text.matchAll(/<img\b[^>]*>/g)){
 const url=m[0].match(/src="([^"]+)"/)?.[1],alt=m[0].match(/alt="([^"]*)"/)?.[1];if(!url)continue;
 const file=source.images.find(i=>i.file===url.replace(/^.*\/api\/v1\/files\//,'_back.brokinvest.ru/api/v1/files/'));if(!file)continue;
 const context=text.slice(Math.max(0,m.index-650),m.index+300).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 if(!images.some(i=>i.sourceImage===file.file&&i.alt===alt))images.push({sourceImage:file.file,originalUrl:url,alt,context,sourcePages:['article.html']});
}
source.contentImages=images;
fs.writeFileSync(target,JSON.stringify(source,null,2));
for(const i of images)console.log(i.sourceImage.split('/').pop(),i.alt);
