import fs from 'node:fs';import crypto from 'node:crypto';
const source=fs.readFileSync('public/assets/hands-01-source.svg','utf8');
const arity={M:2,L:2,H:1,V:1,C:6,S:4,Z:0};
function parse(d){const tokens=d.match(/[MLHVCSZmlhvcsz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);let i=0,cmd='',x=0,y=0,sx=0,sy=0,last=null,out=[];while(i<tokens.length){if(/[a-z]/i.test(tokens[i]))cmd=tokens[i++];const u=cmd.toUpperCase(),r=cmd!==u;if(u==='Z'){out.push(['Z']);x=sx;y=sy;last=null;cmd='';continue;}if(!(u in arity))throw Error(cmd);const a=tokens.slice(i,i+arity[u]).map(Number);i+=arity[u];const px=n=>a[n]+(r?x:0),py=n=>a[n]+(r?y:0);let c;if(u==='M'||u==='L'){c=[u,px(0),py(1)];if(u==='M'){sx=c[1];sy=c[2];cmd=r?'l':'L';}}else if(u==='H')c=['L',px(0),y];else if(u==='V')c=['L',x,py(0)];else if(u==='C')c=['C',px(0),py(1),px(2),py(3),px(4),py(5)];else c=['C',last?2*x-last[0]:x,last?2*y-last[1]:y,px(0),py(1),px(2),py(3)];out.push(c);last=c[0]==='C'?[c[3],c[4]]:null;x=c.at(-2);y=c.at(-1);}return out;}
const groups=[...source.matchAll(/<g>([\s\S]*?)<\/g>/g)];
const hands=groups.map((group,side)=>[...group[1].matchAll(/<path\b[^>]*class="([^"]+)"[^>]*d="([^"]+)"/g)].map((m,i)=>({paint:m[1]==='st0'?'paper':'ink',outline:m[1]==='st0',sourcePath:`${side}-${i}`,commands:parse(m[2]).map(c=>c.map((v,j)=>j===0?v:+(j%2?((side?2372.4-v:v)-350)*.13:(v-900)*.13).toFixed(5)))})));
// Extend only the original cuff closure. The original palm and finger commands
// are untouched; the new closing edge is below the viewport, never mid-screen.
for(let side=0;side<2;side++){
 const commands=hands[side][5].commands,index=side?8:2;
 const previous=commands[index-1].slice(-2),end=commands[index].slice(-2);
 const offset=[side?30:-12,650];
 commands.splice(index,1,['L',previous[0]+offset[0],previous[1]+offset[1]],['L',end[0]+offset[0],end[1]+offset[1]],['L',...end]);
}
fs.writeFileSync('public/assets/selected-hands-rig.json',JSON.stringify({source:'hands 01.svg',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),viewBox:[0,0,2372.4,2108.7],derivative:'Original silhouettes with extended cuffs; static string excluded',hands}));console.log(hands.map(h=>h.length));
