import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {CONFIG,frameLayout,pose,anchors,getFingerMatrices,handPose,handPoint} from '../src/choreography.js';
import {trickPosition} from '../src/DoubleOrNothing.js';import {stringState} from '../src/StringRig.js';import {bindArtwork,bindPoint,skinPoint} from '../src/FingerRig.js';
const data=JSON.parse(fs.readFileSync('public/assets/selected-hands-rig.json','utf8')),source=fs.readFileSync('public/assets/hands-01-source.svg');assert.equal(data.sourceSha256,crypto.createHash('sha256').update(source).digest('hex'));
let restError=0,minimumJacobian=10;
for(const[side,hand]of bindArtwork(data).entries())for(const path of hand)for(const command of path.commands)for(const p of command.points){const q=skinPoint(p,getFingerMatrices(1,side));restError=Math.max(restError,Math.hypot(q[0]-p.x,q[1]-p.y));}assert(restError<1e-9);
for(const t of [0,1,2.15,3.15,4.8,5.5])for(let side=0;side<2;side++){const m=getFingerMatrices(t,side);for(let x=-40;x<80;x+=7)for(let y=-115;y<155;y+=7){const p=skinPoint(bindPoint(x,y,side),m),a=skinPoint(bindPoint(x+.1,y,side),m),b=skinPoint(bindPoint(x,y+.1,side),m),det=((a[0]-p[0])*(b[1]-p[1])-(a[1]-p[1])*(b[0]-p[0]))/.01;minimumJacobian=Math.min(minimumJacobian,det);assert(det>.35,'Hand surface folded');}}
assert(Math.abs(getFingerMatrices(2.15,1)[1].distal-getFingerMatrices(2.15,0)[1].distal)>.1,'Index gestures must be independently timed');
const checks=[];
for(const[w,h]of [[1440,900],[1101,830],[390,844],[768,1024],[320,568]]){
 const f=frameLayout(w,h),state=t=>{const p=pose(t,w<650,w/h);return stringState(t,w,h,{axle:[p.x*w,p.y*h]});};let maxStep=0,prev=pose(0,w<650,w/h);
 for(let k=0;k<=960;k++){const t=k/120,p=pose(t,w<650,w/h),s=state(t);assert(Object.values(p).every(Number.isFinite));assert(s.samples.flat().every(Number.isFinite));assert(Math.hypot(s.samples.at(-1)[0]-p.x*w,s.samples.at(-1)[1]-p.y*h)<1e-8);const tether=anchors(t,w,h)[1][2];assert(Math.abs(Math.hypot(...s.samples[0].map((v,i)=>v-tether[i]))-s.nodes[0].radius)<.03);for(const arc of s.frontArcs)assert(s.nodes.some(n=>n.id===arc.id&&(n.kind==='finger'||n.kind==='tether')),'Foreground wrap detached from its logical contact');maxStep=Math.max(maxStep,Math.hypot((p.x-prev.x)*w,(p.y-prev.y)*h));prev=p;
  if(t>=1&&t<=5.1){const r=p.diameter*h*.65;assert(p.x*w-r>=0&&p.x*w+r<=w&&p.y*h-r>=0&&p.y*h+r<=h,'Trick model clipped by viewport');}
 }
 for(const t of [2.2,3.2,4,5.1]){const e=1e-5,a=trickPosition(t-e,f),b=trickPosition(t,f),c=trickPosition(t+e,f),gap=Math.hypot((c.x-2*b.x+a.x)/e,(c.y-2*b.y+a.y)/e);assert(gap<.2,'Velocity discontinuity at contact event');}
 let maximumTopologyJump=0;for(const t of [2.2,3.2,4.58,5.22,5.55,5.85,6.35]){const jump=Math.abs(state(t-1e-5).length-state(t+1e-5).length);maximumTopologyJump=Math.max(maximumTopologyJump,jump);assert(jump<.5,'Topology event abruptly changed string length');}
 assert(!state(2.19).activeContacts.includes('throw-index-wrap'));assert(state(2.31).activeContacts.includes('throw-index-wrap'));assert(!state(3.19).activeContacts.includes('free-index-second'));assert(state(3.31).activeContacts.includes('free-index-second'));assert(state(4.8).nodes.some(n=>n.id==='front-span-mount'));assert.deepEqual(state(6.4).nodes.map(n=>n.id),['throw-middle-tether','axle-end']);
 for(let side=0;side<2;side++){const hand=handPose(4.8,side,w,h);assert(Math.abs(hand.angle)<Math.PI/3,'Hand inverted');const cuff=handPoint(data.hands[side][5].commands[side?8:2].slice(-2),hand);assert(cuff[1]>h||cuff[0]<0||cuff[0]>w,'Extended cuff closure visible inside viewport');}
 assert(f.d/w>.4,'Hands too close together');assert.equal(pose(0).home,0);assert.equal(pose(0).colour,0);assert.equal(pose(CONFIG.duration).home,1);assert.equal(pose(CONFIG.duration).colour,1);
 checks.push({viewport:[w,h],max120HzStepPx:maxStep,maximumTopologyJump});
}
console.log(JSON.stringify({sourcePaths:data.hands.flat().length,restError,minimumJacobian,checks},null,2));


