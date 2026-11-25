import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Lightformer } from '@react-three/drei';
import { Vector3, ACESFilmicToneMapping, NeutralToneMapping, AgXToneMapping, SRGBColorSpace } from 'three';
import { CONFIG, pose } from './choreography.js';
import {YoyoDisplay} from './display/YoyoDisplay.js';
export function YoyoModel({score,onReady,hero}) {
  const {scene}=useGLTF('/assets/yoyo.glb');
  const model=useMemo(()=>{const clone=scene.clone(true);clone.getObjectByName('RY8_String_Assembly').visible=false;
    const mode=new URLSearchParams(location.search).get('material');
    // Diagnostic isolation only. Production retains the original exported materials.
    if(mode==='substrate')clone.traverse(node=>{if(node.isMesh&&node.material.name==='M_RY8_Optical_Cover_Glass')node.visible=false;});
    return clone;},[scene]);
  const root=useRef(); const spin=useMemo(()=>model.getObjectByName('RY8_Body_Spin'),[model]);
  const {viewport,size,camera,gl,invalidate}=useThree();const display=useRef();
  useEffect(()=>{
    const controller=new YoyoDisplay(model,invalidate);display.current=controller;window.yoyoDisplay=controller.api;
    return()=>{if(window.yoyoDisplay===controller.api)delete window.yoyoDisplay;controller.dispose();display.current=null;};
  },[model,invalidate]);
  const projected=useMemo(()=>new Vector3(),[]);
  const worldAnchor=useMemo(()=>new Vector3(),[]),targetAnchor=useMemo(()=>new Vector3(),[]);
  useEffect(()=>{
    const tone=new URLSearchParams(location.search).get('tone');
    gl.toneMapping=tone==='aces'?ACESFilmicToneMapping:tone==='agx'?AgXToneMapping:NeutralToneMapping;gl.toneMappingExposure=1.0;gl.outputColorSpace=SRGBColorSpace;
    const materials=new Map();model.traverse(n=>{if(n.isMesh)materials.set(n.material.name,n.material);});
    const uvAudit=[];model.traverse(n=>{if(n.isMesh)uvAudit.push({mesh:n.name,uv0:n.geometry.attributes.uv?.count??0,uv1:n.geometry.attributes.uv1?.count??0,baseMapChannel:n.material.map?.channel??null});});
    score.current.materialAudit={renderer:{toneMapping:gl.toneMapping,exposure:gl.toneMappingExposure,outputColorSpace:gl.outputColorSpace},uvAudit,materials:[...materials.values()].map(m=>({name:m.name,roughness:m.roughness,metalness:m.metalness,iridescence:m.iridescence,iridescenceIOR:m.iridescenceIOR,iridescenceThicknessRange:m.iridescenceThicknessRange,clearcoat:m.clearcoat,transmission:m.transmission,envMapIntensity:m.envMapIntensity,depthWrite:m.depthWrite,map:m.map?{name:m.map.name,colorSpace:m.map.colorSpace,channel:m.map.channel,width:m.map.image?.width,height:m.map.image?.height}:null,emissiveMap:m.emissiveMap?{colorSpace:m.emissiveMap.colorSpace}:null,thicknessMap:m.iridescenceThicknessMap?{colorSpace:m.iridescenceThicknessMap.colorSpace,channel:m.iridescenceThicknessMap.channel}:null}))};
    onReady();
  },[onReady,gl,model,score]);
  useFrame((_,delta)=>{
    const toy=hero?.current;
    if(toy?.active&&toy.initialized&&toy.frame){toy.frame({root:root.current,spin,camera,size,viewport,delta});display.current?.frame({delta,camera,size,hero:toy,active:true});return;}
    const p=pose(score.current.time,size.width<650,size.width/size.height),v=viewport;
    root.current.position.set((p.x-.5)*v.width,(.5-p.y)*v.height,0);
    root.current.scale.setScalar(p.diameter*v.height/.06);
    root.current.rotation.set(p.rx,p.ry,p.rz);
    spin.rotation.z=p.spin;
    root.current.updateWorldMatrix(true,true);
    projected.set(.0039,.0003,0);
    root.current.localToWorld(projected).project(camera);
    // During the trick the analytic orbit specifies the axle, not the body pivot.
    // Align that exact glTF contact in world space; fade this correction only
    // during the authored homepage arrival, preserving the original final framing.
    if(p.axisBlend>0){
      worldAnchor.set(.0039,.0003,0);root.current.localToWorld(worldAnchor);
      targetAnchor.set(p.x*2-1,1-p.y*2,projected.z).unproject(camera);
      targetAnchor.sub(worldAnchor).multiplyScalar(p.axisBlend);root.current.position.add(targetAnchor);
      root.current.updateWorldMatrix(true,true);projected.set(.0039,.0003,0);root.current.localToWorld(projected).project(camera);
    }
    score.current.projection={axle:[(projected.x*.5+.5)*size.width,(.5-projected.y*.5)*size.height]};
    score.current.modelInstance=model.uuid;
    score.current.renderMetrics={scope:'last renderer pass; not total GPU frame cost',lastPassDrawCalls:gl.info.render.calls,lastPassTriangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length??0};
    if(toy?.active&&toy.frame)toy.frame({root:root.current,spin,camera,size,viewport,delta});
    display.current?.frame({delta,camera,size,hero:toy,active:!!toy?.active});
  },-2);
  return <><group ref={root}><primitive object={model} dispose={null}/></group>
    <ambientLight intensity={.12}/><directionalLight position={[-3,5,6]} intensity={2.0}/>
    <directionalLight color="#c0f2ff" position={[-3,-3,5]} intensity={1.25}/>
    <directionalLight color="#dfd4ff" position={[4,3,5]} intensity={.7}/>
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#909098']}/>
      <Lightformer intensity={3.0} color="#fff9ef" position={[-3,5,3]} target={[0,0,0]} scale={[5,5,1]}/>
      <Lightformer intensity={2.6} color="#c6efff" position={[-4,-2,3]} target={[0,0,0]} scale={[4,3,1]}/>
      <Lightformer intensity={2.2} color="#e2d9ff" position={[-4,3,2]} target={[0,0,0]} scale={[2,3,1]}/>
      <Lightformer intensity={3} position={[4,1,2]} target={[0,0,0]} scale={[1,5,1]}/>
      <Lightformer intensity={2} position={[-3,0,-4]} target={[0,0,0]} scale={[4,5,1]}/>
    </Environment>
  </>;
}
useGLTF.preload('/assets/yoyo.glb');




