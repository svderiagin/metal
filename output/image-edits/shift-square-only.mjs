import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const input = 'output/image-edits/kvadrat-whole-source.png';
const output = 'output/image-edits/kvadrat-shift-only-2400x1800.png';
const {data,info} = await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject:true});
const width=2400,height=1800,dx=584,dy=-530;
const pixels=Buffer.alloc(width*height*3);
let copiedPixels=0;
for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
  const sx=x-dx,sy=y-dy;
  const inside=sx>=0&&sx<info.width&&sy>=0&&sy<info.height;
  // Only canvas padding uses nearest-edge background pixels. Every source
  // pixel that falls within the new frame is copied without resampling.
  const sampleX=Math.max(0,Math.min(info.width-1,sx));
  const sampleY=Math.max(0,Math.min(info.height-1,sy));
  const si=(sampleY*info.width+sampleX)*3,di=(y*width+x)*3;
  pixels[di]=data[si];pixels[di+1]=data[si+1];pixels[di+2]=data[si+2];
  if(sy>=info.height) {
    let t=Math.min(1,(sy-info.height+1)/240);t=t*t*(3-2*t);
    const background=[248,247,248];
    for(let c=0;c<3;c++) pixels[di+c]=Math.round(data[si+c]*(1-t)+background[c]*t);
  }
  if(inside) copiedPixels++;
}
await sharp(pixels,{raw:{width,height,channels:3}}).png().toFile(output);
const decoded=await sharp(output).removeAlpha().raw().toBuffer();
let verifiedPixels=0;
for(let y=Math.max(0,dy);y<Math.min(height,dy+info.height);y++) {
  const sourceY=y-dy,startX=Math.max(0,dx),endX=Math.min(width,dx+info.width);
  const a=decoded.subarray((y*width+startX)*3,(y*width+endX)*3);
  const b=data.subarray((sourceY*info.width+startX-dx)*3,(sourceY*info.width+endX-dx)*3);
  assert.ok(a.equals(b),'Source pixels changed');
  verifiedPixels+=endX-startX;
}
assert.equal(verifiedPixels,copiedPixels);
await fs.writeFile('output/image-edits/kvadrat-shift-only-method.json',JSON.stringify({input,output,width,height,translation:{x:dx,y:dy},method:'Integer translation of the entire source photograph, including its original shadow and reflection. No resize, rotation, perspective transform, texture transfer, sharpening or AI. New canvas padding uses source background edge pixels; added bottom background fades to a uniform studio tone.',verifiedUnchangedSourcePixels:verifiedPixels,originalFaceCenter:[674.75,1545.75],shiftedFaceCenter:[674.75+dx,1545.75+dy]},null,2)+'\n');
console.log(JSON.stringify({output,width,height,translation:[dx,dy],verifiedUnchangedSourcePixels:verifiedPixels}));
