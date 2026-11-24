import assert from 'node:assert/strict';
import {pose,anchors,fingerShape,handPose,CONFIG} from '../src/choreography.js';
import {stringState} from '../src/StringRig.js';

for(const [w,h] of [[320,568],[390,844],[768,1024],[1440,900]]){
  let previous=pose(0,w<650,w/h),maxStep=0,maxScaleStep=0;
  const sampleCount=Math.ceil(CONFIG.duration*120);
  for(let frame=0;frame<=sampleCount;frame++){
    const t=frame/120,p=pose(t,w<650,w/h),fixture={axle:[p.x*w+7,p.y*h-3]};
    const s=stringState(t,w,h,fixture);
    assert(Object.values(p).every(Number.isFinite),`Nonfinite pose at ${w} / ${t}`);
    assert(s.samples.flat().every(Number.isFinite),`Nonfinite strand at ${w} / ${t}`);
    assert(Math.hypot(s.samples.at(-1)[0]-fixture.axle[0],s.samples.at(-1)[1]-fixture.axle[1])<1e-8,'String detached from supplied axle projection');
    if(t<=5.7){const finger=anchors(t,w,h)[0][2];assert(Math.hypot(s.samples[0][0]-finger[0],s.samples[0][1]-finger[1])<1e-8,'Throw-hand endpoint detached before exiting');}
    maxStep=Math.max(maxStep,Math.hypot((p.x-previous.x)*w,(p.y-previous.y)*h));
    maxScaleStep=Math.max(maxScaleStep,Math.abs(p.diameter-previous.diameter));
    assert(p.diameter>0&&p.diameter<.65,'Invalid model scale');previous=p;
  }
  assert(maxStep<12,`Trajectory discontinuity: ${maxStep}px at 120 Hz`);
  assert(maxScaleStep<.004,'Model scale jump');
  console.log(`${w}×${h}: connected ${sampleCount+1} samples; max 120 Hz step ${maxStep.toFixed(2)} px, scale step ${maxScaleStep.toFixed(5)}`);
}
assert.equal(pose(0).colour,0,'Entry must use half-white');
assert.equal(pose(CONFIG.duration).colour,1);
assert.equal(pose(3.35).contact,1);assert.equal(pose(3.85).contact,1);
assert(pose(5.5).spin>pose(4.65).spin,'Spin stopped before the swing');
assert(Math.abs(fingerShape(1,2.55,0).bend-fingerShape(1,2.55,1).bend)>.3,'Fingers lack independent gestures');
assert(handPose(5.6,1,1440,900).x>1440,'Release hand should have exited during swing');
assert(handPose(5.2,0,1440,900).x>0,'Throw hand must still be holding during launch');
console.log('Entry colour, independent gestures, mounted hold, overlapping handoff and continued axle spin pass.');
