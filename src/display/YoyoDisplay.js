import {DataTexture,RGBAFormat,VideoTexture,SRGBColorSpace,Vector2,Vector3,Matrix4} from 'three';
import {DISPLAY_CONFIG} from './displayConfig.js';
import {FaceExpression,videoUvScale} from './FaceExpression.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};

// Only original front transforms and a front-only material clone are owned here.
// The rear meshes, shared embedded textures, glass and source GLB are untouched.
export class YoyoDisplay{
 constructor(model,invalidate,config=DISPLAY_CONFIG){
  this.config=config;this.invalidate=invalidate;this.face=model.getObjectByName('RY8_Front_Face_Glass');
  this.eyes=['Left','Right'].map(side=>{const mesh=model.getObjectByName('RY8_Front_Eye_'+side);return{mesh,position:mesh.position.clone(),scale:mesh.scale.clone()}});
  this.expression=new FaceExpression(config);this.expressionEvents=[];this.debugging=new URLSearchParams(location.search).has('heroDebug');this.source=config.videoSource;this.fit=config.fit;this.loop=config.loop;
  this.wantedMode='eyes';this.mix=0;this.ready=false;this.playRequested=false;this.autoplayBlocked=false;this.status='eyes';this.error=null;this.disposed=false;
  this.pointer={x:0,y:0,active:false,age:Infinity};this.project=new Vector3();this.world=new Vector3();this.normal=new Vector3();this.local=new Vector3();this.look=[0,0];
  this.fallback=new DataTexture(new Uint8Array([255,255,255,255]),1,1,RGBAFormat);this.fallback.needsUpdate=true;
  this.uniforms={yoyoVideo:{value:this.fallback},yoyoVideoMix:{value:0},yoyoVideoScale:{value:new Vector2(1,1)}};
  this.originalMaterial=this.face.material;this.material=this.originalMaterial.clone();this.face.material=this.material;
  this.material.customProgramCacheKey=()=> 'yoyo-front-display-video-v1';
  this.material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,this.uniforms);
   shader.vertexShader='varying vec2 vYoyoDisplayUv;\n'+shader.vertexShader;
   // The source front is viewed from local -Z; its exported UV has inverted Y.
   // This basis makes a labelled video upright and unmirrored from that side.
   shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvYoyoDisplayUv=vec2(1.0-uv.x,1.0-uv.y);');
   shader.fragmentShader='uniform sampler2D yoyoVideo;\nuniform float yoyoVideoMix;\nuniform vec2 yoyoVideoScale;\nvarying vec2 vYoyoDisplayUv;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    if(yoyoVideoMix>0.0001){
     vec2 videoUv=(vYoyoDisplayUv-0.5)*yoyoVideoScale+0.5;
     float inside=step(0.0,videoUv.x)*step(videoUv.x,1.0)*step(0.0,videoUv.y)*step(videoUv.y,1.0);
     vec3 videoColor=sRGBTransferEOTF(texture2D(yoyoVideo,clamp(videoUv,0.0,1.0))).rgb;
     outgoingLight=mix(outgoingLight,videoColor,yoyoVideoMix*inside);
    }
    #include <opaque_fragment>`);
  };
  // The source artwork is conformed to a curved pearl substrate. Simply
  // scaling Y leaves its baked Z curvature behind and clips closing eyelids.
  // Preserve every original vertex/texture and adjust only its curvature delta
  // after the original eye hierarchy bends/moves it in the display plane.
  const positions=this.face.geometry.attributes.position;let numerator=0,denominator=0,radius=0;
  for(let i=0;i<positions.count;i++)radius=Math.max(radius,Math.hypot(positions.getX(i),positions.getY(i)));
  for(let i=0;i<positions.count;i++){const r2=positions.getX(i)**2+positions.getY(i)**2;if(r2<radius*radius*.85){numerator+=r2*positions.getZ(i);denominator+=r2*r2;}}
  this.curvature=denominator?numerator/denominator:0;this.faceInverse=new Matrix4();this.eyeSurfaces=[];this.updateFaceInverse();
  for(const eye of this.eyes)eye.mesh.traverse(mesh=>{if(!mesh.isMesh)return;mesh.updateWorldMatrix(true,false);const original=mesh.material,material=original.clone(),rest=new Matrix4().multiplyMatrices(this.faceInverse,mesh.matrixWorld),live=rest.clone();mesh.material=material;
   material.customProgramCacheKey=()=> 'yoyo-original-eye-curvature-v1';
   material.onBeforeCompile=shader=>{shader.uniforms.eyeRest={value:rest};shader.uniforms.eyeLive={value:live};shader.uniforms.eyeCurvature={value:this.curvature};shader.vertexShader='uniform mat4 eyeRest;\nuniform mat4 eyeLive;\nuniform float eyeCurvature;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec2 restXY=(eyeRest*vec4(position,1.0)).xy;
    vec2 liveXY=(eyeLive*vec4(position,1.0)).xy;
    transformed.z+=eyeCurvature*(dot(liveXY,liveXY)-dot(restXY,restXY));`);};
   this.eyeSurfaces.push({mesh,original,material,rest,live});
  });
  this.onPointer=e=>{this.pointer.x=e.clientX;this.pointer.y=e.clientY;this.pointer.active=e.pointerType!=='touch';this.pointer.age=0;this.invalidate()};
  this.onLeave=()=>{this.pointer.active=false;this.invalidate()};
  this.onVisibility=()=>{if(document.hidden)this.video?.pause();this.invalidate()};
  window.addEventListener('pointermove',this.onPointer,{passive:true});window.addEventListener('blur',this.onLeave);document.addEventListener('pointerleave',this.onLeave);document.addEventListener('visibilitychange',this.onVisibility);
  this.api={setDisplayMode:mode=>this.setDisplayMode(mode),setVideoSource:source=>this.setVideoSource(source),playVideo:()=>this.playVideo(),pauseVideo:()=>this.pauseVideo(),restartVideo:()=>this.restartVideo(),setVideoLoop:loop=>this.setVideoLoop(loop),setVideoFit:fit=>this.setVideoFit(fit),returnToEyes:()=>this.returnToEyes(),blink:()=>{this.expression.blink();this.invalidate()},getState:()=>this.getState()};
 }
 getState(){return{mode:this.mix>.01?'video':'eyes',requestedMode:this.wantedMode,status:this.status,source:this.source,ready:this.ready,playing:!!this.video&&!this.video.paused,fit:this.fit,loop:this.loop,error:this.error,mix:this.mix,blinkCount:this.expression.blinks,openness:this.expression.open,gaze:[...this.expression.gaze],attention:this.expression.reason,currentTime:this.video?.currentTime??0};}
 setVideoSource(source){
  if(source){try{const url=new URL(source,location.href);if(!['http:','https:','blob:'].includes(url.protocol))return false;}catch{this.error='Invalid video URL';return false;}}
  this.source=source||null;this.wantedMode='eyes';this.playRequested=false;this.autoplayBlocked=false;this.error=null;this.video?.pause();
  if(this.mix<=.001)this.releaseMedia();this.invalidate();return true;
 }
 setDisplayMode(mode){
  if(!['eyes','video'].includes(mode))return false;
  if(mode==='eyes'){this.returnToEyes();return true}
  if(!this.source)return false;
  this.error=null;this.wantedMode='video';this.ensureVideo();if(this.ready&&this.loadedSource===this.source)this.status=this.video.paused?'paused':'playing';this.invalidate();return true;
 }
 setVideoFit(fit){if(!['cover','contain'].includes(fit))return false;this.fit=fit;this.updateFit();this.invalidate();return true;}
 setVideoLoop(loop){this.loop=!!loop;if(this.video)this.video.loop=this.loop;return this.loop;}
 async playVideo(){
  if(!this.setDisplayMode('video'))return false;this.playRequested=true;this.autoplayBlocked=false;const video=this.video;
  if(!video||this.loadedSource!==this.source)return false;
  try{this.playPending=true;await video.play();if(this.video!==video||this.disposed)return false;this.status='playing';this.invalidate();return true;}
  catch(error){if(this.video!==video||this.disposed)return false;this.autoplayBlocked=error.name==='NotAllowedError';this.status=this.autoplayBlocked?'playback-blocked':'video-unavailable';this.error=error.name;if(error.name!=='NotAllowedError'){this.wantedMode='eyes';this.playRequested=false;video.pause();this.invalidate();}return false;}
  finally{if(this.video===video)this.playPending=false;}
 }
 pauseVideo(){this.playRequested=false;this.video?.pause();if(this.ready)this.status='paused';this.invalidate();}
 restartVideo(){if(!this.video){return this.playVideo()}this.video.currentTime=0;return this.playVideo();}
 returnToEyes(){this.wantedMode='eyes';this.playRequested=false;this.video?.pause();this.status='eyes';this.invalidate();}
 updateFit(){if(!this.video)return;this.uniforms.yoyoVideoScale.value.fromArray(videoUvScale(this.video.videoWidth,this.video.videoHeight,this.fit));}
 ensureVideo(){
  if(!this.source||this.disposed)return;
  if(this.video&&this.loadedSource===this.source)return;
  if(this.mix>.001)return; // Finish fading the valid old frame before replacing it.
  this.releaseMedia();this.loadedSource=this.source;
  const video=document.createElement('video');this.video=video;this.ready=false;this.status='loading';
  video.muted=this.config.muted;video.defaultMuted=this.config.muted;video.playsInline=true;video.loop=this.loop;video.crossOrigin='anonymous';video.preload='auto';
  const loaded=()=>{if(this.video!==video||this.disposed)return;if(!this.texture){this.texture=new VideoTexture(video);this.texture.colorSpace=SRGBColorSpace;this.texture.flipY=true;this.uniforms.yoyoVideo.value=this.texture;}this.ready=true;this.status=video.paused?'ready':'playing';this.updateFit();this.invalidate();};
  const failed=()=>{if(this.video!==video||this.disposed)return;this.error='Video could not be loaded; animated eyes remain available.';this.ready=false;this.wantedMode='eyes';this.playRequested=false;this.status='video-unavailable';this.invalidate();};
  const ended=()=>{this.playRequested=false;this.status='ended';this.invalidate()};
  video.addEventListener('loadeddata',loaded);video.addEventListener('error',failed);video.addEventListener('ended',ended);
  this.removeVideoListeners=()=>{video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',failed);video.removeEventListener('ended',ended)};
  video.src=this.source;video.load();
 }
 releaseMedia(){
  this.removeVideoListeners?.();this.removeVideoListeners=null;
  this.video?.pause();if(this.video){this.video.removeAttribute('src');this.video.load()}
  this.texture?.dispose();this.texture=null;this.video=null;this.loadedSource=null;this.ready=false;this.playPending=false;this.uniforms.yoyoVideo.value=this.fallback;
 }
 neutral(){for(const eye of this.eyes){eye.mesh.position.copy(eye.position);eye.mesh.scale.copy(eye.scale);eye.mesh.visible=true;}for(const surface of this.eyeSurfaces||[])surface.live.copy(surface.rest);}
 updateFaceInverse(){this.face.updateWorldMatrix(true,false);this.faceInverse.copy(this.face.matrixWorld).invert();}
 frame({delta,camera,size,hero,active}){
  if(this.disposed)return;
  if(!active){this.neutral();this.uniforms.yoyoVideoMix.value=0;this.video?.pause();return;}
  const dt=Math.min(delta,.05),sim=hero?.sim,reduced=!!sim?.reduced;this.pointer.age+=dt;
  this.face.updateWorldMatrix(true,false);this.world.set(0,0,0);this.face.localToWorld(this.world);this.project.copy(this.world).project(camera);
  const cx=(this.project.x*.5+.5)*size.width,cy=(.5-this.project.y*.5)*size.height;
  this.normal.set(0,0,-1).transformDirection(this.face.matrixWorld);this.local.copy(camera.position).sub(this.world).normalize();
  const frontVisible=this.normal.dot(this.local)>.08&&Math.abs(this.project.x)<1.3&&Math.abs(this.project.y)<1.3&&this.project.z>-1&&this.project.z<1;
  let point=null,reason='idle',speed=sim?.mode==='rest'?0:sim?.speed()||0;
  if(sim?.drag){point=[(sim.drag.pin[0]+sim.layout.aspect/2)*size.height,(.5-sim.drag.pin[1])*size.height];reason='play';}
  else if(hero?.hover||hero?.endpointHover){point=[hero.projected[0],hero.projected[1]];reason='thread';}
  else if(this.pointer.active&&this.pointer.age<3&&Math.hypot(this.pointer.x-cx,this.pointer.y-cy)<size.height*(sim?.layout.diameter||.6)*.75){point=[this.pointer.x,this.pointer.y];reason='cursor';}
  else if(sim&&sim.mode!=='rest'){point=[cx+(sim.p[sim.n*2]-sim.old[sim.n*2])*6000,cy-(sim.p[sim.n*2+1]-sim.old[sim.n*2+1])*6000];reason='recovery';}
  if(point){this.local.set(point[0]/size.width*2-1,1-point[1]/size.height*2,this.project.z).unproject(camera);this.face.worldToLocal(this.local);this.look[0]=clamp(this.local.x/.025,-1,1);this.look[1]=clamp(this.local.y/.025,-1,1);}
  const expression=this.expression.step(dt,{look:point?this.look:null,reason,speed,reduced});
  if(this.wantedMode==='video')this.ensureVideo();else if(this.loadedSource&&this.loadedSource!==this.source&&this.mix<=.001)this.releaseMedia();
  const showVideo=this.wantedMode==='video'&&this.ready&&this.loadedSource===this.source;
  const target=showVideo?1:0,step=dt/(reduced?.08:this.config.transitionSeconds);this.mix+=clamp(target-this.mix,-step,step);this.mix=clamp(this.mix,0,1);this.uniforms.yoyoVideoMix.value=smooth(this.mix);
  const open=Math.max(.01,expression.open*(1-smooth(this.mix/.60)));
  for(const eye of this.eyes){eye.mesh.position.copy(eye.position);eye.mesh.position.x+=expression.gaze[0]*this.config.gazeLimit;eye.mesh.position.y+=expression.gaze[1]*this.config.gazeLimit;eye.mesh.scale.copy(eye.scale);eye.mesh.scale.y*=open;eye.mesh.visible=this.mix<.995;}
  this.updateFaceInverse();for(const surface of this.eyeSurfaces){surface.mesh.updateWorldMatrix(true,false);surface.live.multiplyMatrices(this.faceInverse,surface.mesh.matrixWorld);}
  if(this.video){
   const shouldPlay=this.playRequested&&this.wantedMode==='video'&&this.loadedSource===this.source&&frontVisible&&!document.hidden;
   if(!shouldPlay&&!this.video.paused){this.video.pause();if(this.playRequested)this.status='suspended';}
   else if(shouldPlay&&this.video.paused&&!this.playPending&&!this.autoplayBlocked)this.playVideo();
  }
  if(hero?.surface){const e=hero.surface;e.dataset.displayMode=this.mix>.99?'video':this.mix>.01?'transition':'eyes';e.dataset.eyeOpen=open.toFixed(3);e.dataset.eyeGaze=expression.gaze.map(v=>v.toFixed(3)).join(',');e.dataset.eyeAttention=reason;e.dataset.blinks=String(expression.blinks);e.dataset.videoStatus=this.status;e.dataset.videoReady=String(this.ready);e.dataset.videoTime=(this.video?.currentTime||0).toFixed(2);if(this.debugging&&this.expressionEvents.at(-1)?.attention!==reason){this.expressionEvents.push({attention:reason,time:expression.time,open,gaze:[...expression.gaze]});if(this.expressionEvents.length>24)this.expressionEvents.shift();e.dataset.expressionStates=JSON.stringify(this.expressionEvents);}}
  if(!reduced||Math.abs(this.mix-target)>.001||(this.video&&!this.video.paused))this.invalidate();
 }
 dispose(){
  this.disposed=true;window.removeEventListener('pointermove',this.onPointer);window.removeEventListener('blur',this.onLeave);document.removeEventListener('pointerleave',this.onLeave);document.removeEventListener('visibilitychange',this.onVisibility);
  this.releaseMedia();this.neutral();for(const surface of this.eyeSurfaces){surface.mesh.material=surface.original;surface.material.dispose()}this.face.material=this.originalMaterial;this.material.dispose();this.fallback.dispose();
 }
}
