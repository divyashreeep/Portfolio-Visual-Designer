import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {bindArtwork,bindPoint,skinPoint,artworkPath} from '../src/FingerRig.js';
import {getFingerMatrices,anchors,CONFIG} from '../src/choreography.js';
import {stringState} from '../src/StringRig.js';
const source=fs.readFileSync('public/assets/hands-source.svg');
const data=JSON.parse(fs.readFileSync('public/assets/engraved-hands-rig.json','utf8'));
assert.equal(data.sourceSha256,crypto.createHash('sha256').update(source).digest('hex'),'Derivative source mismatch');
const art=bindArtwork(data);let points=0,maxRestError=0,minJacobian=Infinity;
for(let side=0;side<2;side++)for(const path of art[side]){
  const matrices=getFingerMatrices(1.1,side);
  for(const c of path.commands)for(const p of c.points){const q=skinPoint(p,matrices);maxRestError=Math.max(maxRestError,Math.hypot(q[0]-p.x,q[1]-p.y));points++;}
  assert(!/NaN|Infinity/.test(artworkPath(path,matrices)));
}
assert(maxRestError<1e-9,'Rest artwork must exactly preserve original coordinates');
for(const t of [0,1.1,1.85,2.55,3.35,3.85,4.5,5.2])for(let side=0;side<2;side++){
 const m=getFingerMatrices(t,side);
 for(let x=-90;x<100;x+=6)for(let y=-110;y<180;y+=6){
  const p=skinPoint(bindPoint(x,y),m),px=skinPoint(bindPoint(x+.1,y),m),py=skinPoint(bindPoint(x,y+.1),m);
  const det=((px[0]-p[0])*(py[1]-p[1])-(px[1]-p[1])*(py[0]-p[0]))/.01;
  minJacobian=Math.min(minJacobian,det);assert(det>.4,'Folded or inverted engraved surface');
 }
}
for(const t of [1.2,1.85,2.55,3.35,3.85,4.25]){
 const a=anchors(t,1440,900),s=stringState(t,1440,900,{axle:[720,510]});
 for(const [index,contact] of [[0,a[0][2]],[1,a[1][2]],[2,a[1][0]],[3,a[0][1]],[5,a[1][1]]])assert.deepEqual(s.points[index],contact,'Active knot must be an actual skinned fingertip');
}
console.log(JSON.stringify({sourcePaths:art.flat().length,boundControlPoints:points,maxRestError,minJacobian,duration:CONFIG.duration,contactPosesChecked:6},null,2));
