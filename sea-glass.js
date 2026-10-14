/* Sea Glass Pro: packet-space effects integrated with the existing export pipeline. */
(function(root){
'use strict';
const effects=[
 ['none','Clean Studio','CORE','Untreated character mapping'],['ocean','Ocean Wave','FLUID','Harmonic tidal displacement'],
 ['matrix','Matrix Rain','CODE','Falling columns and luminous heads'],['vortex','Vortex Swirl','WARP','Radial torsion around the centre'],
 ['blackhole','Black Hole','GRAV','Dark core and rotating accretion ring'],['glitch','Cyber Glitch','SYNC','Time-stepped horizontal tearing'],
 ['ripple','Ripple Pond','WAVE','Concentric waves from the pointer'],['liquid','Liquid Drift','FLOW','Organic two-axis flow field'],
 ['kaleido','Kaleidoscope','SYMM','Mirrored radial source sampling'],['sobelneon','Sobel Neon','EDGE','Directional source contours'],
 ['thermal','Thermal Vision','HEAT','Animated infrared colour map'],['halftone','Halftone Pulse','DOTS','Luminance-driven glyph sizes'],
 ['floyd','Error Diffusion','DITH','Floyd–Steinberg character quantization'],['pixelsort','Pixel Sort Melt','MELT','Sort bright column runs by luminance'],
 ['vhs','VHS Tracking','TAPE','Moving tape noise and jitter band'],['wind','Wind Shear','AERO','Directional turbulent gusts'],
 ['quake','Seismic Quake','SHKE','Time-stepped row and column shear'],['magnet','Cursor Magnet','PHYS','Pointer repulsion and orbital drift'],
 ['pulse','Bio Heartbeat','ZOOM','Rhythmic radial expansion'],['tunnel','Quantum Tunnel','3D','Polar source sampling and depth rings']
];
const clip=v=>Math.max(0,Math.min(1,v)),wrap=v=>((v%1)+1)%1;
const noise=(x,y)=>{const a=Math.sin(x*127.1+y*311.7)*43758.5453123;return a-Math.floor(a)};
function warp(id,u,v,t,s,pointer,ratio){
 const a=+s.seaIntensity,scale=+s.seaScale,chaos=+s.seaChaos; t*=+s.seaSpeed;
 let x=u,y=v,alpha=1,size=1;const dx=u-.5,dy=(v-.5)/ratio,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
 switch(id){
 case 'ocean': x+=Math.sin(v*10*scale+t*2.2)*.04*a;y+=Math.cos(u*8*scale+t*1.8)*.04*a;break;
 case 'vortex':{const z=angle+(1-Math.min(1,r*2))*a*3.2*Math.sin(t*.8);x=.5+Math.cos(z)*r;y=.5+Math.sin(z)*r*ratio;break;}
 case 'blackhole':{const z=angle+t*1.5*a/(r*3+.2),rr=r*(1-.28*a*Math.exp(-r*4));x=.5+Math.cos(z)*rr;y=.5+Math.sin(z)*rr*ratio;alpha=r<.07*a?0:1;size=1+Math.exp(-Math.pow((r-.11*a)*35,2))*.6*a;break;}
 case 'glitch':{const line=Math.floor(v*24*scale),tick=Math.floor(t*12);if(noise(line,tick)>1-a*.25)x+=(noise(line+3,tick)-.5)*.3*a*(.3+chaos);break;}
 case 'ripple':{const cx=pointer.active?pointer.x:.5,cy=pointer.active?pointer.y:.5,d=Math.hypot(u-cx,(v-cy)/ratio),wave=Math.sin(d*35*scale-t*6)*Math.exp(-d*3.5)*.04*a;x+=(u-cx)/(d+.001)*wave;y+=(v-cy)/(d+.001)*wave;break;}
 case 'liquid':x+=Math.sin(u*7*scale+t+Math.cos(v*6*scale-t))*.06*a;y+=Math.cos(v*7*scale-t+Math.sin(u*5*scale+t))*.06*a;break;
 case 'kaleido':{const sector=2*Math.PI/Math.max(2,Math.round(6*scale));let z=wrap((angle+t*.3)/sector)*sector;if(z>sector/2)z=sector-z;x=u+(.5+Math.cos(z)*r-u)*clip(a);y=v+(.5+Math.sin(z)*r*ratio-v)*clip(a);break;}
 case 'vhs':{const band=Math.abs(v-wrap(t*.25));x+=Math.sin(v*90+t*20)*.004*a;if(band<.08*scale)x+=(noise(Math.floor(v*400),Math.floor(t*20))-.5)*.18*a;break;}
 case 'wind':x-=Math.pow((Math.sin(v*12*scale+t*4)+1)/2,2)*.14*a;y+=Math.sin(u*18+v*8+t*3)*.008*a*chaos;break;
 case 'quake':x+=(noise(Math.floor(v*32),Math.floor(t*35))-.5)*.06*a;y+=(noise(Math.floor(u*32),Math.floor(t*35)+4)-.5)*.06*a;break;
 case 'pulse':{const beat=Math.pow(Math.max(0,Math.sin(t*4.5)),6)*a*.22;x=.5+dx*(1+beat);y=.5+(v-.5)*(1+beat);size+=beat;break;}
 case 'tunnel':x=u+(wrap(angle/(2*Math.PI)+.5)-u)*clip(a);y=v+(wrap(.15*scale/(r+.02)+t*.35)-v)*clip(a);alpha=1+(clip(r*7)-1)*clip(a);break;
 }
 if(id==='magnet'&&pointer.active&&+s.seaRadius>0){const mx=u-pointer.x,my=(v-pointer.y)/ratio,d=Math.hypot(mx,my),rad=+s.seaRadius;if(d<rad&&d>.001){const force=(1-d/rad)*a*.18,z=Math.atan2(my,mx)+t*2.5;x+=Math.cos(z)*force;y+=Math.sin(z)*force*ratio;}}
 return {x,y,alpha:clip(alpha),size:Math.max(.05,size)};
}
function luminance(c){const values=c[0]==='#'?[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)):(c.match(/[\d.]+/g)||[0,0,0]).slice(0,3).map(Number);return (.2126*values[0]+.7152*values[1]+.0722*values[2])/255;}
function sortedCells(cells,cols,rows,threshold){
 const result=cells.slice();
 for(let x=0;x<cols;x++){let start=0;while(start<rows){while(start<rows&&luminance(cells[start*cols+x].color)<threshold)start++;let end=start;while(end<rows&&luminance(cells[end*cols+x].color)>=threshold)end++;const run=[];for(let y=start;y<end;y++)run.push(cells[y*cols+x]);run.sort((a,b)=>luminance(a.color)-luminance(b.color));for(let y=start;y<end;y++)result[y*cols+x]=run[y-start];start=end+1;}}
 return result;
}
root.ASCIISeaGlass={effects,warp,sortedCells};
if(typeof module!=='undefined')module.exports=root.ASCIISeaGlass;
if(typeof document==='undefined')return;
const el=id=>document.getElementById(id),tabs=document.querySelector('.tabs'),scroll=document.querySelector('.panel-scroll');
if(!tabs||typeof render!=='function')return;
const style=document.createElement('style');style.textContent=`
:root{--bg:#04141c;--panel:#0a202b;--line:rgba(125,211,252,.2);--accent:#5eead4;--muted:#a7cad1;--ink:#ecfeff}
body{font-family:Inter,system-ui,sans-serif;background:radial-gradient(ellipse at 12% 15%,#0d3b4c 0%,#051923 50%,#020c12 100%);color:var(--ink)}
header,.inspector{background:rgba(10,32,43,.7);backdrop-filter:blur(24px) saturate(160%);border:1px solid var(--line);border-top-color:#a5f3fc40;box-shadow:0 18px 45px #020c1240}
header{height:64px;margin:12px 14px 0;padding:0 20px;border-radius:18px}.brandmark{background:linear-gradient(135deg,#5eead450,#38bdf820);font:700 22px monospace;letter-spacing:-3px;border:1px solid #a5f3fc40;border-radius:10px;padding:5px 8px}h1 span{color:var(--accent)}.edition{color:#a7f3d0;font-size:9px}.header-actions{flex-wrap:wrap}.header-actions button{padding:8px 11px}button.primary{background:linear-gradient(135deg,#2dd4bf55,#0ea5e955);color:#fff;border-color:var(--accent)}
.workspace{height:calc(100dvh - 76px);min-height:540px;grid-template-columns:minmax(0,1fr) 430px;gap:14px;padding:12px 14px 14px}.stage{padding:14px 16px;background:#0a202b88;border:1px solid var(--line);border-radius:20px;min-height:0;gap:12px}.inspector{border-radius:20px;overflow:hidden}.viewport{background:radial-gradient(ellipse,#0c2a3666,#020c12dd);border-color:#a5f3fc20;border-radius:12px}.canvas-label,.field output,.eyebrow{color:var(--accent)}h2{color:var(--ink)}.field,.check{color:#cffafecc}.note,#status,.canvas-hint{color:var(--muted)}.panel-scroll{padding:18px 16px;scrollbar-color:#5eead440 transparent}.field{margin:15px 0}.field>span{margin-bottom:7px}
button,select,input[type=text],input[type=number]{background:#12344288;color:var(--ink);border-color:var(--line);border-top-color:#a5f3fc35;border-radius:8px}button:hover{background:#1c4e6088;border-color:var(--accent)}.field select,.field input[type=text]{padding:8px 10px}.playbar #play{color:var(--accent);background:#123442;border-color:var(--line)}input[type=range],input[type=checkbox]{accent-color:var(--accent)}.source-import{background:#2da5af35;color:#a7f3d0;border-color:#5eead460}
.sea-pillars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:10px}.sea-pillars button{padding:10px 4px;font-size:12px}.sea-pillars button[aria-pressed=true],.tabs button.selected{background:linear-gradient(145deg,#2dd4bf44,#0ea5e930);border-color:var(--accent);color:#fff}.sea-pillars small{display:block;font-size:9px;color:var(--muted);margin-top:4px}.tabs{padding:0 10px 10px;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px}.tabs button{font-size:10px;color:var(--muted);min-height:32px}.inspector-heading{padding:14px 16px 4px}.sea-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}.sea-grid button{padding:10px;text-align:left;min-width:0}.sea-grid b{font-size:12px;display:block;color:#ecfeff}.sea-grid small{display:block;color:var(--muted);font-size:10px;line-height:1.5;margin-top:5px}.sea-grid em{float:right;font:8px monospace;color:#a7f3d0;background:#0004;padding:2px 4px;border-radius:4px}.sea-grid button[aria-pressed=true]{border-color:var(--accent);background:#2da5af40}.sea-group{background:#081c3880;border:1px solid var(--line);padding:12px;border-radius:12px;margin:14px 0}.sea-group summary{color:#a7f3d0}.sea-shortcuts{display:flex;gap:5px;flex-wrap:wrap;margin:12px 0}.sea-shortcuts button{font-size:11px}.inspector-footer{color:var(--muted)}
@media(min-width:1600px){.workspace{grid-template-columns:minmax(0,1fr) 440px}}@media(max-width:1100px){.workspace{grid-template-columns:minmax(0,1fr) 350px}.stage{padding:12px}}
@media(max-width:760px){header{height:auto;min-height:68px;padding:10px 12px;margin:8px;gap:8px;flex-wrap:wrap}.header-actions{gap:5px;width:100%}.header-actions button{font-size:11px;padding:7px 9px}.divider{display:none}.workspace{height:auto;min-height:0;display:flex;flex-direction:column;padding:4px 8px 10px;gap:10px}.stage{padding:10px;gap:10px}.viewport{height:42dvh;min-height:230px}canvas#out{max-height:40dvh}.inspector{min-height:440px;overflow:visible}.tabs{position:static}.panel-scroll{overflow:visible;padding:18px 14px}.sea-pillars{position:static}.sea-grid b{font-size:11px}.playbar{flex-wrap:wrap}.playbar input{min-width:100px}.canvas-hint{font-size:10px}}
`;document.head.appendChild(style);
document.title='ASCII STUDIO // SEA GLASS PRO';document.querySelector('.edition').textContent='SEA GLASS PRO';
tabs.insertAdjacentHTML('afterbegin','<button data-tab="sea" aria-controls="panel-sea" aria-pressed="false">Engines</button>');
const pillars=document.createElement('nav');pillars.className='sea-pillars';pillars.setAttribute('aria-label','Studio pillars');pillars.innerHTML='<button data-pillar="effects" aria-pressed="true">✦ Effects<small>Engines & motion</small></button><button data-pillar="character" aria-pressed="false">Aa Character<small>Ramps & fonts</small></button><button data-pillar="settings" aria-pressed="false">⚙ Settings<small>Adjust & export</small></button>';tabs.before(pillars);
scroll.insertAdjacentHTML('afterbegin',`<section id="panel-sea" data-panel="sea" hidden aria-label="Sea Glass effect engines"><div class="panel-intro"><span class="eyebrow">SEA GLASS / 20 ENGINES</span><h2>Make it flow.</h2><p class="note">Choose an engine, tune its intensity and export your image or video.</p></div><label class="field"><span>Active engine</span><select id="seaEffect">${effects.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><div class="sea-grid">${effects.map(([id,name,tag,desc])=>`<button data-sea="${id}" aria-pressed="false"><em>${tag}</em><b>${name}</b><small>${desc}</small></button>`).join('')}</div><details class="sea-group" open><summary>Physics & dynamics</summary><div id="seaDynamics"></div></details><details class="sea-group"><summary>Grid & typography</summary><div id="seaGeometry"></div><label class="check"><input id="seaBold" type="checkbox">Bold glyphs</label><label class="check"><input id="seaInvertRamp" type="checkbox">Invert ramp order</label><label class="check"><input id="seaBrick" type="checkbox">Brick offset rows</label></details><div class="sea-shortcuts"><button id="seaPalette">Apply Sea Glass palette</button><button id="seaNeutral">Clear engine</button></div><p class="note" id="seaNotice"></p></section>`);
const added={seaIntensity:[.65,0,2,.01,'Intensity','seaDynamics'],seaSpeed:[1,0,3,.05,'Temporal speed','seaDynamics'],seaScale:[1,.1,4,.05,'Spatial scale','seaDynamics'],seaChaos:[.25,0,1,.01,'Turbulence','seaDynamics'],seaRadius:[.35,0,1,.01,'Pointer radius','seaDynamics'],seaAspect:[1,.5,1.8,.01,'Cell aspect ratio','seaGeometry'],seaRotate:[0,-180,180,1,'Glyph rotation · degrees','seaGeometry'],seaJitter:[0,0,1,.01,'Position scatter','seaGeometry']};
for(const [id,d] of Object.entries(added)){defs[id]=d;const [v,min,max,step,label,parent]=d;el(parent).insertAdjacentHTML('beforeend',`<label class="field"><span>${label}<output id="${id}Value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`);}
const extra=[...Object.keys(added),'seaEffect','seaInvertRamp','seaBrick','seaBold'];
for(const id of extra){ids.push(id);const input=el(id);defaults[id]=input.type==='checkbox'?input.checked:input.value;input.addEventListener('pointerdown',()=>editStart=snapshot());input.addEventListener('focus',()=>{if(!editStart)editStart=snapshot()});input.addEventListener('input',()=>{glyphLayerKey='';cellGridCache=null;updateUI()});input.addEventListener('change',()=>{commit(editStart||defaults);editStart=null;glyphLayerKey='';cellGridCache=null;updateUI()});}
function apply(patch){if(recording)return status('Stop exporting before changing settings.');const before=snapshot();restore({...snapshot(),...patch});commit(before);}
for(const b of document.querySelectorAll('[data-sea]'))b.onclick=()=>{apply({seaEffect:b.dataset.sea,printStyle:'ascii',bypass:false});status(b.querySelector('b').textContent+' active · use Play and the shared timeline.');};
el('seaPalette').onclick=()=>apply({colorMode:'gradient',fg:'#5eead4',shadow:'#124155',bg:'#031117'});
el('seaNeutral').onclick=()=>apply({seaEffect:'none',seaRotate:0,seaJitter:0,seaInvertRamp:false,seaBrick:false});
const rampSets=[['Classic Standard',' .:-=+*#%@'],['Ultra Detailed',' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'],['Solid Block Shades',' ░▒▓█'],['Matrix Katakana',' ｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'],['Devanagari Script',' .·अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ'],['Braille Tactile',' ⠁⠃⠇⠏⠟⠿⡿⣿'],['Binary Stream',' 01'],['Hexadecimal Dump',' 0123456789ABCDEF'],['Minimalist Dots',' ·•●'],['Geometric Circles',' ·∘○◌◍◎●◉⬤'],['Box Drawing',' ─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬'],['Cross Hatching',' .-/\\|X#█'],['Math & Logic',' ∙÷±≈≠≤≥∞∑∏∫√∆∇∈∩∪⊂⊃⊕⊗'],['Directional Arrows',' ·←↑→↓↔↕↖↗↘↙⇐⇑⇒⇓⇔'],['Ancient Runes',' ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'],['Studio Signature',' .,:;i1tfLCG08@']];
const rampField=document.createElement('label');rampField.className='field';rampField.innerHTML='<span>Sea Glass · 16 character ramps</span><select id="seaRamp"><option value="">Choose a palette</option>'+rampSets.map(([name],i)=>`<option value="${i}">${name}</option>`).join('')+'</select>';el('charRamp').closest('label').after(rampField);
el('seaRamp').onchange=()=>{if(el('seaRamp').value!=='')apply({ramp:rampSets[+el('seaRamp').value][1]});el('seaRamp').value='';};
for(const [value,label] of [['"JetBrains Mono", monospace','JetBrains Mono'],['"Space Mono", monospace','Space Mono'],['Inter, sans-serif','Inter'],['system-ui, sans-serif','System Sans']]){const option=document.createElement('option');option.value=value;option.textContent=label;el('font').appendChild(option);}
const copy=document.createElement('button');copy.id='seaCopy';copy.textContent='Copy ASCII';document.querySelector('.header-actions').appendChild(copy);copy.onclick=async()=>{try{render(frame);await navigator.clipboard.writeText(lastText);status('ASCII copied.');}catch(e){status('Clipboard unavailable. Use Export → Save text.');}};
// Preserve every existing tab; the three pillars are navigation shortcuts.
const groups={effects:['sea','motion','print','sequence'],character:['type'],settings:['source','look','adjust','crt','split','export','gallery']};
const showBefore=showPanel;showPanel=function(name){showBefore(name);const group=Object.keys(groups).find(g=>groups[g].includes(name));for(const b of pillars.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.pillar===group));};
for(const b of pillars.querySelectorAll('button'))b.onclick=()=>showPanel(groups[b.dataset.pillar][0]);
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showPanel(b.dataset.tab));
let pointer={x:.5,y:.5,active:false};
el('out').addEventListener('pointermove',e=>{if(el('splitEnabled').checked||comparing)return;const r=out.getBoundingClientRect();pointer={x:clip((e.clientX-r.left)/r.width),y:clip((e.clientY-r.top)/r.height),active:true};dirty=true;});
el('out').addEventListener('pointerleave',()=>{pointer.active=false;dirty=true;});
const cellsBefore=baseCells;
baseCells=function(data,s,cols,rows,t,exporting){
 const id=s.bypass?'none':s.seaEffect;
 let patch=s;
 if(id==='floyd'&&+s.seaIntensity>0)patch={...patch,dither:'floyd'};
 if(id==='sobelneon'&&+s.seaIntensity>0)patch={...patch,mode:'edge',edge:Math.max(.1,+s.seaIntensity*3)};
 if(s.seaInvertRamp)patch={...patch,ramp:Array.from(s.ramp).reverse().join(''),calibrate:false};
 return cellsBefore(data,patch,cols,rows,t,exporting);
};
const packetsBefore=artPackets;
artPackets=function(grid,data,s,cols,rows,t,ratio,exporting){
 const packets=packetsBefore(grid,data,s,cols,rows,t,ratio,exporting),id=s.bypass?'none':s.seaEffect,a=+s.seaIntensity;
 const geometry=+s.seaRotate||+s.seaJitter||s.seaBrick;
 if((id==='none'||a===0||id==='floyd'||id==='sobelneon')&&!geometry)return packets;
 const sampled=['kaleido','tunnel','pixelsort'].includes(id)&&a>0,sorted=id==='pixelsort'?sortedCells(grid.cells,cols,rows,.15+.25*(1-clip(a))):null;
 // Sampling engines include blank destinations so previously empty cells can become visible.
 const source=sampled&&!s.sequence?grid.cells.map((p,i)=>({...p,i,u:(i%cols+.5)/cols,v:(Math.floor(i/cols)+.5)/rows})):packets;
 return source.map(p=>{
  const base=p.pos||movement(p.u,p.v,p.i,s.motionScope==='all'?1:analysis.mask[p.i]||0,t,s,ratio),w=warp(a>0?id:'none',p.u,p.v,t,s,pointer,ratio);
  let c=p.c,color=p.color,pos={...base,x:base.x+w.x-p.u,y:base.y+w.y-p.v,alpha:base.alpha*w.alpha,size:base.size*w.size};
  if(sampled){const x=Math.min(cols-1,Math.floor(wrap(w.x)*cols)),y=Math.min(rows-1,Math.floor(wrap(w.y)*rows));const cell=(sorted||grid.cells)[y*cols+x];c=cell.c;color=cell.color;pos={...base};}
  if(id==='matrix'&&a>0){const col=p.i%cols,row=Math.floor(p.i/cols),head=wrap(t*+s.seaSpeed*(.1+noise(col,4)*.3)+noise(col,0))*rows,dist=wrap((head-row)/rows)*rows,trail=Math.max(4,16*+s.seaScale),f=clip(1-dist/trail);pos.alpha*=clip(1-a*.6+f*a);if(f>0){const ramp=Array.from(s.ramp||'01');c=ramp[Math.floor(noise(col,row+Math.floor(t*+s.seaSpeed*8))*ramp.length)];color=dist<1.2?'#dcffe6':`rgb(40,${Math.round(90+f*165)},100)`;}}
  const lum=clip(luminance(color));
  if(id==='halftone'&&a>0)pos.size*=.25+lum*1.35*(a+.3)*(1+.08*Math.sin(t*+s.seaSpeed*3));
  if(id==='thermal'&&a>0){const heat=wrap(lum+t*+s.seaSpeed*.08),original=color[0]==='#'?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)):(color.match(/[\d.]+/g)||[0,0,0]).slice(0,3).map(Number),target=[clip(heat*2.2-.2)*255,Math.sin(heat*Math.PI)*240,Math.cos(heat*Math.PI*.5)*255];color=`rgb(${target.map((v,i)=>Math.round(original[i]+(v-original[i])*clip(a))).join(',')})`;}
  pos.angle+=+s.seaRotate*Math.PI/180;
  if(s.seaBrick&&Math.floor(p.i/cols)%2)pos.x+=.5/cols;
  if(+s.seaJitter){const tick=Math.floor(t*+s.seaSpeed*20);pos.x+=(noise(p.i,tick)-.5)*+s.seaJitter/cols*2;pos.y+=(noise(p.i,tick+4)-.5)*+s.seaJitter/rows*2;}
  return {...p,c,color,pos};
 });
};
const updateBefore=updateUI;updateUI=function(){updateBefore();for(const b of document.querySelectorAll('[data-sea]'))b.setAttribute('aria-pressed',String(b.dataset.sea===el('seaEffect').value));el('seaNotice').textContent=el('printStyle').value!=='ascii'?'Choose ASCII in Print to see character engines.':el('sequence').checked&&['kaleido','tunnel','pixelsort'].includes(el('seaEffect').value)?'Source sampling effects are applied to travelling character colours during A → B transitions.':'Exposure, colour, characters and optical finishes are in Settings.';};
// Geometry must invalidate the glyph layer even when the underlying cell grid is cached.
const renderBefore=render;render=function(t,width,exporting){const active=el('seaEffect').value!=='none'&&+el('seaIntensity').value>0&&!el('bypass').checked;if(active||+el('seaRotate').value||+el('seaJitter').value||el('seaBrick').checked)glyphLayerKey='';renderBefore(t,width,exporting);};
for(const slider of document.querySelectorAll('input[type=range]'))slider.addEventListener('dblclick',()=>{if(recording||!Object.hasOwn(defaults,slider.id))return;apply({[slider.id]:defaults[slider.id]});});
try{const saved=JSON.parse(localStorage.getItem('ascii-studio-v10'));if(saved){const patch=Object.fromEntries(extra.filter(id=>Object.hasOwn(saved,id)).map(id=>[id,saved[id]]));restore({...snapshot(),...patch});}}catch{}

