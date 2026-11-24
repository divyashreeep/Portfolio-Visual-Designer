// Toy units: one visible viewport height; seconds. Original GLB axle radius 3.9 mm.
export const TOY={segments:28,step:1/120,maxSteps:10,iterations:48,gravity:1.35,
 damping:1.1,maxSpeed:2.4,maxPointerSpeed:4.8,axleRadiusRatio:.0039/.06,
 unwindRate:.09,rewindRate:.12,maxPayout:1.22,recoverDelay:.45,recoverSpring:15,recoverDamping:7.5};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export function heroLayout(w,h){const aspect=w/h,mobile=w<650;return{aspect,mobile,x:(mobile?.53:.55)*aspect-aspect/2,y:.5-(mobile?.51:.55),diameter:Math.min(mobile?.45:.60,aspect*(mobile?.68:.72))};}
export function restingRope(axle,aspect,count=TOY.segments){
 const p0=[-.38*aspect,-.51],p1=[-.20*aspect,-.49],p2=[axle[0]-.19*aspect,axle[1]-.27],dense=[],lengths=[0];let total=0;
 for(let i=0;i<=180;i++){const u=i/180,q=1-u,p=[q*q*q*p0[0]+3*q*q*u*p1[0]+3*q*u*u*p2[0]+u*u*u*axle[0],q*q*q*p0[1]+3*q*q*u*p1[1]+3*q*u*u*p2[1]+u*u*u*axle[1]];if(i){total+=Math.hypot(p[0]-dense[i-1][0],p[1]-dense[i-1][1]);lengths.push(total)}dense.push(p)}
 const result=new Float64Array((count+1)*2);let k=1;for(let i=0;i<=count;i++){const d=total*i/count;while(k<180&&lengths[k]<d)k++;const u=(d-lengths[k-1])/(lengths[k]-lengths[k-1]||1);result[i*2]=dense[k-1][0]+(dense[k][0]-dense[k-1][0])*u;result[i*2+1]=dense[k-1][1]+(dense[k][1]-dense[k-1][1])*u;}return{points:result,length:total};
}
export class HeroPhysics{
 constructor(layout,axle,reduced=false){this.layout=layout;this.reduced=reduced;this.n=TOY.segments;this.rest=restingRope(axle,layout.aspect);this.p=this.rest.points.slice();this.old=this.p.slice();this.length=this.rest.length;this.baseLength=this.length;this.mode='rest';this.accumulator=0;this.time=0;this.releaseAge=0;this.drag=null;this.spin=0;this.yaw=0;this.yawVelocity=0;this.yawTarget=0;this.tilt=0;this.tiltVelocity=0;this.tension=0;this.maxStretch=0;this.events=[];}
 log(type,detail={}){this.events.push({type,time:this.time,...detail});if(this.events.length>200)this.events.shift();}
 grab(index,x,y,source='pointer'){index=clamp(Math.round(index),2,this.n-3);this.drag={index,target:[x,y],pin:[this.p[index*2],this.p[index*2+1]],start:[x,y],previous:[x,y],distance:0,area:0,turn:0,direction:[0,0],velocity:[0,0],source};this.mode='grab';this.log('grab',{index,source});}
 move(x,y){if(!this.drag)return;const d=this.drag;const dx=x-d.previous[0],dy=y-d.previous[1];d.distance+=Math.hypot(dx,dy);if(Math.hypot(dx,dy)>.00001){if(Math.hypot(...d.direction)>.00001)d.turn+=Math.atan2(d.direction[0]*dy-d.direction[1]*dx,d.direction[0]*dx+d.direction[1]*dy);d.direction[0]=dx;d.direction[1]=dy;}d.area+=(d.previous[0]-this.p[this.n*2])*(y-this.p[this.n*2+1])-(d.previous[1]-this.p[this.n*2+1])*(x-this.p[this.n*2]);d.previous[0]=x;d.previous[1]=y;d.target[0]=clamp(x,-this.layout.aspect*.55,this.layout.aspect*.55);d.target[1]=clamp(y,-.60,.60);this.mode='play';}
 release(cancel=false){if(!this.drag)return;const d=this.drag,i=this.n*2,vx=d.velocity[0],vy=d.velocity[1];if(!cancel){this.old[i]-=clamp(vx,-2,2)*TOY.step*.35;this.old[i+1]-=clamp(vy,-2,2)*TOY.step*.35;}this.log(cancel?'cancel':'release',{speed:this.speed(),payout:this.length-this.baseLength});this.drag=null;this.mode='release';this.releaseAge=0;}
 recover(){this.drag=null;this.mode='return';this.releaseAge=1.2;this.yawTarget=0;this.log('recover');}
 speed(){const i=this.n*2;return Math.hypot(this.p[i]-this.old[i],this.p[i+1]-this.old[i+1])/TOY.step;}
 resize(layout,axle){const ratio=layout.aspect/this.layout.aspect;for(let i=0;i<=this.n;i++){this.p[i*2]*=ratio;this.old[i*2]*=ratio;}this.layout=layout;this.rest=restingRope(axle,layout.aspect);this.baseLength=this.rest.length;this.length=clamp(this.length,this.baseLength*.85,this.baseLength*TOY.maxPayout);if(this.mode==='rest'){this.p.set(this.rest.points);this.old.set(this.p)}else this.recover();}
 frame(delta){if(this.mode==='rest')return false;this.accumulator+=Math.min(delta,.075);let count=0;while(this.accumulator>=TOY.step&&count++<TOY.maxSteps){this.step(TOY.step);this.accumulator-=TOY.step;if(this.mode==='rest'){this.accumulator=0;break;}}if(count>=TOY.maxSteps)this.accumulator=0;return this.mode!=='rest';}
 step(dt){
  this.time+=dt;const n=this.n,p=this.p,old=this.old,drag=this.drag,last=n*2;
  if(!drag)this.releaseAge+=dt;
  const recovery=drag?0:smooth((this.releaseAge-TOY.recoverDelay)/(this.reduced?.15:.9));
  if(!drag&&recovery>.05)this.mode='return';
  const lastLength=this.length;
  if(drag){
   const dx=drag.target[0]-drag.pin[0],dy=drag.target[1]-drag.pin[1],distance=Math.hypot(dx,dy),cap=(this.reduced?.55:TOY.maxPointerSpeed)*dt,factor=distance>cap?cap/distance:1;
   drag.pin[0]+=dx*factor;drag.pin[1]+=dy*factor;drag.velocity[0]=drag.velocity[0]*.65+dx*factor/dt*.35;drag.velocity[1]=drag.velocity[1]*.65+dy*factor/dt*.35;
   if(this.reduced){drag.pin[0]=clamp(drag.pin[0],drag.start[0]-.04,drag.start[0]+.04);drag.pin[1]=clamp(drag.pin[1],drag.start[1]-.035,drag.start[1]+.035);}
   const span=(n-drag.index)/n*this.length,gap=Math.hypot(drag.pin[0]-p[last],drag.pin[1]-p[last+1]);
   const pay=gap>span*.9?TOY.unwindRate:gap<span*.82?-TOY.rewindRate:0;
   this.length=this.reduced?this.baseLength:clamp(this.length+pay*dt,this.baseLength*.75,this.baseLength*TOY.maxPayout);
   if(!this.reduced&&this.yawTarget===0&&(Math.abs(drag.target[0]-drag.start[0])>this.layout.aspect*.26||(Math.abs(drag.turn)>Math.PI*.9&&drag.distance>.3))){
    this.yawTarget=Math.sign(drag.target[0]-drag.start[0]||drag.area||1)*Math.PI;this.log('rear-reveal');
   }
  }else{
   this.length+=(this.baseLength-this.length)*(1-Math.exp(-2*dt))*recovery;
   if(this.releaseAge>1.4)this.yawTarget=0;
  }
  this.spin+=(this.length-lastLength)/Math.max(.01,this.layout.diameter*TOY.axleRadiusRatio);
  const retention=Math.exp(-(this.reduced?5:TOY.damping)*dt);
  for(let i=0;i<=n;i++){
   const k=i*2;if(drag&&i===drag.index)continue;
   let vx=(p[k]-old[k])*retention,vy=(p[k+1]-old[k+1])*retention;const speed=Math.hypot(vx,vy),max=(this.reduced?.6:TOY.maxSpeed)*dt;if(speed>max){vx*=max/speed;vy*=max/speed;}
   old[k]=p[k];old[k+1]=p[k+1];
   let ax=0,ay=-TOY.gravity*(1-recovery);
   if(recovery){ax+=(this.rest.points[k]-p[k])*TOY.recoverSpring*recovery-vx/dt*TOY.recoverDamping*recovery;ay+=(this.rest.points[k+1]-p[k+1])*TOY.recoverSpring*recovery-vy/dt*TOY.recoverDamping*recovery;}
   p[k]+=vx+ax*dt*dt;p[k+1]+=vy+ay*dt*dt;
  }
  const segment=this.length/n;this.tension=0;
  for(let iteration=0;iteration<TOY.iterations;iteration++){
   if(drag){const k=drag.index*2;p[k]=drag.pin[0];p[k+1]=drag.pin[1];}
   // Alternate traversal to avoid a directional bias along the cord.
   for(let pass=0;pass<n;pass++){
    const i=iteration%2? n-1-pass:pass,a=i*2,b=a+2,dx=p[b]-p[a],dy=p[b+1]-p[a+1],d=Math.hypot(dx,dy)||1e-9;
    const wa=drag&&i===drag.index?0:i===n?1:4,wb=drag&&i+1===drag.index?0:i+1===n?1:4;
    const correction=(d-segment)/d/(wa+wb||1);
    p[a]+=dx*correction*wa;p[a+1]+=dy*correction*wa;p[b]-=dx*correction*wb;p[b+1]-=dy*correction*wb;
    if(iteration===0)this.tension=Math.max(this.tension,Math.max(0,d/segment-1));
   }
   const r=this.layout.diameter*.62,limitX=Math.max(.01,this.layout.aspect/2-r),limitY=.5-r;
   p[last]=clamp(p[last],this.reduced?this.rest.points[last]-.05:-limitX,this.reduced?this.rest.points[last]+.05:limitX);p[last+1]=clamp(p[last+1],this.reduced?this.rest.points[last+1]-.04:-limitY,this.reduced?this.rest.points[last+1]+.04:limitY);
  }
  if(drag){const k=drag.index*2;p[k]=drag.pin[0];p[k+1]=drag.pin[1];}
  this.maxStretch=0;for(let i=0;i<n;i++)this.maxStretch=Math.max(this.maxStretch,Math.hypot(p[i*2+2]-p[i*2],p[i*2+3]-p[i*2+1])/segment-1);
  const bodyVx=(p[last]-old[last])/dt;
  this.yawVelocity+=((this.yawTarget-this.yaw)*12-this.yawVelocity*6+clamp(bodyVx,-2,2)*1.5)*dt;this.yaw+=this.yawVelocity*dt;
  this.tiltVelocity+=(-bodyVx*.7-this.tilt*16-this.tiltVelocity*7)*dt;this.tilt=clamp(this.tilt+this.tiltVelocity*dt,-.38,.38);
  if(!drag&&recovery>.95){let error=0;for(let i=0;i<p.length;i++)error=Math.max(error,Math.abs(p[i]-this.rest.points[i]));if(error<.004&&this.speed()<.025&&Math.abs(this.yaw)<.02){this.p.set(this.rest.points);this.old.set(this.p);this.length=this.baseLength;this.yaw=0;this.yawVelocity=0;this.tilt=0;this.tiltVelocity=0;this.mode='rest';this.log('rest');}}
 }
}








