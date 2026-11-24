import {forwardRef,useEffect,useState} from 'react';
import {bindArtwork} from './FingerRig.js';
const artwork=fetch('/assets/selected-hands-rig.json').then(r=>{if(!r.ok)throw Error('Selected hand SVG could not load');return r.json();}).then(bindArtwork);
export const SvgHands=forwardRef(function SvgHands({onReady,onError},ref){
 const [hands,setHands]=useState(null);
 useEffect(()=>{let active=true;artwork.then(a=>{if(active)setHands(a);}).catch(e=>{if(active)onError(e.message);});return()=>{active=false;};},[onError]);
 useEffect(()=>{if(hands)onReady(hands);},[hands,onReady]);
 return <g ref={ref} id="hands-vector-source" className="hands" data-artwork="hands-01" fillRule="nonzero" strokeLinecap="round" strokeLinejoin="round">
  {hands?.map((hand,side)=><g key={side} data-hand={side}>
   {/* All paper fills cover all interior outline overlaps: a true combined silhouette. */}
   <g fill="#0000CC" stroke="#0000CC" strokeWidth="3.2">{hand.map((path,i)=>path.paint==='paper'&&<path key={i} data-rig-index={i} vectorEffect="non-scaling-stroke"/>)}</g>
   <g fill="var(--hand-paper, #F8F7F3)">{hand.map((path,i)=>path.paint==='paper'&&<path key={i} data-rig-index={i}/>)}</g>
   <g fill="#0000CC">{hand.map((path,i)=>path.paint==='ink'&&<path key={i} data-rig-index={i}/>)}</g>
  </g>)}
 </g>;
});

