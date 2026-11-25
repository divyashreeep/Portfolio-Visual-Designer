import {useLayoutEffect,useRef} from 'react';
import gsap from 'gsap';
import {CustomEase} from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
const turnEase=CustomEase.create('headline-turn','.5,0,.5,1');
export const HEADLINE_TIMING={flip:1.5,turn:1.15,stagger:.1,end:2.95};

// The arrival completion prop is the only playback trigger. Physics/idle updates
// never recreate this timeline, and each face keeps its own stable layout box.
export function HeroHeadline({active,reduced}){
 const heading=useRef(),timeline=useRef(),completed=useRef(false);
 const lab=import.meta.env.DEV&&new URLSearchParams(location.search).has('typeLab');
 useLayoutEffect(()=>{
  const root=heading.current;
  if(!active){completed.current=false;root.dataset.typeState='waiting';return;}
  let cancelled=false,context;
  const start=()=>{
   if(cancelled)return;
   context=gsap.context(()=>{
    const outgoing=gsap.utils.toArray('.headline-face--initial',root);
    const incoming=gsap.utils.toArray('.headline-face--final',root);
    const finish=()=>{completed.current=true;root.dataset.typeState='headline';};
    if(reduced||completed.current){
     gsap.set(outgoing,{visibility:'hidden'});
     gsap.set(incoming,{visibility:'visible',rotationX:0});finish();return;
    }
    gsap.set(outgoing,{visibility:'visible',rotationX:0,willChange:'transform'});
    gsap.set(incoming,{visibility:'visible',rotationX:180,willChange:'transform'});
    const tl=gsap.timeline({paused:true,defaults:{ease:turnEase},onComplete:finish});
    timeline.current=tl;
    tl.addLabel('portfolio',0).addLabel('hold',0)
      .addLabel('flip',HEADLINE_TIMING.flip).addLabel('headline',HEADLINE_TIMING.end);
    // Each face hinges at its fixed editorial corner. No translation, depth
    // excursion, scale, font-size change or secondary settling track is needed.
    tl.set(outgoing,{visibility:'visible',rotationX:0},0);
    tl.set(incoming,{visibility:'visible',rotationX:180},0);
    tl.set(root,{attr:{'data-type-state':'portfolio'}},0);
    tl.set(root,{attr:{'data-type-state':'flip'}},'flip');
    [0,1].forEach(i=>{
     const at=HEADLINE_TIMING.flip+i*HEADLINE_TIMING.stagger;
     tl.to(outgoing[i],{rotationX:-180,duration:HEADLINE_TIMING.turn},at);
     tl.to(incoming[i],{rotationX:0,duration:HEADLINE_TIMING.turn},at);
     tl.set(outgoing[i],{visibility:'hidden'},at+HEADLINE_TIMING.turn);
    });
    tl.set([...outgoing,...incoming],{clearProps:'willChange'},'headline');
    // Scoped authoring controls enable matched intermediate captures without
    // stopping or seeking the approved Three.js scene.
    if(lab)tl.eventCallback('onUpdate',()=>{root.dataset.typeTime=tl.time().toFixed(3);});
    tl.play();
   },root);
  };
  document.fonts.load('600 1em "Clash Display"').then(start,start);
  return()=>{cancelled=true;context?.revert();timeline.current=null;};
 },[active,reduced,lab]);
 return <>
  <h1 ref={heading} className="hero-headline" aria-label="Design is where I begin." data-type-active={active} data-type-state="waiting">
   <span className="hero-heading-top headline-slot" aria-hidden="true">
    <span className="headline-mask headline-mask--initial"><span className="headline-face headline-face--initial">PORTF</span></span>
    <span className="headline-mask"><span className="headline-face headline-face--final">DESIGN IS<br/>WHERE</span></span>
   </span>
   <span className="hero-heading-bottom headline-slot" aria-hidden="true">
    <span className="headline-mask headline-mask--initial"><span className="headline-face headline-face--initial">LIO</span></span>
    <span className="headline-mask"><span className="headline-face headline-face--final">I BEGIN.</span></span>
   </span>
  </h1>
  {lab&&active&&<aside className="headline-lab"><label>Typography time <input aria-label="Typography time" type="number" min="0" max={HEADLINE_TIMING.end} step=".05" defaultValue="0" onChange={e=>timeline.current?.pause().time(Math.max(0,Math.min(HEADLINE_TIMING.end,Number(e.target.value))),false)}/></label><button onClick={()=>timeline.current?.timeScale(1).restart()}>Play typography</button><button onClick={()=>timeline.current?.timeScale(.35).restart()}>Play slowly</button></aside>}
 </>;
}
