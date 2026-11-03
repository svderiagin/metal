import fs from 'node:fs/promises';
import sharp from 'sharp';
const source='/var/folders/4r/5d6pj6416r3fzt01xv9jt1rr0000gq/T/codex-clipboard-f1e5209a-4928-46a9-82e6-645177173f9c.png';
const output='output/image-edits/kvadrat-clean-master-2400x1800.png';
const {data,info}=await sharp(source).flop().removeAlpha().raw().toBuffer({resolveWithObject:true});
const {width:SW,height:SH}=info;
const clean=Buffer.from(data);
const luma=new Float32Array(SW*SH);
for(let i=0;i<luma.length;i++)luma[i]=.2126*data[i*3]+.7152*data[i*3+1]+.0722*data[i*3+2];
const taps=[];
for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++)taps.push([xx,yy,Math.exp(-(xx*xx+yy*yy)/(2*.9*.9))]);
const range=Float64Array.from({length:256},(_,d)=>Math.exp(-d*d/(2*7*7)));
// A restrained, edge-aware pass reduces fine speckle before enlargement.
// Strong cut edges and the contrast of sawn marks retain their source geometry.
for(let y=2;y<SH-2;y++)for(let x=2;x<SW-2;x++){
 const i=y*SW+x,center=luma[i],sum=[0,0,0];let total=0;
 for(const [xx,yy,spatial]of taps){
  const j=(y+yy)*SW+x+xx;
  const weight=spatial*range[Math.min(255,Math.round(Math.abs(luma[j]-center)))];
  total+=weight;
  for(let c=0;c<3;c++)sum[c]+=data[j*3+c]*weight;
 }
 for(let c=0;c<3;c++)clean[i*3+c]=Math.round(data[i*3+c]*.25+sum[c]/total*.75);
}
const scaled=await sharp(clean,{raw:{width:SW,height:SH,channels:3}})
 .resize(2700,2700,{kernel:sharp.kernel.lanczos3})
 .sharpen({sigma:.55,m1:0,m2:.8,x1:10,y2:2,y3:3})
 .raw().toBuffer({resolveWithObject:true});
const W=2400,H=1800,dx=472,dy=-1070,SS=scaled.info.width;
const pixels=Buffer.alloc(W*H*3);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const sx=Math.max(0,Math.min(SS-1,x-dx)),yy=y-dy,sy=Math.max(0,Math.min(SS-1,yy));
 const idx=(sy*SS+sx)*3,oi=(y*W+x)*3;
 const fade=yy>SS-1?1-Math.exp(-(yy-SS+1)/135):0;
 for(let c=0;c<3;c++)pixels[oi+c]=Math.round(scaled.data[idx+c]*(1-fade)+248*fade);
}
await sharp(pixels,{raw:{width:W,height:H,channels:3}}).withIccProfile('srgb').png().toFile(output);
await sharp(pixels,{raw:{width:W,height:H,channels:3}}).resize(1200,900,{kernel:sharp.kernel.lanczos3}).png().toFile('output/image-edits/kvadrat-clean-master-preview.png');
await sharp(pixels,{raw:{width:W,height:H,channels:3}}).extract({left:1110,top:715,width:550,height:640}).png().toFile('output/image-edits/kvadrat-clean-master-detail-100pct.png');
await fs.writeFile('output/image-edits/kvadrat-clean-master-method.json',JSON.stringify({source,output,size:[W,H],sourceSize:[SW,SH],method:'Mirror full source photograph; restrained bilateral speckle reduction; one Lanczos3 resize to 135%; thresholded edge sharpening; integer placement. No synthetic texture, plane reconstruction or reflection reconstruction.',denoise:{spatialSigma:.9,rangeSigma:7,mix:.75},sharpen:{sigma:.55,m1:0,m2:.8,x1:10,y2:2,y3:3},placement:{dx,dy},profile:'sRGB',format:'lossless PNG'},null,2));
console.log(JSON.stringify({output,width:W,height:H,bytes:(await fs.stat(output)).size}));
