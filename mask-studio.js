(function installMaskStudio(){
'use strict';
const $m=id=>document.getElementById(id);
const output=$m('out'),stage=$m('drop'),panel=$m('panel-split');
if(!output||!stage||!panel||typeof render!=='function')return;
const controls=document.createElement('div');
controls.className='mask-studio';
controls.innerHTML=`
  <div class="mask-kicker">04 / CREATIVE MASKING</div>
  <label class="field"><span>Division method</span><select id="maskMode">
    <option value="line">Classic vertical line</option>
    <option value="brush">Brush selection</option>
    <option value="organic">Generated irregular edge</option>
    <option value="contrast">Contrast-based selection</option>
    <option value="hybrid">Hybrid · Auto + Brush</option>
  </select></label>
  <div id="maskHybridGroup" hidden><label class="field"><span>Hybrid foundation</span>
    <select id="maskHybridBase"><option value="contrast">Contrast selection</option>
    <option value="organic">Irregular boundary</option></select></label></div>
  <div id="maskBrushGroup" hidden>
    <div class="mask-choice"><button id="maskReveal" class="mask-current" type="button">✎ Reveal image</button>
    <button id="maskErase" type="button">⌫ Restore ASCII</button></div>
    <div id="maskBrushSliders"></div>
    <div class="mask-choice"><button type="button" id="maskClear">Clear painting</button>
    <button type="button" id="maskFill">Fill selection</button></div>
    <p class="note">Paint directly on the canvas with a finger, mouse or stylus.</p>
  </div>
  <div id="maskOrganicGroup" hidden>
    <div id="maskOrganicSliders"></div>
    <button type="button" class="mask-wide" id="maskReroll">↝ Generate variation</button>
  </div>
  <div id="maskContrastGroup" hidden>
    <label class="field"><span>Contrast detection</span><select id="maskDetect">
      <option value="subject">Contrast from background</option><option value="details">Fine detail and edges</option>
    </select></label>
    <div id="maskContrastSliders"></div>
  </div>
  <label class="check" id="maskRefineRow" hidden>
    <input id="maskRefine" type="checkbox"> Brush-refine this automatic mask
  </label>
  <label class="check" id="maskInvertRow" hidden>
    <input id="maskInvert" type="checkbox"> Invert selection
  </label>
  <div id="splitRevealSliders"></div>
  <label class="check"><input id="splitAnimate" type="checkbox"> Animate ASCII into selection</label>
  <button type="button" class="mask-wide" id="splitReplay">▶ Replay reveal</button>
  <p class="note">Starts with the full source image. ASCII sweeps into its selected area and stops at your boundary. Use Play / Pause to control playback.</p>
  <input type="checkbox" id="maskFillAll" hidden>
  <p class="mask-message" id="maskMessage" role="status">Choose a selection to start creating.</p>`;
const anchor=$m('splitSliders');
anchor.parentElement.insertBefore(controls,anchor);
const style=document.createElement('style');
style.textContent=`
 .mask-studio{border:1px solid #465a46;background:linear-gradient(140deg,#202c26,#242329);
  border-radius:10px;padding:16px 13px 12px;margin:18px 0;box-shadow:inset 0 1px #a8c18b24}
 .mask-kicker{font:10px monospace;color:#dcf2a8;letter-spacing:1.3px;margin-bottom:14px}
 .mask-studio .field{margin:14px 0}
 .mask-studio .mask-choice{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:11px 0}
 .mask-studio .mask-choice button{min-height:40px;padding:8px 6px;font-size:10px}
 .mask-studio button.mask-current{color:#ddf5b6;background:#34482c;border-color:#94bc77}
 .mask-studio .mask-wide{width:100%;margin:8px 0 13px}
 .mask-studio .mask-message{border-top:1px solid #475247;padding-top:11px;
  color:#b7cba8;font:10px/1.6 monospace}
 .mask-studio [hidden]{display:none!important}
 .mask-cursor{position:absolute;pointer-events:none;z-index:8;border:1.5px solid #eaffc5;
  border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 1px 1px #20241b,0 0 13px #e7ffbd55;display:none}
 @media(max-width:760px){.mask-studio{padding:13px 12px}.mask-studio .mask-choice button{min-height:44px}}
`;
document.head.appendChild(style);
const definitions={
  splitRevealDuration:[3,.5,15,.1,'Reveal duration (seconds)','splitRevealSliders'],
  splitSelectionFeather:[0,0,80,1,'Selection feather (pixels at 1080p)','splitRevealSliders'],
  maskBrushSize:[20,2,90,1,'Brush diameter (% of image height)','maskBrushSliders'],
  maskBrushSoftness:[.5,0,1,.05,'Brush softness','maskBrushSliders'],
  maskBrushOpacity:[1,.1,1,.05,'Brush opacity','maskBrushSliders'],
  maskSeed:[37,0,999,1,'Random seed','maskOrganicSliders'],
  maskRoughness:[.48,0,1,.02,'Edge roughness','maskOrganicSliders'],
  maskFrequency:[5,1,18,.5,'Variation frequency','maskOrganicSliders'],
  maskJitter:[.4,0,1,.02,'Fine jitter','maskOrganicSliders'],
  maskThreshold:[.2,0,1,.01,'Contrast threshold','maskContrastSliders'],
  maskSensitivity:[1.25,.2,4,.05,'Sensitivity','maskContrastSliders'],
  maskExpand:[0,-8,10,1,'Expand / contract','maskContrastSliders'],
  maskSoftEdge:[4,0,20,1,'Mask feather (pixels)','maskContrastSliders']
};
for(const [id,def] of Object.entries(definitions)){
  defs[id]=def;
  const [value,min,max,step,label,parent]=def;
  $m(parent).insertAdjacentHTML('beforeend',
    `<label class="field"><span>${label}<output id="${id}Value">${value}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`);
}
const idsNew=[...Object.keys(definitions),'maskMode','maskHybridBase','maskDetect','maskRefine','maskInvert','maskFillAll','splitAnimate'];
const maskDefaults={};
for(const id of idsNew){
  ids.push(id);const control=$m(id);
  maskDefaults[id]=control.type==='checkbox'?control.checked:control.value;
  defaults[id]=maskDefaults[id];
}
const clamp=v=>Math.min(1,Math.max(0,v));
const smoother=v=>{const t=clamp(v);return t*t*(3-2*t)};
const between=(a,b,v)=>smoother((v-a)/Math.max(.000001,b-a));
const noiseHash=(a,b,seed)=>{
  let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(seed|0,1442695041))|0;
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967295;
};
const noise=(p,f,seed)=>{
  const v=p*f,i=Math.floor(v),t=smoother(v-i);
  return ((1-t)*noiseHash(i,19,seed)+t*noiseHash(i+1,19,seed))*2-1;
};
let strokes=[],activeStroke=null,strokeBefore=null,eraser=false,painting=false,maskDirty=true,maskKey='';
const mask=document.createElement('canvas'),ctx=mask.getContext('2d',{willReadFrequently:true});
const maskSample=document.createElement('canvas'),sampleCtx=maskSample.getContext('2d',{willReadFrequently:true});
const sourceCanvas=document.createElement('canvas'),sourceCtx=sourceCanvas.getContext('2d');
const layer=document.createElement('canvas'),layerCtx=layer.getContext('2d');
const pixels=document.createElement('canvas'),pixelsCtx=pixels.getContext('2d',{willReadFrequently:true});
const cached=document.createElement('canvas'),cachedCtx=cached.getContext('2d');
const dest=output.getContext('2d');
const revealMask=document.createElement('canvas'),revealCtx=revealMask.getContext('2d');
const asciiLayer=document.createElement('canvas'),asciiCtx=asciiLayer.getContext('2d');
const softMask=document.createElement('canvas'),softCtx=softMask.getContext('2d');
let sourceCacheKey='',pixelCacheKey='',renderedSourceKey='';
const cursor=document.createElement('div');cursor.className='mask-cursor';stage.appendChild(cursor);
function mode(){return $m('maskMode').value}
function baselineMode(){return mode()==='hybrid'?$m('maskHybridBase').value:mode()}
function brushEnabled(){
  return $m('splitEnabled').checked&&!comparing&&(mode()==='brush'||mode()==='hybrid'||
    (mode()!=='line'&&$m('maskRefine').checked));
}
function showEditor(){
  const m=mode(),base=baselineMode(),paint=m==='brush'||m==='hybrid'||$m('maskRefine').checked;
  $m('maskBrushGroup').hidden=!(paint&&m!=='line');
  $m('maskOrganicGroup').hidden=base!=='organic';
  $m('maskContrastGroup').hidden=base!=='contrast';
  $m('maskHybridGroup').hidden=m!=='hybrid';
  $m('maskRefineRow').hidden=m==='brush'||m==='line'||m==='hybrid';
  $m('maskInvertRow').hidden=m==='line';
  $m('splitPosition').closest('label').hidden=m==='brush'||base==='contrast';
  $m('splitFeather').closest('label').hidden=m!=='line';
  $m('maskReveal').classList.toggle('mask-current',!eraser);
  $m('maskErase').classList.toggle('mask-current',eraser);
  $m('maskReveal').setAttribute('aria-pressed',String(!eraser));
  $m('maskErase').setAttribute('aria-pressed',String(eraser));
  $m('maskMessage').textContent=
    m==='line'?'Drag the divider on the canvas.':
    m==='brush'?'Paint the image area. Erase to restore ASCII.':
    m==='organic'?'A stable seeded irregular edge. Regenerate to explore.':
    m==='contrast'?'Contrast automatically chooses image regions; tune threshold and detail.':
    'Hybrid: generated selection, refined by your strokes.';
  output.style.cursor=brushEnabled()?'crosshair':'';
  output.style.touchAction=brushEnabled()?'none':'auto';
  if(!brushEnabled())cursor.style.display='none';
  const handle=document.querySelector('.split-handle');
  if(handle)handle.style.display=m==='line'?'':'none';
  for(const badge of document.querySelectorAll('.split-badge'))badge.style.display=m==='line'?'':'none';
}
function sizeMask(){
  const w=Math.max(32,Math.min(512,Math.round(output.width/2)));
  const h=Math.max(32,Math.round(w*output.height/Math.max(1,output.width)));
  if(mask.width!==w||mask.height!==h){mask.width=w;mask.height=h;maskDirty=true}
  return [w,h];
}
function stamp(x,y,r,soft,alpha,erase){
  ctx.save();ctx.globalCompositeOperation=erase?'destination-out':'source-over';ctx.globalAlpha=alpha;
  const g=ctx.createRadialGradient(x,y,Math.max(0,r*(1-soft)),x,y,r);
  g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();
}
function paintStroke(stroke){
  if(!stroke.points.length)return;
  const r=Math.max(.7,stroke.radius*mask.height/2),points=stroke.points;
  let previous=points[0];
  stamp(previous[0]*mask.width,previous[1]*mask.height,r,stroke.softness,stroke.opacity,stroke.erase);
  for(let i=1;i<points.length;i++){
    const next=points[i],dx=(next[0]-previous[0])*mask.width,dy=(next[1]-previous[1])*mask.height;
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/Math.max(1,r*.35)));
    for(let k=1;k<=steps;k++){
      const t=k/steps;
      stamp((previous[0]+(next[0]-previous[0])*t)*mask.width,
        (previous[1]+(next[1]-previous[1])*t)*mask.height,r,stroke.softness,stroke.opacity,stroke.erase);
    }
    previous=next;
  }
}
function organicMask(w,h,s){
  const image=ctx.createImageData(w,h),data=image.data;
  const seed=+s.maskSeed,f=+s.maskFrequency;
  const feather=Math.max(.75,+s.maskSoftEdge*w/512);
  for(let y=0;y<h;y++){
    const yn=(y+.5)/h;
    const wave=noise(yn,f*.55,seed)*.22 +
      noise(yn,f*2,seed+13)*.11*+s.maskJitter +
      noise(yn,f*6,seed+103)*.03*+s.maskJitter;
    const edge=(+s.splitPosition+wave*+s.maskRoughness)*w;
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      data[i]=data[i+1]=data[i+2]=255;
      data[i+3]=Math.round(255*between(edge-feather,edge+feather,x+.5));
    }
  }
  ctx.putImageData(image,0,0);
}
function contrastMask(w,h,s){
  if(maskSample.width!==w||maskSample.height!==h){maskSample.width=w;maskSample.height=h}
  drawSource(sampleCtx,w,h);
  const data=sampleCtx.getImageData(0,0,w,h).data;
  const bg=[0,0,0],edgeCorners=Math.max(3,Math.floor(Math.min(w,h)*.09));
  let count=0;
  const luminance=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,j=i*4;
    luminance[i]=(.2126*data[j]+.7152*data[j+1]+.0722*data[j+2])/255;
    if((x<edgeCorners||x>=w-edgeCorners)&&(y<edgeCorners||y>=h-edgeCorners)){
      bg[0]+=data[j];bg[1]+=data[j+1];bg[2]+=data[j+2];count++;
    }
  }
  bg.forEach((v,i)=>bg[i]=v/Math.max(1,count));
  let alpha=new Uint8ClampedArray(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,j=i*4;
    const dx=luminance[y*w+Math.min(w-1,x+1)]-luminance[y*w+Math.max(0,x-1)];
    const dy=luminance[Math.min(h-1,y+1)*w+x]-luminance[Math.max(0,y-1)*w+x];
    const edges=Math.hypot(dx,dy);
    const distance=Math.hypot(data[j]-bg[0],data[j+1]-bg[1],data[j+2]-bg[2])/442;
    const value=s.maskDetect==='details'?edges*1.9:distance*.88+edges*.8;
    alpha[i]=data[j+3]<16?0:Math.round(255*between(+s.maskThreshold-.08,+s.maskThreshold+.08,value*+s.maskSensitivity));
  }
  let target=new Uint8ClampedArray(w*h);
  const grow=Math.trunc(+s.maskExpand);
  for(let step=0;step<Math.abs(grow);step++){
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      let v=alpha[y*w+x];
      for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)
        for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){
          const v2=alpha[yy*w+xx];v=grow>0?Math.max(v,v2):Math.min(v,v2);
        }
      target[y*w+x]=v;
    }
    const tmp=alpha;alpha=target;target=tmp;
  }
  const image=ctx.createImageData(w,h);
  for(let i=0;i<alpha.length;i++){
    const j=i*4;image.data[j]=image.data[j+1]=image.data[j+2]=255;image.data[j+3]=alpha[i];
  }
  ctx.putImageData(image,0,0);
  if(+s.maskSoftEdge>0){
    const blurred=document.createElement('canvas');blurred.width=w;blurred.height=h;
    const bc=blurred.getContext('2d');bc.filter='blur('+Math.min(18,+s.maskSoftEdge/2)+'px)';
    bc.drawImage(mask,0,0);ctx.clearRect(0,0,w,h);ctx.drawImage(blurred,0,0);
  }
}
function lineMask(w,h,s){
  const image=ctx.createImageData(w,h);
  const feather=Math.max(.000001,+s.splitFeather*w/output.width);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    let a=between(+s.splitPosition*w-feather,+s.splitPosition*w+feather,x+.5);
    if(s.splitReverse)a=1-a;
    image.data[i]=image.data[i+1]=image.data[i+2]=255;image.data[i+3]=Math.round(a*255);
  }
  ctx.putImageData(image,0,0);
}
function buildMask(){
  const s=settings(),[w,h]=sizeMask();
  const frameKey=type==='video'?Math.floor(video.currentTime*5):type==='camera'?Math.floor(performance.now()/200):0;
  const relevant=[w,h,mode(),s.maskHybridBase,s.maskSeed,s.maskRoughness,s.maskFrequency,s.maskJitter,
    s.maskThreshold,s.maskSensitivity,s.maskExpand,s.maskSoftEdge,s.maskDetect,s.splitPosition,
    s.maskInvert,s.maskFillAll,s.splitReverse,s.splitFeather,s.fit,s.flip,s.ratio,sourceRevision,type,$m('demoScene').value,
    frameKey,strokes.length,activeStroke?.points.length||0].join('|');
  if(!maskDirty&&maskKey===relevant)return;
  maskKey=relevant;maskDirty=false;
  ctx.clearRect(0,0,w,h);
  if(s.maskFillAll)ctx.fillStyle='#fff',ctx.fillRect(0,0,w,h);
  else if(baselineMode()==='line')lineMask(w,h,s);
  else if(baselineMode()==='organic')organicMask(w,h,s);
  else if(baselineMode()==='contrast')contrastMask(w,h,s);
  for(const stroke of strokes)paintStroke(stroke);
  if(activeStroke)paintStroke(activeStroke);
  if(s.maskInvert){
    const data=ctx.getImageData(0,0,w,h);
    for(let i=3;i<data.data.length;i+=4)data.data[i]=255-data.data[i];
    ctx.putImageData(data,0,0);
  }
}
function sourceTexture(){
  const w=output.width,h=output.height;
  if(sourceCanvas.width!==w||sourceCanvas.height!==h){
    sourceCanvas.width=w;sourceCanvas.height=h;sourceCacheKey='';
  }
  const frameKey=type==='video'?Math.round(video.currentTime*30):type==='camera'?Math.floor(performance.now()/40):0;
  const key=[w,h,sourceRevision,type,frameKey,$m('ratio').value,$m('fit').value,$m('flip').checked,
    $m('demoScene').value].join('|');
  if(sourceCacheKey!==key){
    drawSource(sourceCtx,w,h);sourceCacheKey=key;pixelCacheKey='';
  }
  return key;
}
function pixelsTexture(sourceKey){
  const w=output.width,h=output.height,style=$m('splitStyle').value,size=+$m('splitPixelSize').value;
  if(layer.width!==w||layer.height!==h){layer.width=w;layer.height=h;pixelCacheKey=''}
  const key=sourceKey+'|'+style+'|'+size;
  if(key===pixelCacheKey)return;
  pixelCacheKey=key;layerCtx.clearRect(0,0,w,h);
  if(style==='real'){layerCtx.drawImage(sourceCanvas,0,0);return}
  const cols=Math.max(2,Math.round(w/size)),rows=Math.max(2,Math.round(h/size));
  if(pixels.width!==cols||pixels.height!==rows){pixels.width=cols;pixels.height=rows}
  pixelsCtx.imageSmoothingEnabled=true;pixelsCtx.drawImage(sourceCanvas,0,0,cols,rows);
  if(style==='retro'){
    const image=pixelsCtx.getImageData(0,0,cols,rows);
    for(let i=0;i<image.data.length;i+=4)for(let j=0;j<3;j++)
      image.data[i+j]=Math.round(image.data[i+j]/51)*51;
    pixelsCtx.putImageData(image,0,0);
  }
  if(style==='square'||style==='retro'){
    layerCtx.imageSmoothingEnabled=false;
    layerCtx.drawImage(pixels,0,0,w,h);layerCtx.imageSmoothingEnabled=true;
  }else{
    const image=pixelsCtx.getImageData(0,0,cols,rows).data;
    const cw=w/cols,ch=h/rows;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=(y*cols+x)*4;
      layerCtx.fillStyle=`rgb(${image[i]},${image[i+1]},${image[i+2]})`;
      layerCtx.beginPath();
      if(style==='dots')layerCtx.ellipse((x+.5)*cw,(y+.5)*ch,cw*.46,ch*.46,0,0,Math.PI*2);
      else{
        layerCtx.moveTo((x+.5)*cw,y*ch);
        layerCtx.lineTo((x+1)*cw,(y+.5)*ch);
        layerCtx.lineTo((x+.5)*cw,(y+1)*ch);
        layerCtx.lineTo(x*cw,(y+.5)*ch);
      }
      layerCtx.fill();
    }
  }
}
function blendMasked(t){
  const s=settings();buildMask();
  const sourceKey=sourceTexture();pixelsTexture(sourceKey);
  const w=output.width,h=output.height,mw=mask.width,mh=mask.height;
  for(const c of [asciiLayer,cached])if(c.width!==w||c.height!==h){c.width=w;c.height=h}
  for(const c of [revealMask,softMask])if(c.width!==mw||c.height!==mh){c.width=mw;c.height=mh}
  // The existing selection describes the image region; its complement is ASCII.
  const data=ctx.getImageData(0,0,mw,mh);
  const progress=s.splitAnimate?clamp(t/Math.max(.5,+s.splitRevealDuration)):1;
  const eased=smoother(progress);
  for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
    const i=(y*mw+x)*4;
    const sweep=progress<=0?0:progress>=1?1:
      1-between(eased-.025,eased+.025,(s.splitReverse?mw-x-.5:x+.5)/mw);
    data.data[i+3]=Math.round((255-data.data[i+3])*sweep);
  }
  revealCtx.putImageData(data,0,0);
  softCtx.clearRect(0,0,mw,mh);softCtx.save();
  softCtx.filter=+s.splitSelectionFeather>0?'blur('+ (+s.splitSelectionFeather*mh/1080)+'px)':'none';
  softCtx.drawImage(revealMask,0,0);softCtx.restore();
  asciiCtx.clearRect(0,0,w,h);asciiCtx.drawImage(output,0,0);
  asciiCtx.globalCompositeOperation='destination-in';
  asciiCtx.drawImage(softMask,0,0,w,h);asciiCtx.globalCompositeOperation='source-over';
  dest.clearRect(0,0,w,h);
  // Full original source is guaranteed at the first frame, even with pixel styling.
  dest.drawImage(s.splitAnimate?sourceCanvas:layer,0,0);
  dest.drawImage(asciiLayer,0,0);
  if(s.splitDivider&&baselineMode()==='organic'&&(!s.splitAnimate||progress>=1)){
    dest.save();dest.strokeStyle='rgba(245,239,202,.65)';dest.lineWidth=Math.max(1,w/1300);dest.beginPath();
    for(let y=0;y<=h;y+=Math.max(3,Math.ceil(h/220))){
      const p=y/h,f=+s.maskFrequency,seed=+s.maskSeed;
      const wave=noise(p,f*.55,seed)*.22+noise(p,f*2,seed+13)*.11*+s.maskJitter+noise(p,f*6,seed+103)*.03*+s.maskJitter;
      const x=(+s.splitPosition+wave*+s.maskRoughness)*w;
      if(y===0)dest.moveTo(x,y);else dest.lineTo(x,y);
    }
    dest.stroke();dest.restore();
  }
  if(s.splitDivider&&mode()==='line'&&(!s.splitAnimate||progress>=1)){
    dest.save();dest.fillStyle='#fff0bd';dest.fillRect(+s.splitPosition*w-1,0,Math.max(1,w/800),h);dest.restore();
  }
}
const precedingRender=render;
render=function(t,width,exporting){
  const useMask=$m('splitEnabled').checked&&!comparing;
  if(!useMask){precedingRender(t,width,exporting);showEditor();return;}
  $m('splitEnabled').checked=false;
  try{precedingRender(t,width,exporting)}
  finally{$m('splitEnabled').checked=true}
  if((type==='video'||type==='camera')&&video.readyState<2)return;
  try{blendMasked(t)}catch(error){$m('maskMessage').textContent='Mask rendering error: '+error.message}
  showEditor();
};
// Save strokes inside the existing project and undo history schema.
const precedingSnapshot=snapshot;
snapshot=function(){
  return {...precedingSnapshot(),_maskStrokes:strokes.map(s=>({...s,points:s.points.map(p=>p.slice())}))};
};
const precedingRestore=restore;
restore=function(state){
  precedingRestore(state);
  strokes=Array.isArray(state._maskStrokes)?state._maskStrokes.filter(s=>
    Array.isArray(s.points)&&s.points.length<=25000).slice(-120).map(s=>({
      erase:!!s.erase,opacity:clamp(Number(s.opacity)||1),
      radius:Math.min(1,Math.max(.002,Number(s.radius)||.2)),
      softness:clamp(Number(s.softness)||0),
      points:s.points.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))
        .slice(0,25000).map(p=>[clamp(p[0]),clamp(p[1])])
    })):[];maskDirty=true;sourceCacheKey='';pixelCacheKey='';
  showEditor();dirty=true;
};
$m('splitReplay').onclick=()=>{
  if(recording)return;
  $m('splitEnabled').checked=true;$m('splitAnimate').checked=true;
  frame=0;previous=null;running=true;comparing=false;syncPlay();changed();
};
$m('splitAnimate').addEventListener('change',()=>{
  if($m('splitAnimate').checked){frame=0;running=true;syncPlay()}
});
function changed(){maskDirty=true;dirty=true;updateUI();showEditor()}
for(const id of idsNew){
  const control=$m(id);
  control.addEventListener('pointerdown',()=>editStart=snapshot());
  control.addEventListener('focus',()=>{if(!editStart)editStart=snapshot()});
  control.addEventListener('input',changed);
  control.addEventListener('change',()=>{commit(editStart||defaults);editStart=null;changed()});
}
const originalUpdate=updateUI;
updateUI=function(){originalUpdate();showEditor()};
function setEraser(value){eraser=value;showEditor()}
$m('maskReveal').onclick=()=>setEraser(false);
$m('maskErase').onclick=()=>setEraser(true);
function resetStrokes(fill){
  const previous=snapshot();strokes=[];activeStroke=null;
  $m('maskFillAll').checked=fill;
  commit(previous);changed();
}
$m('maskClear').onclick=()=>resetStrokes(false);
$m('maskFill').onclick=()=>resetStrokes(true);
$m('maskReroll').onclick=()=>{
  const before=snapshot();
  $m('maskSeed').value=(+($m('maskSeed').value)+137)%1000;
  commit(before);changed();
};
function pointFromEvent(e){
  const r=output.getBoundingClientRect();
  return [clamp((e.clientX-r.left)/Math.max(1,r.width)),clamp((e.clientY-r.top)/Math.max(1,r.height))];
}
function drawCursor(e){
  if(!brushEnabled()){cursor.style.display='none';return}
  const r=output.getBoundingClientRect(),s=stage.getBoundingClientRect();
  const diameter=r.height*+$m('maskBrushSize').value/100;
  cursor.style.width=diameter+'px';cursor.style.height=diameter+'px';
  cursor.style.left=e.clientX-s.left+'px';cursor.style.top=e.clientY-s.top+'px';
  cursor.style.display='block';
}
output.addEventListener('pointerdown',e=>{
  if(!brushEnabled()||e.button!==0)return;
  e.preventDefault();painting=true;strokeBefore=snapshot();
  activeStroke={erase:eraser,radius:+$m('maskBrushSize').value/100,
    softness:+$m('maskBrushSoftness').value,opacity:+$m('maskBrushOpacity').value,
    points:[pointFromEvent(e)]};
  output.setPointerCapture(e.pointerId);drawCursor(e);maskDirty=true;dirty=true;
});
output.addEventListener('pointermove',e=>{
  if(brushEnabled())drawCursor(e);
  if(!painting||!activeStroke)return;
  e.preventDefault();
  const p=pointFromEvent(e),last=activeStroke.points[activeStroke.points.length-1];
  if(Math.hypot(p[0]-last[0],p[1]-last[1])>.001){
    activeStroke.points.push(p);maskDirty=true;dirty=true;
  }
});
function finishStroke(){
  if(!painting)return;painting=false;
  if(activeStroke)strokes.push(activeStroke);
  activeStroke=null;maskDirty=true;dirty=true;
  if(strokeBefore)commit(strokeBefore);
  strokeBefore=null;updateUI();
}
output.addEventListener('pointerup',finishStroke);
output.addEventListener('pointercancel',finishStroke);
output.addEventListener('lostpointercapture',finishStroke);
output.addEventListener('pointerleave',()=>{if(!painting)cursor.style.display='none'});
window.addEventListener('blur',()=>{if(painting)finishStroke()});
const resetSplit=$m('splitReset').onclick;
$m('splitReset').onclick=()=>{
  const before=snapshot();resetSplit();strokes=[];$m('maskMode').value='line';
  $m('maskInvert').checked=false;$m('maskRefine').checked=false;$m('maskFillAll').checked=false;
  commit(before);changed();
};
// Old project / device autosave may include brush strokes from this release.
try{
  const saved=JSON.parse(localStorage.getItem('ascii-studio-v10'));
  if(saved){
    for(const id of idsNew){
      if(!(id in saved))continue;const c=$m(id),value=saved[id];
      if(c.type==='checkbox')c.checked=!!value;
      else if(c.tagName==='SELECT'){if([...c.options].some(o=>o.value===String(value)))c.value=value}
      else if(c.type==='range'&&Number.isFinite(+value))c.value=Math.min(+c.max,Math.max(+c.min,+value));
    }
    if(Array.isArray(saved._maskStrokes)){
      strokes=saved._maskStrokes.filter(s=>Array.isArray(s.points)).slice(-120).map(s=>({
        erase:!!s.erase,opacity:clamp(Number(s.opacity)||1),
        radius:Math.min(1,Math.max(.002,Number(s.radius)||.2)),
        softness:clamp(Number(s.softness)||0),
        points:s.points.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))
          .slice(0,25000).map(p=>[clamp(p[0]),clamp(p[1])])
      }));
    }
  }
}catch(e){}
updateUI();maskDirty=true;dirty=true;
})();
