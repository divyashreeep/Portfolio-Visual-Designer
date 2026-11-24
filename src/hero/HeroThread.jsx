import {useEffect,useMemo,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {BufferGeometry,BufferAttribute,Vector3,Quaternion,Euler,DynamicDrawUsage} from 'three';
import gsap from 'gsap';
import {HeroPhysics,heroLayout,TOY,restingRope} from './HeroPhysics.js';
import {stringState} from '../StringRig.js';
const SAMPLES=84,SIDES=6,AXLE=new Vector3(.0039,.0003,0),REST_Q=new Quaternion().setFromEuler(new Euler(.03,Math.PI+.62,.03));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createHeroController(){return{active:false,initialized:false,frame:null,sim:null,hit:null,projected:new Float32Array((SAMPLES+1)*2),width:1,height:1,hover:false,used:false,trace:[],cancel:null};}
function resampleScreen(points,w,h,n){const result=new Float64Array((n+1)*2),d=[0];let total=0,k=1;for(let i=1;i<points.length;i++){total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);d.push(total)}for(let i=0;i<=n;i++){const distance=total*i/n;while(k<d.length-1&&d[k]<distance)k++;const u=(distance-d[k-1])/(d[k]-d[k-1]||1);result[i*2]=(points[k-1][0]+(points[k][0]-points[k-1][0])*u-w/2)/h;result[i*2+1]=.5-(points[k-1][1]+(points[k][1]-points[k-1][1])*u)/h;}return result;}
export function HeroThread({controller,score,reduced,active}){
 const mesh=useRef(),reducedRef=useRef(reduced),{invalidate,gl,setDpr}=useThree();reducedRef.current=reduced;
 const debugging=useMemo(()=>new URLSearchParams(location.search).has('heroDebug'),[]);
 const geometry=useMemo(()=>{const g=new BufferGeometry(),vertices=new Float32Array((SAMPLES+1)*SIDES*3),normals=new Float32Array(vertices.length),indices=[];for(let i=0;i<SAMPLES;i++)for(let j=0;j<SIDES;j++){const a=i*SIDES+j,b=i*SIDES+(j+1)%SIDES,c=a+SIDES,d=b+SIDES;indices.push(a,b,c,b,d,c)}g.setAttribute('position',new BufferAttribute(vertices,3).setUsage(DynamicDrawUsage));g.setAttribute('normal',new BufferAttribute(normals,3).setUsage(DynamicDrawUsage));g.setIndex(indices);return g;},[]);
 const runtime=useMemo(()=>({centres:Array.from({length:SAMPLES+1},()=>new Vector3()),smooth:new Float64Array((TOY.segments+1)*2),scratch:new Float64Array((TOY.segments+1)*2),axis:new Vector3(),centre:new Vector3(),anchor:new Vector3(),localAnchor:AXLE.clone(),direction:new Vector3(),normal:new Vector3(),binormal:new Vector3(),tangent:new Vector3(),temp:new Vector3(),project:new Vector3(),inverse:new Quaternion(),q:new Quaternion(),euler:new Euler(),diameter:.55,renderCount:0,frameTimes:[]}),[]);
 useEffect(()=>{const c=controller.current;c.active=active;if(!active){mesh.current.visible=false;c.initialized=false;c.sim=null;c.cancel?.();}invalidate();},[active,controller,invalidate]);
 useEffect(()=>{
  const control=controller.current;control.invalidate=invalidate;
  control.frame=({root,spin,camera,size,viewport,delta})=>{
   if(!control.active){mesh.current.visible=false;return;}
   const w=size.width,h=size.height,layout=heroLayout(w,h),worldH=viewport.height;
   const restOffset=runtime.temp.copy(AXLE).multiplyScalar(layout.diameter/.06).applyQuaternion(REST_Q),restAxle=[layout.x+restOffset.x,layout.y+restOffset.y];
   if(!control.initialized){
    const actual=runtime.anchor.copy(AXLE);root.localToWorld(actual);
    const sim=new HeroPhysics(layout,restAxle,reducedRef.current),legacy=stringState(8,w,h,score.current.projection);
    sim.p.set(resampleScreen(legacy.samples,w,h,sim.n));sim.p[sim.n*2]=actual.x/worldH;sim.p[sim.n*2+1]=actual.y/worldH;sim.old.set(sim.p);sim.mode='return';sim.releaseAge=1.2;
    runtime.arrivalFrom=sim.p.slice();runtime.arrivalLength=0;for(let i=1;i<=sim.n;i++)runtime.arrivalLength+=Math.hypot(sim.p[i*2]-sim.p[i*2-2],sim.p[i*2+1]-sim.p[i*2-1]);
    runtime.arrivalProgress=0;runtime.arrival?.kill();runtime.arrival=gsap.timeline({paused:true}).to(runtime,{arrivalProgress:1,duration:reducedRef.current?.01:.7,ease:'power2.inOut'});
    control.sim=sim;runtime.diameter=root.scale.x*.06/worldH;control.initialized=true;control.width=w;control.height=h;control.trace=[];
   }
   const sim=control.sim;
   if(w!==control.width||h!==control.height){sim.resize(layout,restAxle);control.width=w;control.height=h;}
   sim.reduced=reducedRef.current;const woke=!!control.wake;control.wake=false;const simulationDelta=woke?Math.min(delta,1/60):delta;
   if(control.gesture){
    const g=control.gesture;g.age+=Math.min(delta,.05);const u=Math.min(1,g.age/g.duration),e=u*u*(3-2*u),amplitude=Math.min(.38,layout.aspect*.30);let dx=0,dy=0;
    if(g.kind==='Circle'){const a=u*Math.PI*2;dx=Math.sin(a)*amplitude*.65;dy=(1-Math.cos(a))*amplitude*.55;}
    else if(g.kind==='Up')dy=(g.lift??.68)*e;else if(g.kind==='Down')dy=-amplitude*e;
    else if(g.kind==='Left')dx=-amplitude*e;else if(g.kind==='Right')dx=amplitude*e;
    else{dx=amplitude*e;dy=amplitude*.75*e;}
    sim.move(g.start[0]+dx,g.start[1]+dy);if(u===1){sim.release();control.gesture=null;}
   }
   let running;
   // Authored arrival owns the particle pose briefly; input interrupts it and
   // transfers ownership to physics. GSAP and the solver never write together.
   if(runtime.arrival&&!sim.drag){
    runtime.arrival.time(Math.min(runtime.arrival.duration(),runtime.arrival.time()+Math.min(delta,.05)));
    const u=runtime.arrivalProgress;for(let i=0;i<sim.p.length;i++)sim.p[i]=runtime.arrivalFrom[i]+(sim.rest.points[i]-runtime.arrivalFrom[i])*u;
    sim.old.set(sim.p);sim.length=runtime.arrivalLength+(sim.baseLength-runtime.arrivalLength)*u;running=u<1;
    if(!running){runtime.arrival.kill();runtime.arrival=null;sim.mode='rest';sim.length=sim.baseLength;sim.log('rest');}
   }else{if(runtime.arrival){runtime.arrival.kill();runtime.arrival=null;}running=sim.frame(simulationDelta);}
   runtime.diameter+=(layout.diameter-runtime.diameter)*(1-Math.exp(-5*delta));
   root.scale.setScalar(runtime.diameter*worldH/.06);
   runtime.euler.set(.03+sim.tilt*.22,Math.PI+.62+sim.yaw,.03+sim.tilt);root.quaternion.setFromEuler(runtime.euler);
   // Winding is local-Z spin; yaw/tilt belong to the parent, never the same transform.
   spin.rotation.z=Math.PI*8+sim.spin;
   const last=sim.n*2,penultimate=last-2;
   runtime.direction.set(sim.p[penultimate]-sim.p[last],sim.p[penultimate+1]-sim.p[last+1],0);
   runtime.inverse.copy(root.quaternion).invert();runtime.direction.applyQuaternion(runtime.inverse);runtime.direction.z=0;
   if(runtime.direction.lengthSq()<1e-8)runtime.direction.set(1,0,0);runtime.direction.normalize();
   const liveAnchor=runtime.temp.copy(runtime.direction).multiplyScalar(.0039);
   // The return pose exactly retains the supplied anchor; during play the cord
   // exit rolls around the actual 3.9 mm axle circumference toward its tangent.
   const live=sim.mode==='rest'?0:Math.min(1,sim.drag?1:Math.max(0,1-sim.releaseAge/2));
   runtime.localAnchor.copy(AXLE).lerp(liveAnchor,live);
   runtime.anchor.copy(runtime.localAnchor).multiplyScalar(root.scale.x).applyQuaternion(root.quaternion);
   root.position.set(sim.p[last]*worldH-runtime.anchor.x,sim.p[last+1]*worldH-runtime.anchor.y,-runtime.anchor.z);
   root.updateWorldMatrix(true,true);runtime.anchor.copy(runtime.localAnchor);root.localToWorld(runtime.anchor);
   runtime.centre.set(0,0,0);root.localToWorld(runtime.centre);runtime.axis.set(0,0,1).applyQuaternion(root.quaternion);
   runtime.smooth.set(sim.p);
   for(let pass=0;pass<2;pass++){runtime.scratch.set(runtime.smooth);for(let i=1;i<sim.n;i++)if(i!==sim.drag?.index){for(let axis=0;axis<2;axis++)runtime.smooth[i*2+axis]=runtime.scratch[i*2+axis]*.5+(runtime.scratch[(i-1)*2+axis]+runtime.scratch[(i+1)*2+axis])*.25;}}
   const p=runtime.smooth;
   // Cubic Hermite interpolation of the constrained particles; endpoint included.
   for(let i=0;i<=SAMPLES;i++){
    const u=i/SAMPLES*sim.n,k=Math.min(sim.n-1,Math.floor(u)),t=u-k,a=Math.max(0,k-1),b=k,c=k+1,d=Math.min(sim.n,k+2),t2=t*t,t3=t2*t;
    const x=.5*((2*p[b*2])+(-p[a*2]+p[c*2])*t+(2*p[a*2]-5*p[b*2]+4*p[c*2]-p[d*2])*t2+(-p[a*2]+3*p[b*2]-3*p[c*2]+p[d*2])*t3);
    const y=.5*((2*p[b*2+1])+(-p[a*2+1]+p[c*2+1])*t+(2*p[a*2+1]-5*p[b*2+1]+4*p[c*2+1]-p[d*2+1])*t2+(-p[a*2+1]+3*p[b*2+1]-3*p[c*2+1]+p[d*2+1])*t3);
    const point=runtime.centres[i].set(x*worldH,y*worldH,0);
    // Near the body, route the cord within the axle plane between the shells.
    runtime.direction.copy(point).sub(runtime.centre);const dist=runtime.direction.length(),rim=runtime.diameter*worldH*.60,uPlane=clamp((rim*1.8-dist)/(rim*.8),0,1),blend=uPlane*uPlane*(3-2*uPlane);
    point.addScaledVector(runtime.axis,-runtime.direction.dot(runtime.axis)*blend*blend);
   }
   runtime.centres[SAMPLES].copy(runtime.anchor);
   const positions=geometry.attributes.position.array,normals=geometry.attributes.normal.array,radius=worldH/h*(control.hover?1.05:.9);
   runtime.normal.set(0,0,1);let path='',hitEnded=false;
   runtime.project.copy(runtime.centre).project(camera);const bodyX=(runtime.project.x*.5+.5)*w,bodyY=(.5-runtime.project.y*.5)*h;
   for(let i=0;i<=SAMPLES;i++){
    const point=runtime.centres[i];runtime.tangent.copy(runtime.centres[Math.min(SAMPLES,i+1)]).sub(runtime.centres[Math.max(0,i-1)]).normalize();
    runtime.normal.addScaledVector(runtime.tangent,-runtime.normal.dot(runtime.tangent));if(runtime.normal.lengthSq()<1e-8){runtime.normal.set(0,Math.abs(runtime.tangent.z)>.9?1:0,Math.abs(runtime.tangent.z)>.9?0:1);runtime.normal.addScaledVector(runtime.tangent,-runtime.normal.dot(runtime.tangent));}runtime.normal.normalize();runtime.binormal.crossVectors(runtime.tangent,runtime.normal).normalize();
    for(let j=0;j<SIDES;j++){const angle=j/SIDES*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),k=(i*SIDES+j)*3;runtime.direction.copy(runtime.normal).multiplyScalar(c).addScaledVector(runtime.binormal,s);positions[k]=point.x+runtime.direction.x*radius;positions[k+1]=point.y+runtime.direction.y*radius;positions[k+2]=point.z+runtime.direction.z*radius;normals[k]=runtime.direction.x;normals[k+1]=runtime.direction.y;normals[k+2]=runtime.direction.z;}
    runtime.project.copy(point).project(camera);const sx=(runtime.project.x*.5+.5)*w,sy=(.5-runtime.project.y*.5)*h;control.projected[i*2]=sx;control.projected[i*2+1]=sy;
    if(Math.hypot(sx-bodyX,sy-bodyY)<runtime.diameter*h*.43)hitEnded=true;
    if(i<SAMPLES-4&&!hitEnded)path+=(i?'L':'M')+sx.toFixed(2)+' '+sy.toFixed(2)+' ';
   }
   geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;mesh.current.visible=true;
   control.hit?.setAttribute('d',path);control.hoverPath?.setAttribute('d',path);
   if(control.surface){const e=control.surface;e.dataset.state=control.hover&&sim.mode==='rest'?'hover':sim.mode;e.dataset.face=Math.cos(sim.yaw)<-.5?'rear':'front';e.dataset.spin=sim.spin.toFixed(3);e.dataset.tension=sim.tension.toFixed(3);e.dataset.stretch=sim.maxStretch.toFixed(4);e.dataset.body=[sim.p[last],sim.p[last+1]].map(v=>v.toFixed(4)).join(',');e.dataset.grab=sim.drag?.index??'';e.dataset.model=score.current.modelInstance??'';e.dataset.axle=runtime.anchor.toArray().map(v=>v.toFixed(5)).join(',');e.dataset.ropeEnd=runtime.centres[SAMPLES].toArray().map(v=>v.toFixed(5)).join(',');}
   if(debugging){
    if(runtime.frameTimes.length<300&&running&&!woke)runtime.frameTimes.push(delta*1000);
    if(control.trace.length<900&&running)control.trace.push({time:sim.time,state:sim.mode,body:[sim.p[last],sim.p[last+1]],yaw:sim.yaw,spin:sim.spin,length:sim.length,stretch:sim.maxStretch,speed:sim.speed()});
    if(control.surface){control.surface.dataset.events=JSON.stringify(sim.events);if(runtime.renderCount%6===0||!running)control.surface.dataset.trace=JSON.stringify(control.trace);if(runtime.renderCount%20===0&&runtime.frameTimes.length>20){const values=runtime.frameTimes.slice(15).sort((a,b)=>a-b);control.surface.dataset.performance=JSON.stringify({frames:values.length,median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],mean:values.reduce((a,b)=>a+b,0)/values.length,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,dpr:gl.getPixelRatio()});}}
   }
   if(running){runtime.slowFrames=(delta>.026?(runtime.slowFrames||0)+1:0);if(runtime.slowFrames===30&&gl.getPixelRatio()>1)setDpr(1);}
   runtime.renderCount++;if(running||Math.abs(runtime.diameter-layout.diameter)>.0001)invalidate();
  };
  return()=>{runtime.arrival?.kill();runtime.arrival=null;control.frame=null;control.sim=null;control.initialized=false;control.invalidate=null;};
 },[controller,score,geometry,invalidate,gl,setDpr,runtime,debugging]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh ref={mesh} geometry={geometry} visible={false} frustumCulled={false}><meshBasicMaterial color="#F8F7F3" toneMapped={false}/></mesh>;
}





