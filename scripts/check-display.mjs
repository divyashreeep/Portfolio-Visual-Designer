import assert from 'node:assert/strict';
import fs from 'node:fs';import crypto from 'node:crypto';
import {Group,Mesh,PlaneGeometry,MeshPhysicalMaterial,PerspectiveCamera,Texture} from 'three';
import {FaceExpression,videoUvScale} from '../src/display/FaceExpression.js';
import {DISPLAY_CONFIG} from '../src/display/displayConfig.js';
import {YoyoDisplay} from '../src/display/YoyoDisplay.js';

const expression=new FaceExpression(DISPLAY_CONFIG);let minimum=1;const intervals=[];let lastBlink=0,lastCount=0;
for(let i=0;i<60*90;i++){expression.step(1/60);minimum=Math.min(minimum,expression.open);if(expression.blinks!==lastCount){intervals.push(expression.time-lastBlink);lastBlink=expression.time;lastCount=expression.blinks;}assert(expression.gaze.every(v=>Math.abs(v)<=1));}
assert(minimum<.05);assert(expression.blinks>12&&expression.blinks<40);assert(new Set(intervals.map(v=>v.toFixed(1))).size>4,'Blink intervals must vary');assert(intervals.some(v=>v<.5),'Occasional double blink missing');
for(let i=0;i<120;i++)expression.step(1/60,{look:[100,-100],reason:'play',speed:3});assert(expression.gaze[0]<=1&&expression.gaze[1]>=-1);assert(expression.open<=1);
for(let i=0;i<120;i++)expression.step(1/60,{reduced:true});assert.equal(expression.open,1);
assert.deepEqual(videoUvScale(640,360,'cover'),[.5625,1]);assert.deepEqual(videoUvScale(640,360,'contain'),[1,640/360]);assert.deepEqual(videoUvScale(360,640,'contain'),[640/360,1]);

let created=0;class FakeVideo extends EventTarget{constructor(){super();created++;this.paused=true;this.currentTime=0;this.videoWidth=640;this.videoHeight=360;}load(){}pause(){this.paused=true}async play(){if(this.rejectPlay)throw Object.assign(new Error('blocked'),{name:'NotAllowedError'});this.paused=false}removeAttribute(name){delete this[name]}}
globalThis.window=new EventTarget();globalThis.document=Object.assign(new EventTarget(),{hidden:false,createElement:()=>new FakeVideo()});globalThis.location={href:'http://localhost/'};
const model=new Group();model.rotation.y=Math.PI;
const pearl=new MeshPhysicalMaterial({roughness:.085,iridescence:.18,clearcoat:.32});pearl.map=new Texture();
const face=new Mesh(new PlaneGeometry(.04878,.04878),pearl);face.name='RY8_Front_Face_Glass';face.position.z=-.01758;model.add(face);
const rear=new Mesh(face.geometry,pearl);rear.name='RY8_Rear_Face_Glass';rear.position.z=.01758;model.add(rear);
for(const[side,x]of[['Left',.009],['Right',-.009]]){const eye=new Mesh(new PlaneGeometry(.01,.014),new MeshPhysicalMaterial());eye.name='RY8_Front_Eye_'+side;eye.position.set(x,.00075,-.017567);const white=new Group();white.name='original-white-highlight';eye.add(white);model.add(eye)}
model.updateMatrixWorld(true);const rearSnapshot=rear.matrix.clone();let invalidations=0;const display=new YoyoDisplay(model,()=>invalidations++);
assert.equal(created,0);assert.equal(display.setDisplayMode('video'),false);assert.equal(created,0,'No media request without a source');assert.equal(display.setVideoSource('http://['),false);
assert.notEqual(face.material,pearl);assert.equal(face.material.map,pearl.map);assert.equal(rear.material,pearl);assert.equal(face.material.iridescence,pearl.iridescence);
const camera=new PerspectiveCamera(32,16/9,.1,100);camera.position.z=3;camera.updateMatrixWorld();const hero={sim:{mode:'rest',reduced:false,layout:{diameter:.6}},surface:{dataset:{}},projected:new Float32Array([150,650])};const frame=()=>{model.updateMatrixWorld(true);display.frame({delta:1/60,camera,size:{width:1280,height:720},hero,active:true})};
display.setVideoSource('/videos/future.webm');assert.equal(created,0,'Setting a URL must be lazy');await display.playVideo();const video=display.video;video.dispatchEvent(new Event('loadeddata'));for(let i=0;i<45;i++)frame();assert.equal(display.mix,1);assert(display.eyes.every(e=>!e.mesh.visible));assert.equal(rear.material,pearl);assert(rear.matrix.equals(rearSnapshot));
display.pauseVideo();assert(video.paused);display.returnToEyes();for(let i=0;i<45;i++)frame();assert.equal(display.mix,0);assert(display.eyes.every(e=>e.mesh.visible));assert.equal(rear.material,pearl);
display.setVideoSource('/missing.mp4');display.setDisplayMode('video');display.video.dispatchEvent(new Event('error'));for(let i=0;i<45;i++)frame();assert.equal(display.wantedMode,'eyes');assert(display.eyes.every(e=>e.mesh.visible));
display.setVideoSource('/valid.mp4');display.setDisplayMode('video');display.video.dispatchEvent(new Event('loadeddata'));display.video.rejectPlay=true;assert.equal(await display.playVideo(),false);assert.equal(display.status,'playback-blocked');
display.frame({delta:1/60,camera,size:{width:1280,height:720},hero,active:false});assert(display.eyes.every(e=>e.mesh.visible&&e.mesh.scale.equals(e.scale)));assert(display.eyeSurfaces.every(s=>s.live.equals(s.rest)),'Intro must receive neutral original artwork');
let disposed=false;display.texture.addEventListener('dispose',()=>disposed=true);display.dispose();assert(disposed);assert.equal(face.material,pearl);assert.equal(rear.material,pearl);const calls=invalidations;window.dispatchEvent(new Event('pointermove'));document.dispatchEvent(new Event('visibilitychange'));assert.equal(invalidations,calls,'Listeners leaked after disposal');
const hash=crypto.createHash('sha256').update(fs.readFileSync('public/assets/yoyo.glb')).digest('hex');assert.equal(hash,'4569cd13f2c304340d3fb79322411a87c54f457bd2a0200e9764c5bdd31d62a8');
fs.mkdirSync('qa/display',{recursive:true});fs.writeFileSync('qa/display/checks.json',JSON.stringify({blinks:expression.blinks,minimumOpenness:minimum,intervals,sourceHash:hash,frontOnly:true,noMediaUntilRequested:true,resourceCleanup:true,autoplayRejectionHandled:true,invalidations},null,2));console.log('Display checks passed: original front-only bindings, blink pacing, fitting, lazy media, error/autoplay handling, cleanup and source GLB integrity.');
