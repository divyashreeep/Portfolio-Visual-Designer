import {useEffect,useRef,useState} from 'react';
import './hero.css';
const SAMPLES=84;
export function HomeHero({controller,active,reduced}){
 const svg=useRef(),pointer=useRef(null),bounds=useRef(null),dialog=useRef(),demoTimer=useRef(),[cueVisible,setCueVisible]=useState(true),[view,setView]=useState(null);
 const local=(x,y)=>{const r=bounds.current||svg.current.getBoundingClientRect();return[(x-r.left-r.width/2)/r.height,.5-(y-r.top)/r.height]};
 const first=()=>{setCueVisible(false);controller.current.used=true;controller.current.demoDone=true;controller.current.wake=true;clearTimeout(demoTimer.current);};
 const release=(cancel=false)=>{const c=controller.current;c.gesture=null;c.sim?.release(cancel);pointer.current=null;c.invalidate?.();};
 useEffect(()=>{
  const c=controller.current,onIdle=idle=>setCueVisible(active&&idle);
  c.onIdleChange=onIdle;if(c.initialized)onIdle(!!c.idle);
  return()=>{if(c.onIdleChange===onIdle)c.onIdleChange=null};
 },[active,controller]);
 useEffect(()=>{
  const c=controller.current;
  if(!active){c.used=false;c.demoDone=false;setCueVisible(true);return}
  const demonstrate=()=>{if(c.used||c.demoDone||reduced||document.hidden)return;const s=c.sim;if(!s||s.mode!=='rest'){demoTimer.current=setTimeout(demonstrate,200);return}if(dialog.current?.open)return;c.demoDone=true;const start=[s.p[0],s.p[1]];s.grab(0,...start,'demo');c.gesture={kind:'Demo',age:0,duration:.75,start,index:0};c.wake=true;c.invalidate?.();};
  demoTimer.current=setTimeout(demonstrate,3000);
  return()=>{clearTimeout(demoTimer.current)};
 },[active,reduced,controller]);
 useEffect(()=>{const cancel=()=>release(true),visible=()=>{if(document.hidden)cancel()};window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',visible);return()=>{window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',visible)};},[controller]);
 useEffect(()=>{if(view&&!dialog.current.open){controller.current.gesture=null;controller.current.sim?.release(true);controller.current.invalidate?.();dialog.current.showModal();}},[view]);
 const down=(e,endpoint=false)=>{
  const c=controller.current;if(!active||!c.sim||e.button!==0||pointer.current!==null)return;e.preventDefault();bounds.current=svg.current.getBoundingClientRect();const r=bounds.current,x=e.clientX-r.left,y=e.clientY-r.top,p=c.projected;let best=Infinity,uBest=0;
  if(!endpoint)for(let i=0;i<SAMPLES-4;i++){if(!c.pickable[i]||!c.pickable[i+1])continue;const ax=p[i*2],ay=p[i*2+1],dx=p[i*2+2]-ax,dy=p[i*2+3]-ay,u=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1))),d=(x-ax-u*dx)**2+(y-ay-u*dy)**2;if(d<best){best=d;uBest=i+u}}
  if(!endpoint&&!Number.isFinite(best))return;c.gesture=null;
  const [px,py]=local(e.clientX,e.clientY);c.sim.grab(uBest/SAMPLES*c.sim.n,px,py,e.pointerType);pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);first();c.invalidate?.();
 };
 const move=e=>{const c=controller.current;if(pointer.current!==e.pointerId||!c.sim?.drag)return;const [x,y]=local(e.clientX,e.clientY);c.sim.move(x,y);c.invalidate?.();};
 const up=e=>{if(pointer.current!==e.pointerId)return;release(e.type==='pointercancel');if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)};
 const key=e=>{
  const c=controller.current,s=c.sim;if(!s||!active)return;c.gesture=null;
  if(e.key==='Escape'||e.key==='Home'){e.preventDefault();s.recover();c.invalidate?.();return;}
  if(e.code==='Space'){e.preventDefault();if(s.drag)release();else{s.grab(0,s.p[0],s.p[1],'keyboard');first();}c.invalidate?.();return;}
  const d={ArrowLeft:[-.06,0],ArrowRight:[.06,0],ArrowUp:[0,.06],ArrowDown:[0,-.06]}[e.key];if(!d)return;e.preventDefault();if(!s.drag){const k=Math.round(s.n*.53);s.grab(k,s.p[k*2],s.p[k*2+1],'keyboard');first();}s.move(s.drag.target[0]+d[0],s.drag.target[1]+d[1]);c.invalidate?.();
 };
 return <>
  <div className="hero-ui" inert={!active} aria-hidden={!active}>
   <h1 className="hero-headline" aria-label="Design is where I begin."><span className="hero-heading-top home-bit" aria-hidden="true">DESIGN IS<br/>WHERE</span><span className="hero-heading-bottom home-bit" aria-hidden="true">I BEGIN.</span></h1>
   <nav className="hero-nav home-bit" aria-label="Portfolio"><button onClick={()=>setView('projects')}>PROJECTS</button><button onClick={()=>setView('about')}>ABOUT ME</button><button onClick={()=>setView('contact')}>CONTACT</button></nav>
   <div ref={e=>{controller.current.cue=e}} className={'hero-cue home-bit '+(cueVisible?'':'has-played')} data-reduced={reduced}>
    <button className="hero-endpoint" aria-label="Pull to play." aria-describedby="string-keyboard-help" onPointerEnter={()=>{controller.current.endpointHover=true;controller.current.invalidate?.()}} onPointerLeave={()=>{controller.current.endpointHover=false;controller.current.invalidate?.()}} onPointerDown={e=>down(e,true)} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={()=>{if(pointer.current!==null)release(true)}} onKeyDown={key} onBlur={()=>{if(controller.current.sim?.drag?.source==='keyboard')release()}} onClick={e=>{if(e.detail)return;const c=controller.current,s=c.sim;if(!s)return;if(s.drag){release();return}const start=[s.p[0],s.p[1]];s.grab(0,...start,'keyboard');c.gesture={kind:'Demo',age:0,duration:.45,start,index:0};first();c.invalidate?.()}}><span className="endpoint-ring"/><span className="endpoint-dot"/></button>
    <span className="hero-instruction">Pull to play.</span>
   </div>
   <p id="string-keyboard-help" className="sr-only">Press Space to grab the thread, then use arrow keys to pull. Press Space to release. Escape returns the yo-yo to rest. {reduced?'Motion is reduced.':''}</p>
  </div>
  <div className="hero-input-surface" ref={e=>{controller.current.surface=e}} data-state="preparing" aria-hidden="true" style={{visibility:active?'visible':'hidden'}}>
   <svg ref={svg} className="hero-thread-input"><path ref={e=>{controller.current.hoverPath=e}} className="thread-hover"/><path ref={e=>{controller.current.hit=e}} className="thread-hit" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={()=>{if(pointer.current!==null)release(true)}} onPointerEnter={()=>{controller.current.hover=true;controller.current.invalidate?.()}} onPointerLeave={()=>{controller.current.hover=false;controller.current.invalidate?.()}}/></svg>
  </div>
  <dialog ref={dialog} className="hero-dialog" onClose={()=>setView(null)}><button className="hero-dialog-close" onClick={()=>dialog.current.close()} aria-label="Close panel">CLOSE</button><p className="hero-dialog-label">DIVYA / {view==='about'?'ABOUT ME':view==='projects'?'PROJECTS':'CONTACT'}</p><h2>{view==='about'?'A curious eye.':view==='projects'?'Selected work.':'Let’s talk.'}</h2><p>{view==='about'?'I’m Divya, a multidisciplinary visual designer working across brand identity, digital experiences, creative direction, motion and marketing design.':view==='projects'?'Project case studies are being developed.':'Contact details will be added here.'}</p></dialog>
 </>;
}



