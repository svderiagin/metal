import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const input='output/image-edits/kvadrat-new-start-source.png';
const output='output/image-edits/kvadrat-reference-matched-clean-2400x1800.png';
const sourcePath='/var/folders/4r/5d6pj6416r3fzt01xv9jt1rr0000gq/T/codex-clipboard-dad4e9cf-7072-4171-af56-db632c16da74.png';
await fs.copyFile(sourcePath,input);
// Four corresponding end-face corners establish a uniform similarity fit.
// The fitted rotation is -0.0705 degrees, below screenshot landmark accuracy;
// retain the original orientation instead of introducing another resampling.
const sourceCorners=[[493,1334],[847,1417],[853,1759],[506,1673]];
const referenceCorners=[[1262,1142],[1904,1288],[1911,1908],[1282,1758]];
const referenceSize=[2996,2828],width=2400,height=1800;
const resizedWidth=2903,resizedHeight=2903,scale=resizedWidth/2000;
const left=291,top=-1274;
const {data,info}=await sharp(input).removeAlpha().resize(resizedWidth,resizedHeight,{kernel:'lanczos3'}).raw().toBuffer({resolveWithObject:true});
assert.equal(info.channels,3);
const pixels=Buffer.alloc(width*height*3);
let unchangedResizedPixels=0;
for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
  const sx=x-left,sy=y-top;
  const inSource=sx>=0&&sx<info.width&&sy>=0&&sy<info.height;
  const px=Math.max(0,Math.min(info.width-1,sx)),py=Math.max(0,Math.min(info.height-1,sy));
  const si=(py*info.width+px)*3,di=(y*width+x)*3;
  for(let c=0;c<3;c++)pixels[di+c]=data[si+c];
  if(inSource)unchangedResizedPixels++;
  if(sy>=info.height){
    let t=Math.min(1,(sy-info.height+1)/180);t=t*t*(3-2*t);
    const bg=[248,247,248];
    for(let c=0;c<3;c++)pixels[di+c]=Math.round(data[si+c]*(1-t)+bg[c]*t);
  }
}
await sharp(pixels,{raw:{width,height,channels:3}}).png().toFile(output);
const decoded=await sharp(output).removeAlpha().raw().toBuffer();
for(let y=0;y<Math.min(height,top+info.height);y++){
  const startX=Math.max(0,left),endX=Math.min(width,left+info.width),sy=y-top;
  assert.ok(decoded.subarray((y*width+startX)*3,(y*width+endX)*3).equals(data.subarray((sy*info.width+startX-left)*3,(sy*info.width+endX-left)*3)));
}
await fs.writeFile('output/image-edits/kvadrat-reference-matched-clean-method.json',JSON.stringify({input,output,width,height,sourceCorners,referenceCorners,referenceSize,referenceSimilarityFit:{scale:1.8120640627596591,rotationDegrees:-0.07052221635243923,maxLandmarkErrorPixels:3.78},applied:{uniformScale:scale,translation:[left,top],rotationDegrees:0},method:'One uniform Lanczos3 resize of the entire original photograph followed by integer placement on the canvas. Product, face, original shadow and original reflection always transformed together. No perspective editing, no separate face manipulation, no texture transfer, no AI generation or sharpening.',verifiedUnchangedPixelsAfterSingleResize:unchangedResizedPixels},null,2)+'\n');
console.log(JSON.stringify({output,width,height,scale,translation:[left,top],rotation:0,verifiedUnchangedPixelsAfterSingleResize:unchangedResizedPixels}));
