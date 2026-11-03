import fs from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const sourcePath = 'output/image-edits/kvadrat-whole-source.png';
const source = await sharp(sourcePath).removeAlpha().raw().toBuffer({resolveWithObject: true});
const W = 2400, H = 1800, SW = source.info.width, SH = source.info.height;
assert.equal(SW, 2000); assert.equal(SH, 2000);
const S = [[493,1334],[847,1417],[853,1759],[506,1673]];
const sourceVP = [4000,-1750];
const D = [[1018,778],[1500,856],[1500,1258],[1018,1182]];
const VP = [6200,-6500];

function homography(from, to) {
  const a = [];
  for(let i=0;i<4;i++) {
    const [x,y]=from[i], [u,v]=to[i];
    a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);
  }
  for(let col=0;col<8;col++) {
    let best=col;
    for(let row=col+1;row<8;row++) if(Math.abs(a[row][col])>Math.abs(a[best][col])) best=row;
    [a[col],a[best]]=[a[best],a[col]];
    const divisor=a[col][col]; assert.ok(Math.abs(divisor)>1e-9);
    for(let j=col;j<9;j++) a[col][j]/=divisor;
    for(let row=0;row<8;row++) if(row!==col) {
      const factor=a[row][col];
      for(let j=col;j<9;j++) a[row][j]-=factor*a[col][j];
    }
  }
  return [...a.map(row=>row[8]),1];
}
function map(matrix,x,y) {
  const z=matrix[6]*x+matrix[7]*y+1;
  return [(matrix[0]*x+matrix[1]*y+matrix[2])/z,(matrix[3]*x+matrix[4]*y+matrix[5])/z];
}
function inside(polygon,x,y) {
  let sign=0;
  for(let i=0;i<polygon.length;i++) {
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    const cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
    if(Math.abs(cross)<1e-6) continue;
    if(sign && Math.sign(cross)!==sign) return false;
    sign=Math.sign(cross);
  }
  return true;
}
const cubic=t=> {t=Math.abs(t);return t<=1?1.5*t*t*t-2.5*t*t+1:t<2?-0.5*t*t*t+2.5*t*t-4*t+2:0;};
function sample(x,y) {
  const ix=Math.floor(x),iy=Math.floor(y),result=[0,0,0];
  for(let dy=-1;dy<=2;dy++) for(let dx=-1;dx<=2;dx++) {
    const weight=cubic(x-ix-dx)*cubic(y-iy-dy);
    const index=(Math.max(0,Math.min(SH-1,iy+dy))*SW+Math.max(0,Math.min(SW-1,ix+dx)))*3;
    for(let c=0;c<3;c++) result[c]+=source.data[index+c]*weight;
  }
  return result.map(value=>Math.max(0,Math.min(255,value)));
}
// One projective camera per image. Every visible plane shares the same
// homogeneous coordinates along common edges, avoiding a detached end cap.
const unit=[[0,0],[1,0],[1,1],[0,1]];
const sourceFront=homography(unit,S), targetFront=homography(unit,D);
function project(front,vp,depthWeight,x,y,z) {
  const denominator=front[6]*x+front[7]*y+1+depthWeight*z;
  return [(front[0]*x+front[1]*y+front[2]+depthWeight*z*vp[0])/denominator,
    (front[3]*x+front[4]*y+front[5]+depthWeight*z*vp[1])/denominator];
}
const srcPoint=(x,y,z)=>project(sourceFront,sourceVP,0.5,x,y,z);
const dstPoint=(x,y,z)=>project(targetFront,VP,0.2,x,y,z);
const farS=[[0,0],[1,0],[1,1]].map(([x,y])=>srcPoint(x,y,2));
const farD=[[0,0],[1,0],[1,1]].map(([x,y])=>dstPoint(x,y,2));
const planes = [
  {name:'end', src:S, dst:D},
  {name:'top',src:[S[0],S[1],farS[1],farS[0]],dst:[D[0],D[1],farD[1],farD[0]]},
  {name:'side',src:[S[1],S[2],farS[2],farS[1]],dst:[D[1],D[2],farD[2],farD[1]]},
].map(plane=>({...plane,matrix:homography(plane.dst,plane.src)}));
function distanceToPolygon(polygon,x,y) {
  if(inside(polygon,x,y)) return 0;
  let distance=Infinity;
  for(let i=0;i<polygon.length;i++) {
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    const dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
    distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
  }
  return distance;
}
// Verify correspondence throughout both shared edges, not just their ends.
for(let t=0;t<=1;t+=0.05) {
  for(const [a,b,plane] of [[D[0],D[1],planes[1]],[D[1],D[2],planes[2]]]) {
    const point=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    const p=map(planes[0].matrix,...point),q=map(plane.matrix,...point);
    assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<0.001,'Shared edge mismatch');
  }
}
for(const plane of planes) for(let i=0;i<4;i++) {
  const point=map(plane.matrix,...plane.dst[i]);
  assert.ok(Math.hypot(point[0]-plane.src[i][0],point[1]-plane.src[i][1])<0.001);
}

