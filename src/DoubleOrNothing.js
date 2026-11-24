import {CONFIG} from './sceneConfig.js';import {phase,track,mix,pointMix,clamp} from './motionMath.js';
const TAU=Math.PI*2;
const orbit=(pivot,r,angle)=>[pivot[0]+r*Math.cos(angle),pivot[1]+r*Math.sin(angle)];
export function trickPosition(t,f){
 // Source panel 1: an underhand sweep around the retained free index.
 // Panel 2: the yo-yo passes outside the throwing index before circling above.
 // Panel 3: it passes outside the free index, returns below, then mounts the front span.
 // Shared Hermite derivatives keep world velocity continuous at both captures.
 const margin=f.w*(f.mobile?.09:.07),drop=Math.min(f.h*.14,f.d*.30);
 const orbitKeys=[
  [0,f.left[0]-margin,f.left[1]-f.h*.10],
  [1,f.left[0]-margin,f.left[1]-f.h*.10],
  [1.5,f.w*.48,f.left[1]+f.h*.22],
  [2.2,f.right[0]+margin,f.right[1]],
  [2.55,f.right[0]+margin*.4,f.right[1]-f.h*.16],
  [2.9,f.w*.49,f.left[1]-f.h*.19],
  [3.2,f.left[0]-margin,f.left[1]],
  [3.55,f.left[0]+margin*.1,f.left[1]+f.h*.16],
  [3.85,f.w*.48,f.left[1]+f.h*.12],
  [4,f.w*.5,f.left[1]],
  [4.2,f.w*.5,f.left[1]-f.h*.12],
  [4.65,f.w*.5,f.left[1]+drop],
  [5.1,f.w*.5,f.left[1]+drop]
 ];
 let xy=[1,2].map(i=>track(orbitKeys.map(k=>[k[0],k[i]]),Math.min(t,5.1)));
 let diameter=f.diameter,rx=.03,ry=Math.PI+.50,rz=0;
 if(t>5.1){
  const fx=f.w*(f.mobile?.5+(CONFIG.final.x-.5)*.72:CONFIG.final.x),fy=f.h*CONFIG.final.y,fd=f.mobile?Math.min(CONFIG.final.diameter*f.h*.76,f.w*.76):CONFIG.final.diameter*f.h;
  const keys=[[5.1,...xy,diameter,.03,Math.PI+.50,0],[5.3,f.w*.54,f.left[1]+Math.min(f.h*.14,f.d*.30)-f.h*.05,diameter,.06,Math.PI+.48,-.10],[5.65,f.w*.69,f.h*.58,diameter*1.12,.10,Math.PI+.45,-.13],[6.1,f.w*.74,f.h*.65,mix(diameter,fd,.22),.12,Math.PI+.50,-.07],[6.3,f.w*.67,f.h*.62,mix(diameter,fd,.38),.10,Math.PI+.57,.04],[6.7,f.w*.65,f.h*.70,mix(diameter,fd,.72),.04,Math.PI+.68,.09],[7.25,fx-.008*f.w,fy-.012*f.h,fd,.025,Math.PI+.63,.035],[8,fx,fy,fd,CONFIG.final.rx,CONFIG.final.ry,CONFIG.final.rz]];
  const v=Array.from({length:6},(_,i)=>track(keys.map(k=>[k[0],k[i+1]]),t));[xy,diameter,rx,ry,rz]=[[v[0],v[1]],v[2],v[3],v[4],v[5]];
 }
 return{x:xy[0],y:xy[1],diameter,rx,ry,rz};
}
const closest=(a,b,p)=>{const dx=b[0]-a[0],dy=b[1]-a[1],u=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1));return[a[0]+u*dx,a[1]+u*dy];};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function circleNode(id,point,radius,kind='finger'){return{id,point,radius,kind};}
// Exact tangencies and clockwise contact arcs. New contacts begin at radius 0
// on the existing span: topology changes without pre-drawing or fading a line.
export function sampleRoute(nodes){
 const samples=[nodes[0].point.slice()];
 samples.frontArcs=[];samples.spans=[];
 const tether=nodes[0];
 if(tether.radius>.02){
  const r=tether.radius,c=tether.point,next=nodes[1].point;
  const exit=Math.atan2(next[1]-c[1],next[0]-c[0])-Math.acos(clamp(r/distance(c,next),-1,1));
  samples[0]=orbit(c,r,exit+TAU);let front=[];
  for(let k=1;k<=40;k++){
   const theta=exit+TAU*(1-k/40),p=orbit(c,r,theta);samples.push(p);
   if(Math.sin(theta)>.05)front.push(p);else if(front.length){if(front.length>1)samples.frontArcs.push({id:tether.id,points:front});front=[];}
  }
  if(front.length>1)samples.frontArcs.push({id:tether.id,points:front});
  tether.approach=exit+TAU;tether.exit=exit;tether.wrapDirection='clockwise';tether.contactDepth='back-to-front';
 }
 const line=(p,fromId,toId)=>{const a=samples.at(-1),steps=Math.max(1,Math.ceil(distance(a,p)/9));if(distance(a,p)>2){const span=[a,p];span.fromId=fromId;span.toId=toId;samples.spans.push(span);}for(let j=1;j<=steps;j++)samples.push(pointMix(a,p,j/steps));};
 for(let i=1;i<nodes.length-1;i++){
  const n=nodes[i],c=n.point,r=Math.min(n.radius||0,distance(c,nodes[i-1].point)*.24,distance(c,nodes[i+1].point)*.24);
  if(r<.02){line(c,nodes[i-1].id,n.id);continue;}
  let a=nodes[i-1].point,b=nodes[i+1].point;
  if(nodes[i-1].tangentBlend!==undefined)a=pointMix(nodes[i-2].point,a,nodes[i-1].tangentBlend);
  if(nodes[i+1].tangentBlend!==undefined)b=pointMix(nodes[i+2].point,b,nodes[i+1].tangentBlend);
  let start=Math.atan2(a[1]-c[1],a[0]-c[0])+Math.acos(clamp(r/distance(a,c),-1,1));
  let end=Math.atan2(b[1]-c[1],b[0]-c[0])-Math.acos(clamp(r/distance(b,c),-1,1));
  while(end>start+1e-6)end-=TAU;while(end<start-TAU-1e-6)end+=TAU;
  n.approach=start;n.exit=end;n.wrapDirection='clockwise';n.contactDepth='back-to-front';
  line(orbit(c,r,start),nodes[i-1].id,n.id);const steps=Math.max(8,Math.ceil((start-end)*r/1.5));let front=[];
  for(let k=0;k<=steps;k++){
   const theta=mix(start,end,k/steps),p=orbit(c,r,theta);if(k)samples.push(p);
   // Same routed arc, split by contact depth. The back half is masked by the
   // actual hand silhouette; the near half is drawn over that same finger.
   if(n.kind==='finger'&&Math.sin(theta)>.05)front.push(p);
   else if(front.length){if(front.length>1)samples.frontArcs.push({id:n.id,points:front});front=[];}
  }
  if(front.length>1)samples.frontArcs.push({id:n.id,points:front});
 }
 line(nodes.at(-1).point,nodes.at(-2).id,nodes.at(-1).id);return samples;
}
export function routedString(t,f,tips,axle){
 const root=tips[1][2],left=tips[0][1],right=tips[1][1];
 const handScale=f.mobile?Math.min(f.w/CONFIG.hands.mobileDesignWidth,f.h/700)*CONFIG.hands.mobileScale:Math.min(f.w/1440,f.h/900)*CONFIG.hands.scale;
 const rf=7.5*handScale,gap=Math.max(3,rf*.58);
 const l1=[left[0],left[1]-gap],l2=[left[0],left[1]+gap],r1=right.slice();
 let nodes=[circleNode('throw-middle-tether',root,rf*.85*(1-phase(t,5.8,6.3)),'tether')];
 const setup=phase(t,.75,1),first=phase(t,2.2,2.30),second=phase(t,3.2,3.30),mount=phase(t,4.58,4.68);
 const insert=(target,a,b,u)=>pointMix(closest(a,b,target),target,u);
 if(t>=.75)nodes.push(circleNode('free-index-initial',insert(l1,root,axle,setup),rf*setup));
 if(t>=4.58)nodes.push(circleNode('front-span-mount',insert(axle,l1,r1,mount),0,'mount'));
 if(t>=2.2)nodes.push(circleNode('throw-index-wrap',insert(r1,l1,axle,first),rf*first));
 if(t>=3.2)nodes.push(circleNode('free-index-second',insert(l2,r1,axle,second),rf*second));
 nodes.push(circleNode('axle-end',axle,0,'axle'));
 const mounted=nodes.find(n=>n.id==='front-span-mount');
 if(mounted&&t<5.22){
  const baseline=sampleRoute(nodes.filter(n=>n!==mounted)),span=baseline.spans.find(s=>s.fromId==='free-index-initial'&&s.toId==='throw-index-wrap');
  const amount=mount*(1-phase(t,5.1,5.22));
  mounted.point=pointMix(closest(...span,axle),axle,amount);mounted.tangentBlend=amount;
 }
 // Drop the throwing index, unwind to a trapeze, then release the free index.
 // Released loops are shrinking bights; they are not counted as finger contacts.
 if(t>=5.1){
  const lift=nodes.find(n=>n.id==='front-span-mount');
  if(lift)lift.kind='bight';
  if(t>=5.22)nodes=nodes.filter(n=>n.id!=='front-span-mount');
  const drop=phase(t,5.15,5.55),n=nodes.find(n=>n.id==='throw-index-wrap');
  if(n){n.kind=drop>0?'bight':'finger';n.point=pointMix(n.point,l2,drop);n.radius*=1-drop;}
  if(t>=5.55)nodes=nodes.filter(n=>n.id!=='throw-index-wrap');
  const unwind=phase(t,5.55,5.85),secondNode=nodes.find(n=>n.id==='free-index-second');
  if(secondNode){secondNode.point=pointMix(secondNode.point,l1,unwind);secondNode.radius*=1-unwind;if(t>=5.55)secondNode.radius*=phase(t,5.55,5.65);secondNode.kind=unwind>0?'bight':'finger';}
  if(t>=5.85)nodes=nodes.filter(n=>n.id!=='free-index-second');
  const retained=nodes.find(n=>n.id==='free-index-initial');if(retained&&t>=5.85)retained.radius*=phase(t,5.85,5.95);
  const release=phase(t,6,6.35),guide=nodes.find(n=>n.id==='free-index-initial');
  if(guide){guide.point=pointMix(guide.point,closest(root,axle,guide.point),release);guide.radius*=1-phase(t,5.95,6.05);guide.kind=release>0?'bight':'finger';}
  if(t>=6.35)nodes=nodes.filter(n=>n.id!=='free-index-initial');
 }
 let samples=sampleRoute(nodes),frontArcs=samples.frontArcs,spans=samples.spans;
 // Once the last guide is gone, a single continuous outgoing strand curves
 // with the same tether hand as it withdraws below the viewport to bottom-left.
 const swing=phase(t,6.35,7.5);
 if(swing>0){const c1=[mix(root[0],axle[0],.18),root[1]+f.h*.03],c2=[axle[0]-f.w*.26,axle[1]+f.h*.30];samples=Array.from({length:121},(_,i)=>{const u=i/120,q=1-u,c=[q*q*q*root[0]+3*q*q*u*c1[0]+3*q*u*u*c2[0]+u*u*u*axle[0],q*q*q*root[1]+3*q*q*u*c1[1]+3*q*u*u*c2[1]+u*u*u*axle[1]];return pointMix(pointMix(root,axle,u),c,swing);});}
 const length=samples.slice(1).reduce((sum,p,i)=>sum+distance(p,samples[i]),0),restLength=distance(root,left)+f.d*1.15;
 return{nodes,samples,frontArcs,spans,length,restLength,tension:Math.min(1,length/restLength),activeContacts:nodes.filter(n=>n.kind==='finger').map(n=>n.id),firstWrap:first,secondWrap:second,mount};
}





