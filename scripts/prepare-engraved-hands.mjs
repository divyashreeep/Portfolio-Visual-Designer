import fs from 'node:fs';
import crypto from 'node:crypto';
const source=fs.readFileSync('public/assets/hands-source.svg','utf8');
const arity={M:2,L:2,H:1,V:1,C:6,S:4,Z:0};
function parsePath(d){
  const tokens=d.match(/[MLHVCSZmlhvcsz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);
  const commands=[];let i=0,command='',x=0,y=0,sx=0,sy=0,lastControl=null;
  while(i<tokens.length){
    if(/[a-z]/i.test(tokens[i]))command=tokens[i++];
    let upper=command.toUpperCase(),relative=command!==upper;
    if(upper==='Z'){commands.push(['Z']);x=sx;y=sy;lastControl=null;command='';continue;}
    if(!(upper in arity))throw Error(`Unsupported source command ${command}`);
    const args=tokens.slice(i,i+arity[upper]).map(Number);i+=arity[upper];
    const px=n=>args[n]+(relative?x:0),py=n=>args[n]+(relative?y:0);
    let c;
    if(upper==='M'||upper==='L'){c=[upper,px(0),py(1)];if(upper==='M'){sx=c[1];sy=c[2];command=relative?'l':'L';}}
    else if(upper==='H')c=['L',px(0),y];
    else if(upper==='V')c=['L',x,py(0)];
    else if(upper==='C')c=['C',px(0),py(1),px(2),py(3),px(4),py(5)];
    else if(upper==='S')c=['C',lastControl?2*x-lastControl[0]:x,lastControl?2*y-lastControl[1]:y,px(0),py(1),px(2),py(3)];
    commands.push(c);lastControl=c[0]==='C'?[c[3],c[4]]:null;x=c.at(-2);y=c.at(-1);
  }
  return commands;
}
const raw=[...source.matchAll(/<path\b[^>]*class="([^"]+)"[^>]*d="([^"]+)"/g)].map((m,i)=>({i,paint:m[1]==='st0'?'paper':'ink',commands:parsePath(m[2])}));
const groups=[[0,1,6,7],[2,3,4,5]];
const hands=groups.map((ids,side)=>ids.map(i=>({paint:raw[i].paint,sourcePath:i,commands:raw[i].commands.map(c=>c.map((v,j)=>j===0?v:Number((j%2===1?((side?3000-v:v)-850)*.14:(v-1250)*.14).toFixed(5))))})));
const data={sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),viewBox:[0,0,3000,3000],normalization:{scale:.14,origin:[850,1250]},hands};
fs.writeFileSync('public/assets/engraved-hands-rig.json',JSON.stringify(data));
console.log('Preserved 8 source paths; derivative bytes:',fs.statSync('public/assets/engraved-hands-rig.json').size);
for(const p of raw.filter(p=>p.i<2)){
 let sections=[],points=[];for(const c of p.commands){if(c[0]==='M'&&points.length){sections.push(points);points=[];}for(let j=1;j<c.length;j+=2)points.push([c[j],c[j+1]]);}if(points.length)sections.push(points);
 console.log('source path',p.i,sections.map(a=>({x:[Math.min(...a.map(p=>p[0])),Math.max(...a.map(p=>p[0]))],y:[Math.min(...a.map(p=>p[1])),Math.max(...a.map(p=>p[1]))]})));
}