const referencePath='output/image-edits/kvadrat-approved-rounded-reference-2400x1800.png';
const reference=await sharp(referencePath).removeAlpha().raw().toBuffer();
const pixels=Buffer.from(reference);
const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
let changed=0;
// Keep a complete, generous photographic edge band. The old narrow band
// included the source photograph's bevel highlight, creating a second edge.
for(let y=0;y<1300;y++) for(let x=990;x<W;x++) {
 const px=x+0.5,py=y+0.5;
 const plane=planes.find(p=>inside(p.dst,px,py));
 if(!plane)continue;
 let distance=Infinity;
 for(let i=0;i<plane.dst.length;i++){
  const a=plane.dst[i],b=plane.dst[(i+1)%plane.dst.length];
  const vx=b[0]-a[0],vy=b[1]-a[1];
  distance=Math.min(distance,Math.abs(vx*(py-a[1])-vy*(px-a[0]))/Math.hypot(vx,vy));
 }
 const alpha=smooth((distance-22)/36);
 if(alpha===0)continue;
 const color=sample(...map(plane.matrix,px,py));
 const idx=(y*W+x)*3;
 for(let c=0;c<3;c++)pixels[idx+c]=Math.round(reference[idx+c]*(1-alpha)+color[c]*alpha);
 changed++;
}
const intermediate='output/image-edits/kvadrat-corners-shadows-v2-surface.png';
await sharp(pixels,{raw:{width:W,height:H,channels:3}}).png().toFile(intermediate);
const floorLow=await sharp(reference,{raw:{width:W,height:H,channels:3}}).blur(8).raw().toBuffer();
const faceLow=await sharp(pixels,{raw:{width:W,height:H,channels:3}}).blur(5).raw().toBuffer();
const faceSoft=await sharp(pixels,{raw:{width:W,height:H,channels:3}}).blur(1.3).raw().toBuffer();
const left=1018,right=1500;
const contact=x=>1182+(1258-1182)*(x-left)/(right-left);
const top=x=>778+(856-778)*(x-left)/(right-left);
function read(buf,x,y,c){
 x=Math.max(0,Math.min(W-2,x)); y=Math.max(0,Math.min(H-2,y));
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const at=(dx,dy)=>buf[((iy+dy)*W+ix+dx)*3+c];
 return (1-fy)*((1-fx)*at(0,0)+fx*at(1,0))+fy*((1-fx)*at(0,1)+fx*at(1,1));
}
// Retain the reference floor's light and shadow gradients, replacing only
// reflection detail. Never paint the floor with a flat white rectangle.
for(let y=1182;y<1750;y++)for(let x=left-12;x<right+12;x++){
 const depth=y-contact(x);
 if(depth<24)continue;
 const side=smooth((x-left+12)/25)*smooth((right+12-x)/25);
 const alpha=side*smooth((depth-24)/35)*(1-smooth((depth-370)/130));
 if(alpha===0)continue;
 const sx=Math.max(left+28,Math.min(right-28,x));
 const sy=2*contact(sx)-y;
 const valid=smooth((sy-top(sx)-20)/25);
 const strength=0.6*Math.exp(-depth/220)*valid;
 const idx=(y*W+x)*3;
 for(let c=0;c<3;c++){
  const detail=read(faceSoft,sx,sy,c)-read(faceLow,sx,sy,c);
  const target=floorLow[idx+c]+detail*strength;
  pixels[idx+c]=Math.max(0,Math.min(255,Math.round(reference[idx+c]*(1-alpha)+target*alpha)));
 }
}
const output='output/image-edits/kvadrat-corners-shadows-v2-2400x1800.png';
await sharp(pixels,{raw:{width:W,height:H,channels:3}}).png().toFile(output);
await sharp(pixels,{raw:{width:W,height:H,channels:3}}).extract({left:970,top:725,width:620,height:650}).resize(930,975).png().toFile('output/image-edits/kvadrat-corners-shadows-v2-detail.png');
await fs.writeFile('output/image-edits/kvadrat-corners-shadows-v2-method.json',JSON.stringify({source:sourcePath,reference:referencePath,output,size:[W,H],edgeBand:{unchanged:22,transition:36},method:'Deterministic transfer from source with protected reference corners and highlights; preserve floor shading and replace reflection detail only.',changedProductPixels:changed},null,2));
console.log(JSON.stringify({output,changed}));
