import fs from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const sourcePath = 'output/image-edits/kvadrat-whole-source.png';
const output = 'output/image-edits/kvadrat-restored-original-2400x1800.png';
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
const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="20"/></filter><filter id="contact"><feGaussianBlur stdDeviation="3"/></filter></defs><rect width="100%" height="100%" fill="#FDFDFD"/><path d="M1025 789 L1585 -15 L2305 -15 L1515 1275 L1025 1195Z" fill="#333036" opacity="0.22" filter="url(#shadow)"/><path d="M1028 1187L1490 1260" stroke="#29262B" stroke-width="8" opacity="0.35" filter="url(#contact)"/></svg>`);
let floor=await sharp(svg).removeAlpha().raw().toBuffer();
const reflectionPlanes=[
  {src:S,dst:[dstPoint(0,2,0),dstPoint(1,2,0),D[2],D[3]], opacity:0.4,ground:x=>D[3][1]+(D[2][1]-D[3][1])*(x-D[3][0])/(D[2][0]-D[3][0])},
  {src:[S[1],S[2],farS[2],farS[1]],dst:[dstPoint(1,2,0),D[2],farD[2],dstPoint(1,2,2)],opacity:0.14,ground:x=>D[2][1]+(farD[2][1]-D[2][1])*(x-D[2][0])/(farD[2][0]-D[2][0])},
];
const reflection=Buffer.from(floor);
for(const plane of reflectionPlanes) {
  const matrix=homography(plane.dst,plane.src);
  const minX=Math.max(0,Math.floor(Math.min(...plane.dst.map(p=>p[0]))));
  const maxX=Math.min(W-1,Math.ceil(Math.max(...plane.dst.map(p=>p[0]))));
  for(let y=0;y<H;y++) for(let x=minX;x<=maxX;x++) {
    if(!inside(plane.dst,x+0.5,y+0.5)) continue;
    const point=map(matrix,x+0.5,y+0.5),color=sample(...point);
    const depth=Math.max(0,y-plane.ground(x));
    const opacity=plane.opacity*Math.exp(-depth/155)*Math.max(0,Math.min(1,(410-depth)/110));
    const index=(y*W+x)*3;
    for(let c=0;c<3;c++) reflection[index+c]=Math.round(floor[index+c]*(1-opacity)+color[c]*opacity);
  }
}
floor=await sharp(reflection,{raw:{width:W,height:H,channels:3}}).blur(1.1).raw().toBuffer();
// Retain the approved continuous photographic outline. Replace its surface
// texture with the original photograph, with a narrow edge transition.
const referencePath='output/image-edits/kvadrat-sawn-reflection-corrected-2400x1800.png';
const reference=await sharp(referencePath).removeAlpha().raw().toBuffer();
const product=Buffer.alloc(W*H*4);
let sampled=0;
const offsets=[[0.25,0.25],[0.75,0.25],[0.25,0.75],[0.75,0.75]];
for(let y=0;y<1300;y++) for(let x=990;x<W;x++) {
  let count=0;const sum=[0,0,0];
  for(const [dx,dy] of offsets) {
    const px=x+dx,py=y+dy;
    const plane=planes.find(plane=>inside(plane.dst,px,py));
    if(!plane) continue;
    const color=sample(...map(plane.matrix,px,py));
    let distance=Infinity;
    for(let i=0;i<plane.dst.length;i++) {
      const a=plane.dst[i],b=plane.dst[(i+1)%plane.dst.length];
      const vx=b[0]-a[0],vy=b[1]-a[1];
      distance=Math.min(distance,Math.abs(vx*(py-a[1])-vy*(px-a[0]))/Math.hypot(vx,vy));
    }
    const ri=(y*W+x)*3;
    const silhouette=distance>20?1:Math.max(0,Math.min(1,(245-Math.min(...reference.subarray(ri,ri+3)))/20));
    const alpha=Math.min(1,distance/9)*silhouette;
    for(let c=0;c<3;c++) sum[c]+=color[c]*alpha;
    count+=alpha;
  }
  if(!count) continue;
  const index=(y*W+x)*4;
  for(let c=0;c<3;c++) product[index+c]=Math.round(sum[c]/count);
  product[index+3]=Math.round(255*count/4);sampled++;
}
await sharp(reference,{raw:{width:W,height:H,channels:3}}).composite([{input:product,raw:{width:W,height:H,channels:4}}]).png().toFile(output);
await sharp(output).extract({left:970,top:700,width:700,height:850}).png().toFile('output/image-edits/kvadrat-restored-original-detail.png');
await fs.writeFile('output/image-edits/kvadrat-restored-original-method.json',JSON.stringify({source:sourcePath,reference:referencePath,output,method:'Source photograph texture transferred through continuous camera projections onto the approved photographic geometry. Nine-pixel transitions retain reference highlights and rounded outer edges; no new image generation.',size:[W,H],sourceFaceCorners:S,destinationFaceCorners:D,planes:planes.map(({name,src,dst})=>({name,src,dst})),sampledProductPixels:sampled},null,2)+'\n');
console.log(JSON.stringify({output,width:W,height:H,sampledProductPixels:sampled}));
