export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const phase=(t,start,end)=>smooth((t-start)/(end-start));
export const pointMix=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
// Cubic Hermite in seconds. Explicit derivatives permit C1 contact handoffs.
export function track(keys,t){if(t<=keys[0][0])return keys[0][1];if(t>=keys.at(-1)[0])return keys.at(-1)[1];let i=0;while(t>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],dt=b[0]-a[0],u=(t-a[0])/dt;
 const slope=k=>{if(keys[k][2]!==undefined)return keys[k][2];if(k===0||k===keys.length-1)return 0;const p=keys[k-1],c=keys[k],n=keys[k+1];if((c[1]-p[1])*(n[1]-c[1])<=0)return 0;return(n[1]-p[1])/(n[0]-p[0]);};
 return(2*u**3-3*u*u+1)*a[1]+(u**3-2*u*u+u)*slope(i)*dt+(-2*u**3+3*u*u)*b[1]+(u**3-u*u)*slope(i+1)*dt;
}
