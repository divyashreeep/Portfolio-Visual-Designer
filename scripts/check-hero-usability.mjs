import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HeroPhysics,heroLayout} from '../src/hero/HeroPhysics.js';

function originalLength(axle,a){let last,length=0;for(let i=0;i<=360;i++){const u=i/360,q=1-u,p=[q*q*q*(-.38*a)+3*q*q*u*(-.20*a)+3*q*u*u*(axle[0]-.19*a)+u*u*u*axle[0],q*q*q*(-.51)+3*q*q*u*(-.49)+3*q*u*u*(axle[1]-.27)+u*u*u*axle[1]];if(last)length+=Math.hypot(p[0]-last[0],p[1]-last[1]);last=p}return length}
const results=[];
for(const[w,h]of[[1440,900],[1105,840],[390,844],[320,568],[768,1024]]){
 const layout=heroLayout(w,h),axle=[layout.x,layout.y],s=new HeroPhysics(layout,axle),ratio=s.baseLength/originalLength(axle,layout.aspect);
 assert(ratio>1.4&&ratio<1.6,'Resting cord length outside requested range');
 assert(Math.abs(s.p[0])<layout.aspect/2-.02&&Math.abs(s.p[1])<.45,'Free tip must be on screen');
 let peakStretch=0,peakPayout=0;
 for(let interaction=0;interaction<24;interaction++){
  const index=interaction%2?0:Math.round(s.n*.4),start=[s.p[index*2],s.p[index*2+1]],before=s.p.slice(),velocity=s.old.slice();
  s.grab(index,...start,interaction%3?'mouse':'touch');
  assert.deepEqual(s.p,before,'Re-grab changes current pose');assert.deepEqual(s.old,velocity,'Re-grab discards momentum');assert.equal(s.drag.index,index);
  for(let step=0;step<45;step++){const u=step/44,dx=(interaction%2?-.35:.35)*Math.min(1,layout.aspect),dy=.25*Math.sin(u*Math.PI);s.move(start[0]+dx*u,start[1]+dy);s.frame(1/60);assert(s.p.every(Number.isFinite));peakStretch=Math.max(peakStretch,s.maxStretch);peakPayout=Math.max(peakPayout,s.length-s.baseLength);}
  s.release(interaction%7===0);for(let step=0;step<12;step++)s.frame(1/60);
 }
 assert(peakStretch<.10,'Cord stretch exceeds stress tolerance');
 for(let step=0;step<1000&&s.mode!=='rest';step++)s.frame(1/60);assert.equal(s.mode,'rest');assert.deepEqual(s.p,s.rest.points);
 results.push({viewport:[w,h],lengthRatio:ratio,interactions:24,peakStretch,peakPayout,settled:s.mode});
}
const l=heroLayout(1440,900),demo=new HeroPhysics(l,[l.x,l.y]);demo.grab(0,demo.p[0],demo.p[1],'demo');for(let i=0;i<45;i++){demo.move(demo.rest.points[0]-.035*i/44,demo.rest.points[1]+.035*i/44);demo.frame(1/60)}assert.equal(demo.yawTarget,0);assert.equal(demo.length,demo.baseLength);demo.release();demo.grab(0,demo.p[0],demo.p[1],'mouse');assert.equal(demo.demo,false,'User grab must interrupt the demo limits');
fs.mkdirSync('qa/hero/usability',{recursive:true});fs.writeFileSync('qa/hero/usability/solver-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
