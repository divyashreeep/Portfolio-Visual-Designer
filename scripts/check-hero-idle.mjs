import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HeroPhysics,heroLayout,IDLE} from '../src/hero/HeroPhysics.js';

const results=[];
for(const[w,h]of[[1440,900],[390,844]]){
 const l=heroLayout(w,h),s=new HeroPhysics(l,[l.x,l.y]),last=s.n*2;
 let maxOffset=0;
 for(let cycle=0;cycle<10;cycle++){
  const first=s.p.slice();for(let i=0;i<240;i++)s.frame(1/60);
  assert.notDeepEqual(s.p,first,'Idle must keep moving');assert.equal(s.mode,'rest');
  const pose=s.p.slice(),velocity=s.old.slice(),yaw=s.yaw;
  s.grab(0,s.p[0],s.p[1],'test');assert.deepEqual(s.p,pose);assert.deepEqual(s.old,velocity);assert.equal(s.yaw,yaw);
  const start=[s.p[0],s.p[1]];for(let i=0;i<20;i++){s.move(start[0]+.08*i/20,start[1]+.07*i/20);s.frame(1/60)}s.release();
  if(cycle%3===0){for(let i=0;i<6;i++)s.frame(1/60);const p=s.p.slice();s.grab(0,s.p[0],s.p[1],'test');assert.deepEqual(s.p,p);s.move(s.p[0]-.03,s.p[1]+.02);s.frame(1/60);s.release();}
  for(let i=0;i<900&&s.mode!=='rest';i++)s.frame(1/60);assert.equal(s.mode,'rest');assert.equal(s.idleAge,0);
 }
 const samples=[];for(let i=0;i<60*32;i++){s.frame(1/60);maxOffset=Math.max(maxOffset,Math.hypot(s.p[last]-l.x,s.p[last+1]-l.y));if(i%60===0)samples.push({time:s.idleTime,body:[s.p[last],s.p[last+1]],tip:[s.p[0],s.p[1]],yaw:s.yaw});}
 assert(maxOffset<.006,'Idle drifts from the approved composition');assert(Math.abs(s.yaw)<=IDLE.yaw+1e-9);assert(s.p.every(Number.isFinite));assert.equal(s.length,s.baseLength);
 assert.notDeepEqual(samples[29].body,samples[30].body,'Idle stopped after 30 seconds');
 s.reduced=true;assert.equal(s.frame(1/60),false);const stable=s.p.slice();for(let i=0;i<120;i++)s.frame(1/60);assert.deepEqual(s.p,stable);assert.equal(s.yaw,0);
 results.push({viewport:[w,h],cycles:10,rapidRegrabs:4,heldSeconds:32,maxOffset,samples,reducedStable:true});
}
fs.mkdirSync('qa/hero/idle',{recursive:true});fs.writeFileSync('qa/hero/idle/solver-checks.json',JSON.stringify(results,null,2));console.log('Idle lifecycle checks passed: desktop/mobile, ten cycles, rapid re-grabs, 32-second holds and reduced motion.');
