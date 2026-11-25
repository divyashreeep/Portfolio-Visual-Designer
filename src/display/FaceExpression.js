const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export class FaceExpression{
 constructor(config){this.config=config;this.time=0;this.seed=42871;this.gaze=[0,0];this.glance=[0,0];this.nextGlance=2.8;this.nextBlink=3.4;this.blinkStart=-10;this.blinks=0;this.doubleAt=Infinity;this.open=1;this.reason='idle';}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 blink(){this.blinkStart=this.time;this.blinks++;}
 step(delta,{look=null,reason='idle',speed=0,reduced=false}={}){
  const dt=Math.min(delta,.05);this.time+=dt;this.reason=reason;
  if(!reduced){
   if(this.time>=this.nextGlance){this.glance=[(this.random()-.5)*.32,(this.random()-.5)*.22];this.nextGlance=this.time+3.5+this.random()*4;}
   if(this.time>=this.nextBlink){this.blink();this.nextBlink=this.time+this.config.blinkMin+this.random()*(this.config.blinkMax-this.config.blinkMin);if(this.random()<.23)this.doubleAt=this.time+.34+this.random()*.09;}
   if(this.time>=this.doubleAt){this.blink();this.doubleAt=Infinity;}
  }
  const target=look||this.glance,k=1-Math.exp(-dt*(reason==='play'?9:5));
  for(let axis=0;axis<2;axis++)this.gaze[axis]+=(clamp(reduced?0:target[axis],-1,1)-this.gaze[axis])*k;
  const age=this.time-this.blinkStart;
  const blink=reduced?0:age<.075?smooth(age/.075):age<.10?1:age<.24?1-smooth((age-.10)/.14):0;
  const squint=reduced?0:clamp((speed-.2)/1.4,0,1)*.17;
  const curiosity=reason==='thread'&&!reduced?.025:0;
  this.open=Math.max(.035,(1-blink)*(1-squint+curiosity));
  return this;
 }
}

// Square circular screen: UV multipliers preserve the source aspect ratio.
// Contain leaves the original pearl visible around the fitted image.
export function videoUvScale(width,height,fit='cover'){
 const a=Math.max(1,width)/Math.max(1,height);
 return fit==='contain'?(a>=1?[1,a]:[1/a,1]):(a>=1?[1/a,1]:[1,a]);
}
