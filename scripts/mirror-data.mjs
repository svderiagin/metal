import fs from 'node:fs';
export function flight(file) {
 const s=fs.readFileSync(file,'utf8');
 return [...s.matchAll(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g)].map(m=>JSON.parse(m[1])[1]).join('');
}
export function objects(text,issues=[]) {
 const out=[];
 const candidates=/(?<!\\)\{"/g;
 let match;
 while((match=candidates.exec(text))){
  const start=match.index;let end=start,depth=0,quoted=false,escape=false;
  for(;end<text.length;end++){
   const c=text[end];
   if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}
   if(c==='"')quoted=true;
   else if(c==='{')depth++;
   else if(c==='}'&&--depth===0){end++;break;}
  }
  try{out.push(JSON.parse(text.slice(start,end)));candidates.lastIndex=end;}catch(e){issues.push({offset:start,message:e.message,preview:text.slice(start,start+120)});}
 }
 return out;
}
export function walk(value,fn){if(!value||typeof value!=='object')return;fn(value);for(const v of Object.values(value))walk(v,fn);}
