import {useEffect,useRef,useState} from 'react';
import './hero.css';
const SAMPLES=84;
export function HomeHero({controller,active,reduced}){
 const svg=useRef(),pointer=useRef(null),bounds=useRef(null),dialog=useRef(),[used,setUsed]=useState(false),[view,setView]=useState(null);
 const local=(x,y)=>{const r=bounds.current||svg.current.getBoundingClientRect();return[(x-r.left-r.width/2)/r.height,.5-(y-r.top)/r.height]};
 const first=()=>{if(!used)setUsed(true);controller.current.used=true;controller.current.wake=true;};
 const release=(cancel=false)=>{const c=controller.current;c.gesture=null;c.sim?.release(cancel);pointer.current=null;c.invalidate?.();};
 useEffect(()=>{const cancel=()=>release(true),visible=()=>{if(document.hidden)cancel()};window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',visible);return()=>{window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',visible)};},[controller]);
 useEffect(()=>{if(view&&!dialog.current.open){controller.current.gesture=null;controller.current.sim?.release(true);controller.current.invalidate?.();dialog.current.showModal();}},[view]);
 const down=e=>{
  const c=controller.current;if(!active||!c.sim||e.button!==0)return;e.preventDefault();c.gesture=null;bounds.current=svg.current.getBoundingClientRect();const r=bounds.current,x=e.clientX-r.left,y=e.clientY-r.top,p=c.projected;let best=Infinity,uBest=0;
  for(let i=0;i<SAMPLES-5;i++){const ax=p[i*2],ay=p[i*2+1],dx=p[i*2+2]-ax,dy=p[i*2+3]-ay,u=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1))),d=(x-ax-u*dx)**2+(y-ay-u*dy)**2;if(d<best){best=d;uBest=i+u}}
  const [px,py]=local(e.clientX,e.clientY);c.sim.grab(uBest/SAMPLES*c.sim.n,px,py,e.pointerType);pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);first();c.invalidate?.();
 };
 const move=e=>{const c=controller.current;if(pointer.current!==e.pointerId||!c.sim?.drag)return;const [x,y]=local(e.clientX,e.clientY);c.sim.move(x,y);c.invalidate?.();};
 const up=e=>{if(pointer.current!==e.pointerId)return;release(e.type==='pointercancel');if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)};
 const key=e=>{
  const c=controller.current,s=c.sim;if(!s||!active)return;c.gesture=null;
  if(e.key==='Escape'||e.key==='Home'){e.preventDefault();s.recover();c.invalidate?.();return;}
  if(e.code==='Space'){e.preventDefault();if(s.drag)s.release();else{const k=Math.round(s.n*.53);s.grab(k,s.p[k*2],s.p[k*2+1],'keyboard');first();}c.invalidate?.();return;}
  const d={ArrowLeft:[-.06,0],ArrowRight:[.06,0],ArrowUp:[0,.06],ArrowDown:[0,-.06]}[e.key];if(!d)return;e.preventDefault();if(!s.drag){const k=Math.round(s.n*.53);s.grab(k,s.p[k*2],s.p[k*2+1],'keyboard');first();}s.move(s.drag.target[0]+d[0],s.drag.target[1]+d[1]);c.invalidate?.();
 };
 return <>
  <div className="hero-ui" inert={!active} aria-hidden={!active}>
   <h1 className="hero-headline"><span className="hero-heading-top home-bit">DESIGN IN</span><span className="hero-heading-bottom home-bit">MOTION.</span><span className="sr-only"> — Divya, multidisciplinary visual designer</span></h1>
   <nav className="hero-nav home-bit" aria-label="Portfolio"><button onClick={()=>setView('projects')}>PROJECTS</button><button onClick={()=>setView('about')}>ABOUT ME</button><button onClick={()=>setView('contact')}>CONTACT</button></nav>
   <button className={'hero-instruction home-bit '+(used?'has-played':'')} aria-label="Play with the yo-yo string" aria-describedby="string-keyboard-help" onKeyDown={key} onBlur={()=>{if(controller.current.sim?.drag?.source==='keyboard')release()}} onClick={()=>{const c=controller.current,s=c.sim;if(!s)return;if(s.drag){release();return}const k=Math.round(s.n*.53),start=[s.p[k*2],s.p[k*2+1]];s.grab(k,...start,'keyboard');c.gesture={kind:'Up',age:0,duration:.35,lift:.12,start,index:k};first();c.invalidate?.()}}>Go ahead. Pull the string.</button>
   <p id="string-keyboard-help" className="sr-only">Press Space to grab the thread, then use arrow keys to pull. Press Space to release. Escape returns the yo-yo to rest. {reduced?'Motion is reduced.':''}</p>
  </div>
  <div className="hero-input-surface" ref={e=>{controller.current.surface=e}} data-state="preparing" aria-hidden="true" style={{visibility:active?'visible':'hidden'}}>
   <svg ref={svg} className="hero-thread-input"><path ref={e=>{controller.current.hoverPath=e}} className="thread-hover"/><path ref={e=>{controller.current.hit=e}} className="thread-hit" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={()=>{if(pointer.current!==null)release(true)}} onPointerEnter={()=>{controller.current.hover=true;controller.current.invalidate?.()}} onPointerLeave={()=>{controller.current.hover=false;controller.current.invalidate?.()}}/></svg>
  </div>
  <dialog ref={dialog} className="hero-dialog" onClose={()=>setView(null)}><button className="hero-dialog-close" onClick={()=>dialog.current.close()} aria-label="Close panel">CLOSE</button><p className="hero-dialog-label">DIVYA / {view==='about'?'ABOUT ME':view==='projects'?'PROJECTS':'CONTACT'}</p><h2>{view==='about'?'A curious eye.':view==='projects'?'Selected work.':'Let’s talk.'}</h2><p>{view==='about'?'I’m Divya, a multidisciplinary visual designer working across brand identity, digital experiences, creative direction, motion and marketing design.':view==='projects'?'Project case studies are being developed.':'Contact details will be added here.'}</p></dialog>
 </>;
}



