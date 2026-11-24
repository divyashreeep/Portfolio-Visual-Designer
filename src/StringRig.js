import {mix,phase,pose,anchors,handPose,fingerShape,getFingerMatrices,CONFIG} from './choreography.js';
import {artworkPath} from './FingerRig.js';
import {frameLayout} from './sceneConfig.js';
import {routedString} from './DoubleOrNothing.js';
const lerpPoint=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
const rgb=(a,b,u)=>`rgb(${a.map((v,i)=>Math.round(mix(v,b[i],u))).join(',')})`;
const BLUE=[0,0,204],PAPER=[248,247,243];
export function stringState(t,w,h,projection){
 const p=pose(t,w<650,w/h),tips=anchors(t,w,h),f=frameLayout(w,h);
 const axle=projection?.axle??[p.x*w,p.y*h],route=routedString(t,f,tips,axle);
 return {...route,p,tips,axle,points:route.nodes.map(n=>n.point),contact:p.contact};
}
export function updateRig({svg,hands,string,underlay,crossings,wraps,score,w,h}){
 const t=score.time,state=stringState(t,w,h,score.projection),{p,points,samples}=state;
 for(let side=0;score.handArt&&hands.children.length===2&&side<2;side++){
  const v=handPose(t,side,w,h),hand=hands.children[side];
  hand.setAttribute('transform',`translate(${v.x} ${v.y}) rotate(${v.angle*180/Math.PI}) scale(${v.s*v.mirror} ${v.s})`);
  const matrices=getFingerMatrices(t,side);
  const paths=score.handArt[side].map(path=>artworkPath(path,matrices));
  for(const element of hand.querySelectorAll('[data-rig-index]'))element.setAttribute('d',paths[Number(element.dataset.rigIndex)]);
  hand.dataset.joints=matrices.map(m=>`${m.proximal.toFixed(3)},${m.distal.toFixed(3)}`).join(';');
 }
 // Leave the vector hands mounted; they physically move beyond the clipping viewport.
 const d=samples.map((pt,i)=>`${i?'L':'M'}${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`).join(' ');
 string.setAttribute('d',d);underlay.setAttribute('d',d);
 let count=0;const spans=state.spans;
 for(let i=0;i<spans.length;i++)for(let j=i+2;j<spans.length;j++){
  const [a,b]=spans[i],[c,d]=spans[j],vx=b[0]-a[0],vy=b[1]-a[1],wx=d[0]-c[0],wy=d[1]-c[1],det=vx*wy-vy*wx;
  if(Math.abs(det)<.01)continue;
  const u=((c[0]-a[0])*wy-(c[1]-a[1])*wx)/det,v=((c[0]-a[0])*vy-(c[1]-a[1])*vx)/det;
  if(u>.035&&u<.965&&v>.035&&v<.965&&count<4){
   const x=a[0]+u*vx,y=a[1]+u*vy,len=Math.hypot(wx,wy),dx=wx/len*5,dy=wy/len*5,g=crossings.children[count++];
   for(const el of g.children)el.setAttribute('d',`M${x-dx} ${y-dy}L${x+dx} ${y+dy}`);
  }
 }
 for(let i=0;i<4;i++)crossings.children[i].style.visibility=i<count?'visible':'hidden';
 crossings.style.opacity=String(phase(t,.6,1.1)*(1-phase(t,6,6.35)));
 for(const group of crossings.children){group.children[0].style.stroke=rgb(PAPER,BLUE,p.colour);group.children[1].style.stroke=rgb(BLUE,PAPER,p.colour);}
 if(wraps)for(let i=0;i<wraps.children.length;i++){const arc=state.frontArcs[i],path=wraps.children[i];path.setAttribute('d',arc?arc.points.map((point,k)=>(k?'L':'M')+point.map(v=>v.toFixed(2)).join(' ')).join(' '):'');path.style.stroke=rgb(BLUE,PAPER,p.colour);path.style.opacity=String(phase(t,.6,1.1));path.dataset.contact=arc?.id??'';}
 const stage=svg.parentElement;
 stage.style.backgroundColor=rgb(PAPER,BLUE,p.colour);
 stage.style.setProperty('--hand-paper',rgb(PAPER,BLUE,p.colour));
 string.style.stroke=rgb(BLUE,PAPER,p.colour);underlay.style.stroke=CONFIG.blue;
 underlay.style.opacity=String(Math.sin(Math.PI*p.colour)*.8);string.style.opacity=String(phase(t,.6,1.1));
 stage.style.setProperty('--home',p.home);stage.style.setProperty('--progress',`${Math.min(t/CONFIG.duration,1)*100}%`);
 // DOM-visible diagnostics let browser QA await actual committed R3F frames.
 stage.dataset.time=t.toFixed(3);stage.dataset.phase=t<1?'enter':t<2.2?'first-wrap':t<3.2?'second-wrap':t<4.65?'mount-approach':t<5.1?'mount':t<6.3?'release':t<7.5?'swing':'arrival';
 stage.dataset.axle=state.axle.map(v=>v.toFixed(2)).join(',');
 stage.dataset.stringEnd=samples.at(-1).map(v=>v.toFixed(2)).join(',');
 stage.dataset.modelInstance=score.modelInstance??'';
 stage.dataset.mount=p.contact.toFixed(3);
 stage.dataset.route=state.nodes.map(n=>n.id).join(' > ');stage.dataset.contacts=state.activeContacts.join(',');stage.dataset.stringLength=state.length.toFixed(2);stage.dataset.restLength=state.restLength.toFixed(2);stage.dataset.tension=state.tension.toFixed(3);
 if(score.materialAudit&&!stage.dataset.materialAudit)stage.dataset.materialAudit=JSON.stringify(score.materialAudit);
 if(score.capture&&score.renderMetrics)stage.dataset.renderMetrics=JSON.stringify(score.renderMetrics);
 if(score.capture&&score.frames.length<1200){score.frames.push({t:+t.toFixed(3),phase:stage.dataset.phase,route:state.nodes.map(n=>n.id),activeContacts:state.activeContacts,length:state.length,restLength:state.restLength,tension:state.tension,axle:state.axle.slice(),end:samples.at(-1).map(v=>Math.round(v*100)/100),x:p.x,y:p.y,diameter:p.diameter,spin:p.spin,instance:score.modelInstance,colour:p.colour,home:p.home,contacts:state.nodes.filter(n=>n.kind==='finger').map(n=>({id:n.id,point:n.point,radius:n.radius,approach:n.approach,exit:n.exit,depth:n.contactDepth})),handX:[handPose(t,0,w,h).x,handPose(t,1,w,h).x],bends:[fingerShape(1,t,0).bend,fingerShape(1,t,1).bend],joints:[0,1].map(side=>getFingerMatrices(t,side).map(m=>[m.proximal,m.distal]))});}
 if(score.capture)stage.dataset.trace=JSON.stringify(score.frames);
}





