// Continuous weighted vector skinning. Outlines, paper cutouts and hatch marks
// use identical bind coordinates, so the engraved surface never separates.
const normalise=([x,y],side=0)=>[((side?2372.4-x:x)-350)*.13,(y-900)*.13];
export const RIG_CONFIG={proximalGain:.36,distalGain:.36,skinSoftness:1.4};
const PROFILES=[
 [[645,1150,590,840,580,585,575,650],[325,780,410,430,565,180,475,315],[270,740,260,390,270,75,285,380],[330,790,430,580,575,350,495,500],[390,800,470,650,575,440,520,550]],
 [[1710,1180,1780,900,1770,640,1770,650],[2100,790,2070,430,1935,175,2035,300],[2150,770,2210,450,2220,185,2110,470],[2100,810,2070,650,1860,375,2020,500],[2070,850,2070,700,1920,485,2040,600]]
];
export const FINGER_BONES=PROFILES.map((hand,side)=>hand.map((v,i)=>({name:['thumb','index','middle','ring','little'][i],base:normalise(v.slice(0,2),side),joint:normalise(v.slice(2,4),side),tip:normalise(v.slice(4,6),side),contact:normalise(v.slice(6,8),side),radius:(i===0?100:75)*.13*RIG_CONFIG.skinSoftness})));
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
function segmentDistance(x,y,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],u=clamp(((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy));return Math.hypot(x-a[0]-u*vx,y-a[1]-u*vy);}
export function bindPoint(x,y,side=0){
  let total=0;const influences=FINGER_BONES[side].map(b=>{
    const vx=b.tip[0]-b.base[0],vy=b.tip[1]-b.base[1],length=Math.hypot(vx,vy);
    const along=((x-b.base[0])*vx+(y-b.base[1])*vy)/(length*length);
    const distance=Math.min(segmentDistance(x,y,b.base,b.joint),segmentDistance(x,y,b.joint,b.tip));
    const weight=Math.exp(-distance*distance/(2*b.radius*b.radius))*smooth(along/.38);
    const jx=b.tip[0]-b.joint[0],jy=b.tip[1]-b.joint[1];
    const distal=smooth(((x-b.joint[0])*jx+(y-b.joint[1])*jy)/(jx*jx+jy*jy)/.7);
    total+=weight;return {weight,distal};
  });
  const denominator=Math.max(1,total);for(const b of influences)b.weight/=denominator;
  return {x,y,side,influences};
}
export function fingerMatrices(poses,rest,strength=1){return poses.map((p,i)=>{
  const proximal=(p.angle-rest[i].angle)*RIG_CONFIG.proximalGain*strength,distal=(p.bend-rest[i].bend)*RIG_CONFIG.distalGain*strength;
  return {c:Math.cos(proximal),s:Math.sin(proximal),dc:Math.cos(distal),ds:Math.sin(distal),proximal,distal};
});}
export function skinPoint(point,matrices){
  let ox=point.x,oy=point.y;
  for(let i=0;i<5;i++){
    const {weight,distal}=point.influences[i];if(weight<.00001)continue;
    const b=FINGER_BONES[point.side][i],m=matrices[i],jx=point.x-b.joint[0],jy=point.y-b.joint[1];
    const x=point.x+((jx*m.dc-jy*m.ds+b.joint[0])-point.x)*distal;
    const y=point.y+((jx*m.ds+jy*m.dc+b.joint[1])-point.y)*distal;
    const bx=x-b.base[0],by=y-b.base[1];
    ox+=(b.base[0]+bx*m.c-by*m.s-point.x)*weight;
    oy+=(b.base[1]+bx*m.s+by*m.c-point.y)*weight;
  }
  return [ox,oy];
}
const CONTACT_BINDINGS=FINGER_BONES.map((hand,side)=>hand.map(b=>bindPoint(...b.contact,side)));
export const fingerContacts=(matrices,side=0)=>CONTACT_BINDINGS[side].map(p=>skinPoint(p,matrices));
export function bindArtwork(data){return data.hands.map((hand,side)=>hand.map(path=>({...path,commands:path.commands.map(c=>({type:c[0],points:Array.from({length:(c.length-1)/2},(_,i)=>bindPoint(c[i*2+1],c[i*2+2],side))}))})));}
export function artworkPath(path,matrices){return path.commands.map(c=>c.type==='Z'?'Z':c.type+c.points.map(p=>skinPoint(p,matrices).map(v=>v.toFixed(3)).join(' ')).join(' ')).join(' ');}

