/* Print Studio: deterministic image-space textures + glyph-space error diffusion. */
(function(root){
 'use strict';
 const clip=v=>Math.max(0,Math.min(1,v));
 const noise=(x,y)=>{let n=(x*374761393+y*668265263)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295};
 const kernels={
  'floyd':{d:16,k:[[1,0,7],[-1,1,3],[0,1,5],[1,1,1]]},
  'atkinson':{d:8,k:[[1,0,1],[2,0,1],[-1,1,1],[0,1,1],[1,1,1],[0,2,1]]},
  'jarvis':{d:48,k:[[1,0,7],[2,0,5],[-2,1,3],[-1,1,5],[0,1,7],[1,1,5],[2,1,3],[-2,2,1],[-1,2,3],[0,2,5],[1,2,3],[2,2,1]]},
  'stucki':{d:42,k:[[1,0,8],[2,0,4],[-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2],[-2,2,1],[-1,2,2],[0,2,4],[1,2,2],[2,2,1]]},
  'burkes':{d:32,k:[[1,0,8],[2,0,4],[-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2]]},
  'sierra':{d:32,k:[[1,0,5],[2,0,3],[-2,1,2],[-1,1,4],[0,1,5],[1,1,4],[2,1,2],[-1,2,2],[0,2,3],[1,2,2]]},
  'sierra2':{d:16,k:[[1,0,4],[2,0,3],[-2,1,1],[-1,1,2],[0,1,3],[1,1,2],[2,1,1]]},
  'sierra-lite':{d:4,k:[[1,0,2],[-1,1,1],[0,1,1]]}
 };
 function bayer(x,y){let v=0;for(let bit=0;bit<3;bit++){const a=(x>>bit)&1,b=(y>>bit)&1;v=v*4+((a^b)*2+b)}return (v+.5)/64;}
 function dither(luma,w,h,method,levels=2,rgba){
  const kernel=kernels[method],steps=Math.max(1,levels-1);
  if(!kernel&& !['bayer','white-noise'].includes(method))return luma;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x;if(rgba&&rgba[i*4+3]<20)continue;
   const v=clip(luma[i]),offset=method==='bayer'?bayer(x,y)-.5:method==='white-noise'?noise(x,y)-.5:0;
   const q=Math.round(clip(v+offset/steps)*steps)/steps;luma[i]=q;
   if(kernel){const err=v-q;for(const [dx,dy,weight] of kernel.k){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy<h&&(!rgba||rgba[(yy*w+xx)*4+3]>=20))luma[yy*w+xx]+=err*weight/kernel.d;}}
  }
  return luma;
 }
 function grade(data,s){
  const black=+s.printBlack||0,white=Math.max(black+1,+s.printWhite||255),mid=+s.printMid||0,hue=(+s.printHue||0)*Math.PI/180;
  if(!black&&white===255&&!mid&&!hue)return data;
  const result=new Uint8ClampedArray(data.length),c=Math.cos(hue),z=Math.sin(hue);
  // Hue rotation around the neutral RGB axis preserves equal-channel greys.
  const a=(1-c)/3,b=z/Math.sqrt(3),m=[c+a,a-b,a+b,a+b,c+a,a-b,a-b,a+b,c+a];
  for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],bl=data[i+2];for(let k=0;k<3;k++){let v=clip((m[k*3]*r+m[k*3+1]*g+m[k*3+2]*bl-black)/(white-black));v=Math.pow(v,Math.pow(2,-mid));result[i+k]=v*255;}result[i+3]=data[i+3];}
  return result;
 }
 function texture(data,w,h,method,s){
  const lum=new Float32Array(w*h),angle=(+s.printAngle||0)*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle),pitch=Math.max(2,+s.printPitch||7),levels=Math.max(2,+s.printLevels||2);
  for(let i=0;i<lum.length;i++){let v=(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2])/255;v=clip((v-.5)*(+s.contrast||1)+.5+(+s.brightness||0));v=Math.pow(v,1/(+s.gamma||1));lum[i]=s.invert?1-v:v;}
  const quant=lum.slice();dither(quant,w,h,method,levels,data);
  const result=new Uint8ClampedArray(data.length),fg=hex(s.printInk||'#18181b'),bg=hex(s.printPaper||'#ece8e1'),sourceColour=s.printColour==='source',strength=clip(+s.printStrength),edge=(x,y)=>lum[Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x))];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,v=lum[i],u=x*cs+y*sn,z=-x*sn+y*cs,unit=n=>((n%pitch)+pitch)%pitch/pitch;
   const ux=unit(u)-.5,uy=unit(z)-.5,gradient=Math.hypot(edge(x+1,y)-edge(x-1,y),edge(x,y+1)-edge(x,y-1));
   let q=v;
   if(kernels[method]||['bayer','white-noise'].includes(method))q=quant[i];
   else if(method==='threshold')q=v>=.5?1:0;
   else if(method==='posterize')q=Math.round(v*(levels-1))/(levels-1);
   else if(method==='pocket')q=Math.round(clip(v+(bayer(x,y)-.5)/3)*3)/3;
   else if(['halftone','clustered','coarse','pop','spot'].includes(method)){
    const radius=method==='clustered'?Math.max(Math.abs(ux),Math.abs(uy)):Math.hypot(ux,uy);
    q=radius<Math.sqrt(1-v)*.7?0:1;
   }else if(method==='line-screen')q=Math.abs(uy)<(1-v)*.5?0:1;
   else if(method==='crosshatch')q=Math.abs(uy)<(1-v)*.35||Math.abs(ux)<Math.max(0,.55-v)*.4?0:1;
   else if(method==='pattern')q=(Math.sin(u/pitch*6.28)*Math.cos(z/pitch*6.28)+1)/2<v?1:0;
   else if(method==='wavy')q=Math.abs(unit(z+Math.sin(u/(pitch*3))*pitch*.55)-.5)<(1-v)*.45?0:1;
   else if(method==='rings'||method==='spiral'||method==='sunburst'){
    const dx=x-w/2,dy=y-h/2,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
    const p=method==='sunburst'?a*pitch*10:method==='spiral'?r+a*pitch*2:r;
    q=Math.abs(unit(p)-.5)<(1-v)*.45?0:1;
   }else if(method==='ridgeline'||method==='waveform')q=Math.abs(unit(z+v*pitch*(method==='ridgeline'?1.8:1))-.5)<.09+(1-v)*.2?0:1;
   else if(method==='contour')q=Math.abs((v*levels)%1-.5)<.14?0:1;
   else if(method==='outline')q=gradient>.1?0:1;
   else if(method==='photocopy')q=v<.5||gradient>.14||noise(x,y)<.025?0:1;
   else if(method==='modulation')q=unit(z+noise(x,0)*pitch)<1-v?0:1;
   else if(method==='diagonal')q=Math.abs(uy)<(1-v)*.5?0:1;
   for(let k=0;k<3;k++){
    let color=fg[k]+(bg[k]-fg[k])*q;
    if(sourceColour)color=q*data[i*4+k]+(1-q)*fg[k];
    if(method==='pop'&&q===0)color=[220,38,106][k];
    if(method==='spot'&&q===0)color=[43,71,153][k];
    result[i*4+k]=data[i*4+k]*(1-strength)+color*strength;
   }
   result[i*4+3]=data[i*4+3];
  }
  return result;
 }
 function hex(s){return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16));}
 const api={dither,grade,texture,kernels,bayer};root.ASCIIPrint=api;
 if(typeof module!=='undefined')module.exports=api;
 if(typeof document==='undefined')return;
 const el=id=>document.getElementById(id),tabs=document.querySelector('.tabs'),panel=document.querySelector('.panel-scroll');
 if(!tabs||!panel||typeof render!=='function')return;
 root.asciiDitherLuma=dither;
 const groups=[['Error diffusion', [['floyd','Floyd–Steinberg'],['atkinson','Atkinson'],['jarvis','Jarvis–Judice–Ninke'],['stucki','Stucki'],['burkes','Burkes'],['sierra','Sierra'],['sierra2','Two-row Sierra'],['sierra-lite','Sierra Lite']]],
 ['Ordered & noise',[['bayer','Bayer · 8×8'],['white-noise','White noise'],['pocket','Pocket camera · 4 tones']]],
 ['Halftone & dots',[['halftone','Halftone'],['spot','Spot ink print'],['pop','Pop art'],['clustered','Clustered dots'],['coarse','Coarse dots']]],
 ['Lines & hatching',[['line-screen','Line screen'],['crosshatch','Crosshatch'],['pattern','Pattern'],['wavy','Wavy lines'],['rings','Rings'],['spiral','Spiral'],['sunburst','Sunburst']]],
 ['Line art & streaks',[['ridgeline','Ridgeline'],['contour','Contour lines'],['outline','Outline'],['waveform','Waveform'],['photocopy','Photocopy'],['modulation','Modulation'],['diagonal','Diagonal streak']]],
 ['Flat tones',[['threshold','Threshold'],['posterize','Posterize']]]];
 const options=groups.map(([name,list])=>`<optgroup label="${name}">${list.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</optgroup>`).join('');
 tabs.insertAdjacentHTML('beforeend','<button data-tab="print" aria-controls="panel-print" aria-pressed="false">Print</button>');
 panel.insertAdjacentHTML('beforeend',`<section id="panel-print" data-panel="print" hidden aria-label="Dithering and print effects">
 <div class="panel-intro"><span class="eyebrow">PIXEL DARKROOM / PRINT</span><h2>Ink. Grain. Geometry.</h2><p class="note">Render the source as a print texture, or keep ASCII and use its expanded Dithering menu. Print textures support masks, CRT, PNG and video.</p></div>
 <label class="field"><span>Render style</span><select id="printStyle"><option value="ascii">ASCII · existing character renderer</option>${options}</select></label>
 <p class="note" id="printNotice">ASCII motion and A/B transitions run in ASCII mode. Print styles texture the current source; switch back to ASCII to use character choreography.</p>
 <label class="field"><span>Find an effect</span><input id="printSearch" type="text" placeholder="Search dots, lines, Atkinson…"></label>
 <div id="printChoices" class="print-choices" role="group" aria-label="Print effects"></div>
 <div id="printTextureSliders"></div>
 <label class="field"><span>Colour treatment</span><select id="printColour"><option value="source">Retain source colour</option><option value="duotone">Ink & paper</option></select></label>
 <div class="row"><label class="field">Ink <input id="printInk" type="color" value="#18181b"></label><label class="field">Paper <input id="printPaper" type="color" value="#ece8e1"></label></div>
 <button id="printReset" type="button">Return to ASCII</button>
 <p class="note">Dot spacing stays consistent between preview and export. Smaller grain costs more on video. Text and HTML export remain ASCII.</p></section>`);
 for(const [name,list] of groups){el('printChoices').insertAdjacentHTML('beforeend',`<div class="print-group">${name}</div>${list.map(([id,label])=>`<button type="button" data-print="${id}" aria-pressed="false">${label}</button>`).join('')}`);}
 const style=document.createElement('style');style.textContent='.print-choices{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:12px 0 20px;max-height:280px;overflow:auto}.print-choices button{font:11px monospace;text-align:left;min-height:40px;padding:8px}.print-choices button[aria-pressed=true]{border-color:var(--accent);color:var(--accent)}.print-group{grid-column:1/-1;font:10px monospace;color:var(--muted);padding:12px 0 5px}';document.head.appendChild(style);
 el('adjustColorSliders').insertAdjacentHTML('beforeend','<div id="printHueSliders"></div>');
 el('adjustLightSliders').insertAdjacentHTML('beforeend','<div id="printLevelSliders"></div><p class="note">Black & white levels remap the source range. These controls also apply to ASCII.</p>');
 const added={printStrength:[1,0,1,.01,'Effect mix','printTextureSliders'],printPitch:[7,2,32,1,'Dot / line spacing','printTextureSliders'],printAngle:[45,0,180,1,'Pattern angle','printTextureSliders'],printLevels:[2,2,12,1,'Tone count','printTextureSliders'],printHue:[0,-180,180,1,'Hue · degrees','printHueSliders'],printBlack:[0,0,254,1,'Black level','printLevelSliders'],printWhite:[255,1,255,1,'White level','printLevelSliders'],printMid:[0,-2,2,.05,'Midtones','printLevelSliders']};
 for(const [id,def] of Object.entries(added)){defs[id]=def;const [v,min,max,step,label,parent]=def;el(parent).insertAdjacentHTML('beforeend',`<label class="field"><span>${label}<output id="${id}Value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`);}
 const addedIds=[...Object.keys(added),'printStyle','printColour','printInk','printPaper'];
 for(const id of addedIds){ids.push(id);defaults[id]=el(id).value;}
 el('dither').insertAdjacentHTML('beforeend',groups.slice(0,2).map(([name,list])=>`<optgroup label="${name}">${list.filter(([id])=>id!=='pocket').map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</optgroup>`).join(''));
 let rasterKey='',toneKey='',toneData,toneSource;
 function invalidate(){rasterKey='';toneKey='';cellGridCache=null;pairCache=null;packetCache=null;glyphLayerKey='';analysisKey='';dirty=true;}
 function sync(){for(const b of document.querySelectorAll('[data-print]'))b.setAttribute('aria-pressed',String(b.dataset.print===el('printStyle').value));el('printNotice').hidden=el('printStyle').value==='ascii';}
 for(const id of addedIds){const control=el(id);control.addEventListener('pointerdown',()=>editStart=snapshot());control.addEventListener('focus',()=>{if(!editStart)editStart=snapshot()});control.addEventListener('input',()=>{if(id==='printBlack'&&+el('printBlack').value>=+el('printWhite').value)el('printWhite').value=+el('printBlack').value+1;if(id==='printWhite'&&+el('printWhite').value<=+el('printBlack').value)el('printBlack').value=+el('printWhite').value-1;invalidate();updateUI();sync();});control.addEventListener('change',()=>{commit(editStart||defaults);editStart=null;invalidate();updateUI();sync();});}
 for(const b of document.querySelectorAll('[data-print]'))b.onclick=()=>{const before=snapshot();el('printStyle').value=b.dataset.print;invalidate();updateUI();sync();commit(before);status(b.textContent+' ready · tweak spacing, colour and mix.');};
 el('printSearch').oninput=()=>{const search=el('printSearch').value.toLowerCase();for(const b of document.querySelectorAll('[data-print]'))b.hidden=!b.textContent.toLowerCase().includes(search);for(const heading of el('printChoices').querySelectorAll('.print-group'))heading.hidden=!!search;};
 el('printReset').onclick=()=>{const before=snapshot();el('printStyle').value='ascii';invalidate();updateUI();sync();commit(before);};
 el('photoReset').onclick=()=>{const before=snapshot(),patch={photoEnabled:true};for(const id of ['exposure','highlights','shadowsLift','temperature','tint','saturation','vibrance','curveDark','curveMid','curveLight','sharpness','filmGrain','printBlack','printWhite','printMid','printHue'])patch[id]=defaults[id];restore({...settings(),...patch});commit(before);status('Image adjustments reset.');};
 const sampleBefore=samplePicture;
 samplePicture=function(w,h){const data=sampleBefore(w,h),s=settings();if(!s.photoEnabled)return data;const key=[rawKey,w,h,s.printBlack,s.printWhite,s.printHue,s.printMid].join('|');if(toneKey!==key||toneSource!==data){toneData=grade(data,s);toneKey=key;toneSource=data;}return toneData;};
 const cellsBefore=baseCells;
 baseCells=function(data,s,w,h,t,exporting){if(rawKey.startsWith('keyB-')&&s.photoEnabled)data=grade(data,s);return cellsBefore(data,s,w,h,t,exporting);};
 const restoreBefore=restore;restore=function(s){restoreBefore(s);invalidate();sync();};
 const canvas=document.createElement('canvas'),q=canvas.getContext('2d',{willReadFrequently:true});
 root.asciiPrintRender=function(t,exporting){
  const s=settings();if(s.printStyle==='ascii'||s.bypass||comparing||(type==='video'||type==='camera')&&video.readyState<2)return;
  const stamp=type==='video'?video.currentTime:type==='camera'?Math.floor(performance.now()/33):sourceRevision+'|'+el('demoScene').value;
  // A bounded 1-megapixel raster keeps grain useful on mobile and at high export sizes.
  const factor=Math.min(1,960/out.width,Math.sqrt(1000000/(out.width*out.height))),w=Math.max(2,Math.round(out.width*factor)),h=Math.max(2,Math.round(out.height*factor));
  const key=[stamp,w,h,s.fit,s.flip,...ids.map(id=>s[id])].join('|');
  if(key!==rasterKey){canvas.width=w;canvas.height=h;drawSource(q,w,h);let data=q.getImageData(0,0,w,h).data;data=root.asciiPhotoProcess?root.asciiPhotoProcess(data,w,h,s,'print|'+stamp+'|'+s.fit+'|'+s.flip):data;if(s.photoEnabled)data=grade(data,s);const scaled={...s,printPitch:Math.max(2,+s.printPitch*w/960)};if(s.printStyle==='coarse')scaled.printPitch*=2;const result=texture(data,w,h,s.printStyle,scaled);q.putImageData(new ImageData(result,w,h),0,0);rasterKey=key;}
  const target=out.getContext('2d');target.save();target.clearRect(0,0,out.width,out.height);if(!s.transparent){target.fillStyle=s.bg;target.fillRect(0,0,out.width,out.height);}target.imageSmoothingEnabled=false;target.drawImage(canvas,0,0,out.width,out.height);target.restore();if(!exporting)el('metrics').textContent=s.printStyle.toUpperCase()+' / PRINT TEXTURE';
 };
 // Dynamic controls must exist before reading autosave, including extended ASCII dither options.
 try{const saved=JSON.parse(localStorage.getItem('ascii-studio-v10'));if(saved){restore({...settings(),...saved});el('previewQuality').value='auto';}}catch{}
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showPanel(b.dataset.tab));
 updateUI();sync();
})(typeof window==='undefined'?globalThis:window);
