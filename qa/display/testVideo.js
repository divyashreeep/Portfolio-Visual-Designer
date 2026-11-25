// Development-only generated media. This module is eliminated from production.
export async function generateDisplayTestVideo(){
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
 const ctx=canvas.getContext('2d'),stream=canvas.captureStream(12),type=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!type){stream.getTracks().forEach(t=>t.stop());throw Error('WebM recording is unavailable')}
 const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:500000}),chunks=[];
 let frame=0,timer;
 const draw=()=>{ctx.fillStyle='#163664';ctx.fillRect(0,0,640,360);ctx.fillStyle='#db6754';ctx.fillRect(0,0,320,180);ctx.fillStyle='#51aeb6';ctx.fillRect(320,180,320,180);ctx.strokeStyle='#ffffff55';ctx.lineWidth=1;for(let x=0;x<=640;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,360);ctx.stroke()}for(let y=0;y<=360;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y);ctx.stroke()}ctx.strokeStyle='white';ctx.lineWidth=4;ctx.beginPath();ctx.arc(320,180,95,0,Math.PI*2);ctx.stroke();ctx.fillStyle='white';ctx.font='bold 35px sans-serif';ctx.textAlign='center';ctx.fillText('TOP',320,45);ctx.fillText('BOTTOM',320,340);ctx.fillText('LEFT',95,190);ctx.fillText('RIGHT',540,190);ctx.font='bold 20px sans-serif';ctx.fillText('16 : 9',320,155);ctx.fillText('FRAME '+String(frame++).padStart(2,'0'),320,205);};
 draw();recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 const complete=new Promise((resolve,reject)=>{recorder.onerror=reject;recorder.onstop=()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());resolve(URL.createObjectURL(new Blob(chunks,{type:'video/webm'})))}});
 recorder.start();timer=setInterval(draw,1000/12);setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop()},2600);return complete;
}
