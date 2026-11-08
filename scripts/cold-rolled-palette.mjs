import assert from 'node:assert/strict';

const textAreas = [[120,110,1250,110],[1060,460,300,85],[1025,1265,330,85],[480,990,215,100],[120,1610,1000,90]];
const cross = (a,b,c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points) {
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const lower=[],upper=[];
  for(const p of points) {while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(const p of points.toReversed()) {while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  return lower.slice(0,-1).concat(upper.slice(0,-1));
}
export async function coldRolledPalette(sharp, input) {
  const width=2400,height=1800;
  const original=await sharp(input).removeAlpha().raw().toBuffer();
  const clean=await sharp('public/images/catalog/listovoy-prokat/list_holodnokataniy/list_holodnokataniy_2400_1800_original.jpg').removeAlpha().raw().toBuffer();
  const points=[];
  for(let y=100;y<1400;y++) {
    let first=-1,last=-1;
    for(let x=700;x<2370;x++) {const p=(y*width+x)*3;if((clean[p]+clean[p+1]+clean[p+2])/3<210){if(first<0)first=x;last=x;}}
    if(first>=0)points.push([first,y],[last,y]);
  }
  const metalHull=hull(points);
  const inMetal=(x,y)=>metalHull.every((a,i)=>cross(a,metalHull[(i+1)%metalHull.length],[x,y])>=-2);
  const eligible=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const n=y*width+x,p=n*3,old=(original[p]+original[p+1]+original[p+2])/3,bg=(clean[p]+clean[p+1]+clean[p+2])/3;
    if(old<228&&bg>190&&bg-old>10&&!inMetal(x,y))eligible[n]=1;
  }
  const output=Buffer.from(original),mask=new Uint8Array(width*height),queue=new Int32Array(width*height);
  let components=0,changedPixels=0,textPixels=0,linePixels=0;
  for(let n=0;n<eligible.length;n++)if(eligible[n]) {
    let head=0,tail=1,minX=n%width,maxX=minX,minY=Math.floor(n/width),maxY=minY;
    queue[0]=n;eligible[n]=0;
    while(head<tail) {
      const at=queue[head++],x=at%width,y=Math.floor(at/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const xx=x+dx,yy=y+dy,near=yy*width+xx;
        if(xx>=0&&xx<width&&yy>=0&&yy<height&&eligible[near]){eligible[near]=0;queue[tail++]=near;}
      }
    }
    if(tail<4)continue;
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    const isText=maxY-minY<=90&&maxX-minX<=330&&textAreas.some(([x,y,w,h])=>cx>=x&&cx<x+w&&cy>=y&&cy<y+h);
    const color=isText?[65,70,77]:[89,99,111];
    components++;
    for(let i=0;i<tail;i++) {
      const at=queue[i],p=at*3,bg=(clean[p]+clean[p+1]+clean[p+2])/3,old=(original[p]+original[p+1]+original[p+2])/3;
      const alpha=Math.max(0,Math.min(1,(bg-old)/(bg-17)));
      for(let c=0;c<3;c++)output[p+c]=Math.max(0,Math.min(255,Math.round(original[p+c]+alpha*(color[c]-17))));
      mask[at]=isText?1:2;changedPixels++;if(isText)textPixels++;else linePixels++;
    }
  }
  let protectedPixelChanges=0;
  for(let n=0;n<mask.length;n++)if(!mask[n]&&!original.subarray(n*3,n*3+3).equals(output.subarray(n*3,n*3+3)))protectedPixelChanges++;
  assert.equal(protectedPixelChanges,0);
  const image=await sharp(output,{raw:{width,height,channels:3}}).webp({lossless:true,effort:4}).toBuffer();
  return {image,metrics:{text:'#41464D',lines:'#59636F',components,changedPixels,textPixels,linePixels,protectedPixelChanges,metalHull}};
}