// Focused redesign: Effects, Settings and Export are the entire workspace.
const hiddenUI=document.createElement('div');hiddenUI.hidden=true;hiddenUI.id='retiredStudioControls';document.body.appendChild(hiddenUI);
for(const name of ['source','motion','sequence','split','gallery'])hiddenUI.appendChild(el('panel-'+name));
for(const id of ['undo','redo','openSequence','smartSuggest','shareLink','preset','charRamp','save','load']){const control=el(id);if(control)control.hidden=true;}
el('preset').closest('label').hidden=true;el('charRamp').closest('label').hidden=true;el('smartSuggest').parentElement.hidden=true;
el('save').closest('details').querySelector('summary').textContent='Text export';
el('seaCopy').hidden=true;document.querySelector('.header-actions .divider').hidden=true;
document.querySelector('.canvas-tag').textContent='ASCII STUDIO / SEA GLASS';
document.querySelector('.inspector-heading>span').textContent='SEA GLASS PRO';
el('import').textContent='Load image / video';
el('status').textContent='Load an image or video. Choose an effect. Adjust and export.';const sourceLabel=el('sourceInfo');document.querySelector('.fieldbar').prepend(sourceLabel);
document.querySelector('.canvas-hint').hidden=true;
const settingsPanel=document.createElement('section');settingsPanel.id='panel-settings';settingsPanel.dataset.panel='settings';settingsPanel.hidden=true;scroll.appendChild(settingsPanel);
settingsPanel.innerHTML='<div class="panel-intro"><span class="eyebrow">ADJUSTABLE SETTINGS</span><h2>Shape the output.</h2></div>';
function fold(panel,label,open,parent){const details=document.createElement('details');details.className='sea-group';details.open=open;const title=document.createElement('summary');title.textContent=label;details.appendChild(title);panel.removeAttribute('data-panel');panel.hidden=false;panel.querySelector('.panel-intro')?.remove();details.appendChild(panel);parent.appendChild(details);}
for(const [name,label,open] of [['type','Characters & grid',true],['look','Colour & finish',false],['adjust','Exposure, tone & grading',false],['crt','Optical effects & CRT',false]])fold(el('panel-'+name),label,open,settingsPanel);
const frameSettings=document.createElement('details');frameSettings.className='sea-group';frameSettings.innerHTML='<summary>Framing & preview quality</summary>';settingsPanel.appendChild(frameSettings);
for(const id of ['ratio','fit','flip','previewQuality','previewFps']){const control=el(id);if(control)frameSettings.appendChild(control.closest('label'));}
// Print is another effect family rather than a separate workflow.
fold(el('panel-print'),'Print & dithering effects',false,el('panel-sea'));
const typography=el('seaGeometry').closest('details');settingsPanel.querySelector('details').appendChild(typography);
const basicSettings=document.createElement('div');basicSettings.className='sea-shortcuts';basicSettings.appendChild(el('reset'));settingsPanel.appendChild(basicSettings);el('reset').textContent='Reset all settings';
el('panel-export').querySelector('.panel-intro h2').textContent='Export.';
el('panel-export').querySelectorAll('.note')[0].textContent='PNG and video include your active effect and output adjustments. Text and HTML export the source character grid.';
const pngButton=document.createElement('button');pngButton.textContent='Export PNG';pngButton.className='primary';pngButton.onclick=()=>el('png').click();el('exportWidth').closest('label').after(pngButton);
// Only the three primary tabs remain; runtime controls are retained internally for compatibility.
pillars.remove();tabs.replaceChildren();
for(const [name,label] of [['sea','✦ Effects'],['settings','⚙ Settings'],['export','↓ Export']]){const b=document.createElement('button');b.dataset.tab=name;b.setAttribute('aria-controls','panel-'+name);b.textContent=label;b.onclick=()=>showPanel(name);tabs.appendChild(b);}
tabs.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
const simpleShow=showPanel;showPanel=function(name){const target=['sea','settings','export'].includes(name)?name:['print','motion','sequence'].includes(name)?'sea':'settings';simpleShow(target);};
// Discontinue hidden choreography/mask state, including settings restored by old links.
const retired={motion:'none',particles:'none',sequence:false,splitEnabled:false,splitAnimate:false,autoSuggest:false};
Object.assign(defaults,retired);
const retainedRestore=restore;restore=function(saved){retainedRestore({...saved,...retired});};
restore({...snapshot(),...retired});
el('demoScene').onchange=()=>{if(recording)return;useDemo();pivot=null;el('sourceInfo').textContent='Generated '+el('demoScene').value+' artwork';};
// Reset returns to a neutral image treatment and synchronizes every visible control.
const resetBefore=el('reset').onclick;el('reset').onclick=()=>{if(recording)return status('Stop exporting before resetting settings.');resetBefore();updateUI();status('Settings reset. Source media preserved.');};
if(document.fonts)document.fonts.ready.then(()=>{glyphCache.clear();glyphPages=[];glyphPageIndex=0;rampCache.clear();cellGridCache=null;glyphLayerKey='';dirty=true;});
updateUI();showPanel('sea');
})(typeof window==='undefined'?globalThis:window);
