import { Suspense, useCallback, useEffect, useRef, useState, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { YoyoModel } from './YoyoModel.jsx';
import { SvgHands } from './SvgHands.jsx';
import { updateRig } from './StringRig.js';
import { CONFIG } from './choreography.js';
import {HomeHero} from './hero/HomeHero.jsx';
import {HeroThread,createHeroController} from './hero/HeroThread.jsx';
import {ToyLab} from './hero/ToyLab.jsx';
class RenderBoundary extends Component {
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="render-error" role="status">The 3D introduction could not load.<button onClick={()=>location.reload()}>Try again</button><button onClick={this.props.onSkip}>Continue to portfolio</button></div>:this.props.children;}
}
function Playhead({score,timeline}){
  const invalidate=useThree(s=>s.invalidate);
  useEffect(()=>{score.current.invalidate=invalidate;return()=>{score.current.invalidate=null;};},[score,invalidate]);
  useFrame((_,delta)=>{
    if(score.current.playing&&timeline.current){
      timeline.current.time(Math.min(CONFIG.duration,timeline.current.time()+Math.min(delta,.05)),false);
    }
  },-3);
  return null;
}
function RigFrame({render,meter,score}){
  const samples=useRef([]);
  useFrame((_,delta)=>{render();if(score.current.playing&&meter.current&&samples.current.length<150){
    samples.current.push(delta*1000);
    if(samples.current.length===150){const values=samples.current.slice(15).sort((a,b)=>a-b),mean=values.reduce((a,b)=>a+b,0)/values.length;
      meter.current.textContent=`Frame intervals: median ${values[Math.floor(values.length*.5)].toFixed(1)} ms · p95 ${values[Math.floor(values.length*.95)].toFixed(1)} ms · mean ${mean.toFixed(1)} ms (${values.length} frames, this browser)`;
    }
  }},-1);return null;
}
export default function PortfolioIntro(){
  const hero=useRef(null);if(!hero.current)hero.current=createHeroController();
  const stage=useRef(),svg=useRef(),hands=useRef(),string=useRef(),underlay=useRef(),crossings=useRef(),wraps=useRef(),meter=useRef();
  const score=useRef({time:0,playing:false,frames:[],capture:new URLSearchParams(location.search).has('capture')}),skipped=useRef(false),completed=useRef(false),dimensions=useRef({width:1440,height:900}),timeline=useRef(),[ready,setReady]=useState(false),[finished,setFinished]=useState(false);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).get('motion')==='reduced');
  const [handsReady,setHandsReady]=useState(false),[assetError,setAssetError]=useState('');
  const onReady=useCallback(()=>setReady(true),[]);
  const onHandsReady=useCallback(data=>{score.current.handArt=data;setHandsReady(true);},[]);
  const onHandsError=useCallback(message=>setAssetError(message),[]);
  const render=useCallback(()=>{if(!svg.current||(hero.current.active&&stage.current.dataset.time==='8.000'))return;const {width:w,height:h}=dimensions.current;updateRig({svg:svg.current,hands:hands.current,string:string.current,underlay:underlay.current,crossings:crossings.current,wraps:wraps.current,score:score.current,w,h});},[]);
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>{dimensions.current=entry.contentRect;render();});observer.observe(stage.current);return()=>observer.disconnect();},[render]);
  useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update);},[]);
  useEffect(()=>{
    if(!ready||!handsReady)return;
    const ctx=gsap.context(()=>{
      score.current.time=0;score.current.playing=false;
      stage.current.style.backgroundColor=CONFIG.paper;stage.current.style.setProperty('--home','0');
      setFinished(false);
      const tl=gsap.timeline({paused:true,defaults:{ease:'none'},onComplete:()=>{completed.current=true;score.current.playing=false;setFinished(true);}});
      timeline.current=tl;
      Object.entries(CONFIG.labels).forEach(([label,time])=>tl.addLabel(label,time));
      tl.to(score.current,{time:CONFIG.duration,duration:CONFIG.duration,ease:'none'},0);
      const seek=new URLSearchParams(location.search).get('time');
      if(seek!==null){tl.time(Math.min(CONFIG.duration,Math.max(0,Number(seek))));setFinished(Number(seek)>=CONFIG.duration);}
      else if(reduced||skipped.current||completed.current||new URLSearchParams(location.search).has('hero')){tl.progress(1);setFinished(true);}else score.current.playing=true;
      // Deliberate authoring hook for deterministic frame inspection and refinement.
      window.yoyoIntro={seek:(time)=>{score.current.playing=false;tl.time(Math.min(CONFIG.duration,Math.max(0,time)));setFinished(time>=CONFIG.duration);score.current.invalidate?.();},play:()=>{score.current.playing=true;setFinished(false);score.current.invalidate?.();},get time(){return score.current.time;}};
    },stage);
    return()=>{score.current.playing=false;ctx.revert();delete window.yoyoIntro;};
  },[ready,handsReady,reduced,render]);
  const skip=()=>{skipped.current=true;score.current.playing=false;timeline.current?.progress(1);score.current.time=CONFIG.duration;setFinished(true);score.current.invalidate?.();};
  const replay=()=>{if(reduced)return;skipped.current=false;completed.current=false;score.current.frames=[];score.current.projection=null;timeline.current?.pause().time(0);score.current.time=0;stage.current.style.backgroundColor=CONFIG.paper;stage.current.style.setProperty('--home','0');setFinished(false);score.current.playing=true;score.current.invalidate?.();};
  return <main ref={stage} className={`stage ${finished?'arrived':''} ${new URLSearchParams(location.search).has('prototype')?'toy-prototype':''}`}>
    <svg ref={svg} className="rig" aria-hidden="true"><defs><SvgHands ref={hands} onReady={onHandsReady} onError={onHandsError}/></defs><path ref={underlay} fill="none" strokeWidth="5"/><path ref={string} fill="none" stroke="#0000CC" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/><g ref={crossings} fill="none">{[0,1,2,3].map(i=><g key={i}><path stroke="#F8F7F3" strokeWidth="6"/><path stroke="#0000CC" strokeWidth="2.2"/></g>)}</g></svg>
    <RenderBoundary onSkip={skip}><Canvas style={{zIndex:2,pointerEvents:'none',touchAction:'auto'}} frameloop={finished?'demand':'always'} camera={CONFIG.camera} dpr={[1,CONFIG.dpr]} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearAlpha(0);}}>
      <Playhead score={score} timeline={timeline}/><Suspense fallback={null}><YoyoModel score={score} onReady={onReady} hero={hero}/></Suspense><RigFrame render={render} meter={meter} score={score}/><HeroThread controller={hero} score={score} reduced={reduced} active={finished}/>
    </Canvas></RenderBoundary>
    <svg aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:1,pointerEvents:'none'}}><use href="#hands-vector-source"/><g ref={wraps} data-finger-wraps="true" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{Array.from({length:8},(_,i)=><path key={i}/>)}</g></svg>
    <HomeHero controller={hero} active={finished} reduced={reduced}/>
    {finished&&new URLSearchParams(location.search).has('prototype')&&<ToyLab controller={hero}/>}
    {!finished&&<div className="intro-controls"><span role="status">{assetError||((ready&&handsReady)?'A little play, before the work.':'Preparing a little play…')}</span><button onClick={skip}>Skip intro</button><i/></div>}
    {new URLSearchParams(location.search).has('debug')&&<output ref={meter} style={{position:'absolute',top:100,left:20,color:'#888',fontSize:12}}>Measuring frame intervals…</output>}
    {new URLSearchParams(location.search).has('inspect')&&<aside style={{position:'absolute',top:10,left:10,zIndex:20,background:'#F8F7F3',color:'#0000CC',padding:10,fontSize:14}}><label>Animation time <input aria-label="Animation time" type="number" defaultValue="0" min="0" max={CONFIG.duration} step="0.05" onChange={event=>{const t=Math.min(CONFIG.duration,Math.max(0,Number(event.target.value)));score.current.playing=false;timeline.current?.time(t);setFinished(t>=CONFIG.duration);score.current.invalidate?.();}}/></label><button onClick={replay}>Play from start</button></aside>}
  </main>;
}









