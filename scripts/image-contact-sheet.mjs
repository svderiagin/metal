import fs from 'node:fs';
import sharp from 'sharp';
const root='brokinvest.ru';
const files=fs.readdirSync(root,{recursive:true}).filter(f=>/\.(png|jpe?g|webp)$/i.test(f));
fs.mkdirSync('.tmp/images',{recursive:true});
for(let offset=0;offset<files.length;offset+=40){
 const batch=files.slice(offset,offset+40),layers=[];
 for(let i=0;i<batch.length;i++){
  const f=batch[i];try{
   const tile=await sharp(root+'/'+f).resize(180,125,{fit:'inside',withoutEnlargement:true}).toBuffer();
   const x=(i%5)*200,y=Math.floor(i/5)*155;
   layers.push({input:tile,left:x,top:y});
   layers.push({input:Buffer.from(`<svg width="200" height="30"><rect width="200" height="30" fill="white"/><text x="3" y="20" font-size="14">${offset+i}: ${f.split(/[\\/]/).pop().slice(0,16)}</text></svg>`),left:x,top:y+125});
  }catch(e){console.log(f,e.message);}
 }
 await sharp({create:{width:1000,height:Math.ceil(batch.length/5)*155,channels:3,background:'#eeeeee'}}).composite(layers).png().toFile(`.tmp/images/contact-${offset}.png`);
}
fs.writeFileSync('.tmp/images/contact-index.json',JSON.stringify(files,null,2));
console.log(files.length);
