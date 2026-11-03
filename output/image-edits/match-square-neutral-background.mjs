import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const source='/var/folders/4r/5d6pj6416r3fzt01xv9jt1rr0000gq/T/codex-clipboard-dda9ec56-1fab-4a6c-86de-97fad21a8dfc.png';
const reference='imports/shveller-image-template/photo.png';
const {data,info}=await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true});
const W=info.width,H=info.height;
const ref=await sharp(reference).resize(W,H,{kernel:sharp.kernel.lanczos3}).removeAlpha().raw().toBuffer();
const curves=[new Float64Array(H*3),new Float64Array(H*3)];
for(let y=0;y<H;y++){
 for(let c=0;c<3;c++){
  let a=0,b=0;
  for(let x=40;x<400;x++){a+=data[(y*W+x)*3+c];b+=ref[(y*W+x)*3+c];}
  curves[0][y*3+c]=a/360;curves[1][y*3+c]=b/360;
 }
}
const delta=new Float64Array(H*3);
for(let y=0;y<H;y++)for(let c=0;c<3;c++){
 let total=0,sum=0;
 for(let yy=Math.max(0,y-120);yy<=Math.min(H-1,y+120);yy++){
  const w=Math.exp(-((yy-y)**2)/(2*45**2));
  sum+=(curves[1][yy*3+c]-curves[0][yy*3+c])*w;total+=w;
 }
 delta[y*3+c]=sum/total;
}
// Protect the complete original steel and its antialiased boundary. Only
// the white point of the original floor is adjusted; shadows and reflection
// retain their original position, gradients and scratch pattern.
const polygon=[[1198,-5],[W+5,-5],[W+5,254],[978,787],[695,717],[685,442]];
function distance(x,y){
 let inside=false,min=Infinity;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  min=Math.min(min,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
 }
 return inside?0:min;
}
const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
const out=Buffer.from(data);let protectedPixels=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const d=distance(x+.5,y+.5),alpha=smooth((d-5)/18),idx=(y*W+x)*3;
 if(alpha===0){protectedPixels++;continue;}
 for(let c=0;c<3;c++)out[idx+c]=Math.max(0,Math.min(255,Math.round(data[idx+c]+delta[y*3+c]*alpha)));
}
let protectedChanges=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(distance(x+.5,y+.5)<=5){const idx=(y*W+x)*3;for(let c=0;c<3;c++)if(out[idx+c]!==data[idx+c])protectedChanges++;}
assert.equal(protectedChanges,0);
const native='output/image-edits/kvadrat-neutral-background-native.png';
const output='output/image-edits/kvadrat-neutral-background-2400x1800.png';
await sharp(out,{raw:info}).withIccProfile('srgb').png().toFile(native);
await sharp(out,{raw:info}).resize(2400,1800,{kernel:sharp.kernel.lanczos3}).withIccProfile('srgb').png().toFile(output);
await sharp(out,{raw:info}).resize(1200,900,{kernel:sharp.kernel.lanczos3}).png().toFile('output/image-edits/kvadrat-neutral-background-preview.png');
const samples=[];
for(const y0 of [180,545,865]){
 const a=[0,0,0],b=[0,0,0];let n=0;
 for(let y=y0;y<y0+60;y++)for(let x=40;x<260;x++){n++;for(let c=0;c<3;c++){a[c]+=out[(y*W+x)*3+c];b[c]+=ref[(y*W+x)*3+c];}}
 samples.push({y:y0,result:a.map(v=>Math.round(v/n)),reference:b.map(v=>Math.round(v/n))});
}
const method={source,reference,native,output,size:[2400,1800],nativeSize:[W,H],protectedPixels,protectedPixelChanges:protectedChanges,samples,method:'Built-in imagegen background study followed by deterministic white-point matching of the original floor to the channel reference. Product pixels protected and copied byte-identically at native resolution. Original shadow/reflection geometry and detail retained, no material regeneration. One Lanczos3 upscale for the 2400x1800 export.'};
await fs.writeFile('output/image-edits/kvadrat-neutral-background-method.json',JSON.stringify(method,null,2));
console.log(JSON.stringify(method));
