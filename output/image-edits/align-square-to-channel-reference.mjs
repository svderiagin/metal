import fs from 'node:fs/promises';
import sharp from 'sharp';
const input='output/image-edits/kvadrat-whole-source.png';
const reference='/var/folders/4r/5d6pj6416r3fzt01xv9jt1rr0000gq/T/codex-clipboard-b0267ad8-6ab6-4b2e-b9fd-b17f1e10c327.png';
const output='output/image-edits/kvadrat-channel-angle-position-2400x1800.png';
const {data,info}=await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject:true});
const {width:SW,height:SH}=info,W=2400,H=1800;
const sourceCenter=[(493+847+853+506)/4,(1334+1417+1759+1673)/4];
const targetCenter=[1814/3148*W,1331/2356*H];
const sourceAngle=Math.atan2(14-1334,1999-493);
const targetAngle=Math.atan2(-882*H/2356,1015*W/3148);
const theta=targetAngle-sourceAngle,scale=1.35,co=Math.cos(theta),si=Math.sin(theta);
const cubic=v=>{v=Math.abs(v);return v<=1?1.5*v*v*v-2.5*v*v+1:v<2?-.5*v*v*v+2.5*v*v-4*v+2:0;};
function sample(x,y){
 const xx=Math.max(0,Math.min(SW-1,x)),yy=Math.max(0,Math.min(SH-1,y));
 const ix=Math.floor(xx),iy=Math.floor(yy),rgb=[0,0,0];
 for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=2;dx++){
  const weight=cubic(xx-ix-dx)*cubic(yy-iy-dy);
  const idx=(Math.max(0,Math.min(SH-1,iy+dy))*SW+Math.max(0,Math.min(SW-1,ix+dx)))*3;
  for(let c=0;c<3;c++)rgb[c]+=data[idx+c]*weight;
 }
 // Extend the already empty background smoothly below the original canvas.
 // The steel bar never intersects this extended region.
 if(y>SH-1){const a=1-Math.exp(-(y-SH+1)/100);for(let c=0;c<3;c++)rgb[c]=rgb[c]*(1-a)+248*a;}
 return rgb;
}
const pixels=Buffer.alloc(W*H*3);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const px=(x+.5-targetCenter[0])/scale,py=(y+.5-targetCenter[1])/scale;
 const sx=sourceCenter[0]+co*px+si*py,sy=sourceCenter[1]-si*px+co*py;
 const rgb=sample(sx,sy),idx=(y*W+x)*3;
 for(let c=0;c<3;c++)pixels[idx+c]=Math.max(0,Math.min(255,Math.round(rgb[c])));
}
await sharp(pixels,{raw:{width:W,height:H,channels:3}}).png().toFile(output);
await fs.writeFile('output/image-edits/kvadrat-channel-angle-position-method.json',JSON.stringify({input,reference,output,canvas:[W,H],sourceCenter,targetCenter,sourceAngleDeg:sourceAngle*180/Math.PI,targetAngleDeg:targetAngle*180/Math.PI,rotationDeg:theta*180/Math.PI,scale,method:'Single similarity transform of the entire original photograph, including original corners, shadows and reflection. No plane warps, material replacement or generation.'},null,2));
console.log(JSON.stringify({output,targetCenter,angleDeg:targetAngle*180/Math.PI,rotationDeg:theta*180/Math.PI}));
