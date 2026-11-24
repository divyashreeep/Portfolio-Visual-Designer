import {useState} from 'react';
export function ToyLab({controller}){
 const [last,setLast]=useState('Ready');
 const start=kind=>{const c=controller.current,s=c.sim;if(!s)return;const i=Math.round(s.n*.5),x=s.p[i*2],y=s.p[i*2+1];c.trace.length=0;c.wake=true;c.gesture={kind,age:0,duration:kind==='Slow pull'?2:kind==='Fast pull'?.22:kind==='Circle'?2.4:1.1,start:[x,y],index:i};s.grab(i,x,y,'trace');setLast(kind);c.invalidate?.();};
 return <aside className="toy-lab"><p>INTERACTION LAB</p>{['Up','Down','Left','Right','Diagonal','Circle','Fast pull','Slow pull'].map(kind=><button key={kind} onClick={()=>start(kind)}>{kind}</button>)}<button onClick={()=>{controller.current.gesture=null;controller.current.sim?.recover();controller.current.invalidate?.();setLast('Recover')}}>Recover</button><output>{last}</output></aside>;
}


