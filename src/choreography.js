import {CONFIG,frameLayout} from './sceneConfig.js';
import {track,phase,mix} from './motionMath.js';
import {fingerMatrices,fingerContacts} from './FingerRig.js';
import {trickPosition} from './DoubleOrNothing.js';
export {CONFIG,frameLayout};export {track,phase,mix,clamp,smooth} from './motionMath.js';
// Index fingers guide the wraps; thumb and remaining fingers clear the working span.
const GESTURES=[
 [0,[0,0,0,0,0],[.08,.08,.08,.08,.08]],
 [1,[0,0,0,0,0],[0,0,.08,.12,.15]],
 [2.1,[.15,-.12,.02,.08,.10],[.12,.18,.06,.18,.20]],
 [2.4,[.15,-.12,.02,.08,.10],[.12,.18,.06,.18,.20]],
 [3.1,[-.06,.16,.02,.12,.16],[.08,.10,.10,.20,.25]],
 [3.4,[-.06,.16,.02,.12,.16],[.08,.10,.10,.20,.25]],
 [4.65,[.05,-.04,.02,.12,.16],[.08,.12,.08,.18,.20]],
 [5.1,[.05,-.04,.02,.12,.16],[.08,.12,.08,.18,.20]],
 [5.65,[.15,.20,-.05,.10,.14],[0,0,.04,.10,.12]],
 [6.4,[.15,.20,-.05,.10,.14],[0,0,.04,.10,.12]],
 [8,[0,0,0,0,0],[0,0,0,0,0]]];
const INDEX_CURL=[[[0,.08],[1,0],[2.8,.08],[3.15,.55],[3.4,.55],[4.65,.25],[5.8,.25],[6.1,0],[8,0]],[[0,.08],[1,0],[1.95,0],[2.15,.55],[2.4,.55],[3.2,.15],[4.65,.25],[5.1,.25],[5.35,0],[8,0]]];
const poses=(t,side)=>Array.from({length:5},(_,i)=>({angle:track(GESTURES.map(k=>[k[0],k[1][i]*(side?1:-1),0]),t),bend:i===1?track(INDEX_CURL[side].map(k=>[...k,0]),t):track(GESTURES.map(k=>[k[0],k[2][i]*(side?1:.85),0]),t)}));
const REST=[poses(1,0),poses(1,1)];
export const getFingerMatrices=(t,side)=>fingerMatrices(poses(t,side),REST[side],phase(t,0,.8));
export function fingerShape(index,t,side){return{...poses(t,side)[index],tip:fingerContacts(getFingerMatrices(t,side),side)[index]};}
export function handPoint(local,p){const x=local[0]*p.s*p.mirror,y=local[1]*p.s;return[p.x+x*Math.cos(p.angle)-y*Math.sin(p.angle),p.y+x*Math.sin(p.angle)+y*Math.cos(p.angle)];}
export function handPose(t,side,w,h){
 const f=frameLayout(w,h),s=f.mobile?Math.min(w/CONFIG.hands.mobileDesignWidth,h/700)*CONFIG.hands.mobileScale:Math.min(w/1440,h/900)*CONFIG.hands.scale;
 const mirror=side?-1:1,angle=(side?-.35:.35)+track([[0,0],[1,0],[2.2,side?.025:-.025],[3.2,side?-.025:.025],[4.65,0],[5.1,0],[6.5,side?.22:-.22],[8,side?.22:-.22]],t);
 const contact=fingerContacts(getFingerMatrices(t,side),side)[1],v={s,mirror,angle,x:0,y:0},offset=handPoint(contact,v),target=(side?f.right:f.left).slice();
 const enter=1-phase(t,0,1);target[0]+=(side?1:-1)*w*.65*enter;
 if(side===0){target[0]-=w*.65*phase(t,6.15,6.95);target[1]-=h*.18*phase(t,6.15,6.95);}
 else{const out=phase(t,5.8,6.65);target[0]=mix(target[0],w*1.18,out);target[1]=mix(target[1],h*1.32,out);const under=phase(t,6.65,7.65);target[0]=mix(target[0],-.12*w,under);target[1]=mix(target[1],h*1.25,under);}
 return{...v,x:target[0]-offset[0],y:target[1]-offset[1]};
}
export function anchors(t,w,h){return[0,1].map(side=>{const hp=handPose(t,side,w,h);return fingerContacts(getFingerMatrices(t,side),side).map(p=>handPoint(p,hp));});}
export function pose(t,mobile=false,aspect=16/9){
 const h=900,w=h*aspect,f=frameLayout(w,h,mobile),p=trickPosition(t,f);
 const spin=track([[0,0,0],[.7,0,0],[1.2,.08,.20],[4.9,.83,.16],[6.8,1,0],[8,1,0]],t)*Math.PI*8;
 return{x:p.x/w,y:p.y/h,diameter:p.diameter/h,rx:p.rx,ry:p.ry,rz:p.rz,spin,axisBlend:1-phase(t,6.3,7.4),contact:phase(t,4.55,4.65)*(1-phase(t,5.1,5.3)),release:phase(t,5.1,6.3),colour:phase(t,CONFIG.colour.start,CONFIG.colour.end),home:phase(t,7.5,8)};
}


