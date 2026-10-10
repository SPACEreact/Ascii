(function installSplitView(){
  'use strict';
  const el=id=>document.getElementById(id),out=el('out'),stage=el('drop'),tabs=document.querySelector('.tabs'),panels=document.querySelector('.panel-scroll');
  if(!out||!stage||!tabs||!panels||typeof render!=='function')return;
  tabs.insertAdjacentHTML('beforeend','<button data-tab="split" aria-controls="panel-split" aria-pressed="false">Split View</button>');
  panels.insertAdjacentHTML('beforeend',`
  <section id="panel-split" data-panel="split" hidden aria-label="Split screen image compositor">
    <div class="panel-intro"><span class="eyebrow">PIXEL DARKROOM / 03</span><h2>Two worlds. One frame.</h2>
      <p class="note">Split live ASCII art against a real image or a pixelated version. Drag the divider on the canvas—even on a phone.</p></div>
    <label class="check split-master"><input type="checkbox" id="splitEnabled"> Enable split screen</label>
    <div class="split-sample"><span>ASCII</span><b></b><span>REAL / PIXEL</span></div>
    <label class="field"><span>Other side</span><select id="splitStyle">
      <option value="real">Original source image</option><option value="square">Square pixelation</option>
      <option value="retro">Retro reduced colours</option><option value="dots">Dot mosaic</option><option value="diamond">Diamond mosaic</option>
    </select></label>
    <div id="splitSliders"></div>
    <label class="check"><input id="splitReverse" type="checkbox"> Real / pixel on the left</label>
    <label class="check"><input id="splitDivider" type="checkbox" checked> Divider visible in export</label>
    <div class="edit-actions"><button id="splitHalf">50 / 50</button><button id="splitReset">Reset split</button></div>
    <p id="splitStatus" class="note">GPU rendering starts only when Split View is enabled. A Canvas fallback is available.</p>
  </section>`);
  const style=document.createElement('style');
  style.textContent=`
  .tabs{display:flex!important;grid-template-columns:none!important;flex-wrap:nowrap!important;overflow-x:auto;gap:5px;overscroll-behavior-x:contain;scrollbar-width:thin}
  .tabs button{flex:0 0 auto!important;white-space:nowrap;min-width:70px!important;padding:9px 11px!important;font-size:11px;touch-action:pan-x}
  .tabs button[data-tab=split]{color:#d6ecb2}.tabs button[data-tab=split].selected{color:#e0f7c1;background:#2a3a2b;border-color:#65774e}
  .split-master{padding:14px;background:#273026;border:1px solid #5e714d;border-radius:8px;font-weight:700;color:#e4f6d2}
  .split-sample{display:grid;grid-template-columns:1fr 2px 1fr;height:70px;border-radius:7px;margin:20px 0;overflow:hidden}
  .split-sample span{display:grid;place-items:center;font:10px monospace;letter-spacing:1px;color:#f7efd9;
    background:repeating-linear-gradient(0deg,#192b1f 0 3px,#2f4a36 3px 7px)}
  .split-sample span:last-child{background:repeating-linear-gradient(90deg,#4c4f70 0 15px,#7b718e 15px 30px,#ab8081 30px 45px)}
  .split-sample b{background:#fff1ba}
  .split-handle{position:absolute;z-index:7;transform:translateX(-50%);width:44px;cursor:ew-resize;touch-action:none;border:0;background:transparent;outline-offset:2px}
  .split-handle:before{content:"";position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff5cc;box-shadow:0 0 6px #0006}
  .split-handle:after{content:"↔";position:relative;display:grid;place-items:center;width:34px;height:40px;margin:auto;
    border:2px solid #fff5da;background:#e9e8c1;color:#273126;box-shadow:0 4px 14px #0009;border-radius:22px;font:19px monospace}
  .split-badge{position:absolute;z-index:6;pointer-events:none;background:#131919dc;border:1px solid #8e947955;
    border-radius:4px;padding:5px 8px;color:#e9f0d1;font:10px monospace;white-space:nowrap}
  @media(max-width:760px){.tabs{padding:0 12px 13px}.tabs button{min-width:73px!important}.split-handle{width:50px}}
  `;
  document.head.appendChild(style);
  const controlDefs={
    splitPosition:[.5,0,1,.005,'Divider position','splitSliders'],
    splitPixelSize:[12,2,64,1,'Pixel size','splitSliders'],
    splitFeather:[0,0,4,.1,'Edge softness','splitSliders']
  };
  for(const [id,def] of Object.entries(controlDefs)){
    const [v,min,max,step,label,parent]=def;defs[id]=def;
    el(parent).insertAdjacentHTML('beforeend',`<label class="field"><span>${label}<output id="${id}Value">${v}</output></span><input type="range" id="${id}" value="${v}" min="${min}" max="${max}" step="${step}"></label>`);
  }
  const ownIds=[...Object.keys(controlDefs),'splitEnabled','splitStyle','splitReverse','splitDivider'],ownDefaults={};
  for(const id of ownIds){
    ids.push(id);const input=el(id);
    ownDefaults[id]=input.type==='checkbox'?input.checked:input.value;
    defaults[id]=ownDefaults[id];
  }

  const sourceCanvas=document.createElement('canvas'),sourceCtx=sourceCanvas.getContext('2d');
  const glCanvas=document.createElement('canvas'),outCtx=out.getContext('2d');
  const mini=document.createElement('canvas'),miniCtx=mini.getContext('2d');
  const handle=document.createElement('button');
  handle.type='button';handle.className='split-handle';handle.title='Drag to move split divider';
  handle.setAttribute('role','slider');handle.setAttribute('aria-label','Split divider position');
  handle.setAttribute('aria-valuemin','0');handle.setAttribute('aria-valuemax','100');
  handle.hidden=true;stage.appendChild(handle);
  const badges=[document.createElement('div'),document.createElement('div')];
  badges.forEach(b=>{b.className='split-badge';b.hidden=true;stage.appendChild(b)});
  let gpu=null,gpuFailed=false,dragging=false,dragStart=null;
  const vert=`
    attribute vec2 position; varying vec2 uv;
    void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}`;
  const frag=`
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D asciiTex,sourceTex;
    uniform vec2 resolution;
    uniform float splitPoint,feather,pixelSize,pixelStyle,reverseSide,showDivider;
    vec4 pixelImage(vec2 p){
      if(pixelStyle<0.5)return texture2D(sourceTex,p);
      vec2 cells=max(vec2(1.0),floor(resolution/max(pixelSize,1.0)));
      vec2 nearest=(floor(p*cells)+0.5)/cells;
      vec4 c=texture2D(sourceTex,nearest);
      if(pixelStyle>1.5&&pixelStyle<2.5)c.rgb=floor(c.rgb*5.0+0.5)/5.0;
      if(pixelStyle>2.5&&pixelStyle<3.5){
        vec2 local=(fract(p*cells)-0.5)*2.0;
        float shape=1.0-smoothstep(0.66,0.9,length(local));
        c.rgb=mix(c.rgb*.12,c.rgb,shape);
      }
      if(pixelStyle>3.5){
        vec2 local=abs(fract(p*cells)-0.5)*2.0;
        float shape=1.0-smoothstep(.70,.98,local.x+local.y);
        c.rgb=mix(c.rgb*.15,c.rgb,shape);
      }
      return c;
    }
    void main(){
      vec4 a=texture2D(asciiTex,uv);
      vec4 b=pixelImage(uv);
      float softness=max(0.000001,feather/resolution.x);
      float right=smoothstep(splitPoint-softness,splitPoint+softness,uv.x);
      if(reverseSide>.5)right=1.0-right;
      vec4 color=mix(a,b,right);
      if(showDivider>.5){
        float line=1.0-smoothstep(0.0,1.7/resolution.x,abs(uv.x-splitPoint));
        color.rgb=mix(color.rgb,vec3(.99,.95,.77),line*.9);
        color.a=max(color.a,line*.95);
      }
      gl_FragColor=color;
    }`;
  function compile(gl,type,src){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,src);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  function setupGPU(){
    if(gpu||gpuFailed)return gpu;
    try{
      const gl=glCanvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power',preserveDrawingBuffer:true});
      if(!gl)throw Error('No WebGL context');
      const p=gl.createProgram(),vs=compile(gl,gl.VERTEX_SHADER,vert),fs=compile(gl,gl.FRAGMENT_SHADER,frag);
      gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
      gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
      gl.useProgram(p);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(p,'position');
      gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      const textures=[0,1].map(i=>{
        const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        return t;
      });
      gl.uniform1i(gl.getUniformLocation(p,'asciiTex'),0);
      gl.uniform1i(gl.getUniformLocation(p,'sourceTex'),1);
      const uniforms={};
      for(const n of ['resolution','splitPoint','feather','pixelSize','pixelStyle','reverseSide','showDivider'])uniforms[n]=gl.getUniformLocation(p,n);
      gpu={gl,p,buffer,loc,textures,uniforms};
      el('splitStatus').textContent='GPU fragment shader active. Preview and exports share the same split.';
      glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gpu=null;gpuFailed=true;dirty=true;});
      glCanvas.addEventListener('webglcontextrestored',()=>{gpu=null;gpuFailed=false;dirty=true;});
    }catch(e){gpuFailed=true;el('splitStatus').textContent='Canvas fallback active; WebGL unavailable.'}
    return gpu;
  }
  function updateSource(){
    const w=out.width,h=out.height;
    if(sourceCanvas.width!==w||sourceCanvas.height!==h){sourceCanvas.width=w;sourceCanvas.height=h}
    drawSource(sourceCtx,w,h);
  }
  const styles={real:0,square:1,retro:2,dots:3,diamond:4};
  function gpuFrame(s){
    const g=setupGPU();if(!g)return false;
    const {gl,p,buffer,loc,textures,uniforms}=g,w=out.width,h=out.height;
    if(w>gl.getParameter(gl.MAX_TEXTURE_SIZE)||h>gl.getParameter(gl.MAX_TEXTURE_SIZE))return false;
    if(glCanvas.width!==w||glCanvas.height!==h){glCanvas.width=w;glCanvas.height=h;}
    gl.viewport(0,0,w,h);gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    for(const [i,input] of [out,sourceCanvas].entries()){
      gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,input);
    }
    gl.uniform2f(uniforms.resolution,w,h);
    gl.uniform1f(uniforms.splitPoint,+s.splitPosition);
    gl.uniform1f(uniforms.feather,+s.splitFeather);
    gl.uniform1f(uniforms.pixelSize,+s.splitPixelSize);
    gl.uniform1f(uniforms.pixelStyle,styles[s.splitStyle]||0);
    gl.uniform1f(uniforms.reverseSide,s.splitReverse?1:0);
    gl.uniform1f(uniforms.showDivider,s.splitDivider?1:0);
    gl.drawArrays(gl.TRIANGLES,0,6);
    if(gl.getError()!==gl.NO_ERROR)return false;
    outCtx.clearRect(0,0,w,h);
    outCtx.drawImage(glCanvas,0,0);
    return true;
  }
  function canvasFallback(s){
    const w=out.width,h=out.height,x=Math.round(w*(+s.splitPosition));
    outCtx.save();outCtx.beginPath();
    if(s.splitReverse)outCtx.rect(0,0,x,h);else outCtx.rect(x,0,w-x,h);
    outCtx.clip();
    if(s.splitStyle==='real')outCtx.drawImage(sourceCanvas,0,0);
    else{
      const block=Math.max(2,+s.splitPixelSize),mw=Math.max(2,Math.ceil(w/block)),mh=Math.max(2,Math.ceil(h/block));
      if(mini.width!==mw||mini.height!==mh){mini.width=mw;mini.height=mh}
      miniCtx.drawImage(sourceCanvas,0,0,mw,mh);
      if(s.splitStyle==='retro'){
        const data=miniCtx.getImageData(0,0,mw,mh);
        for(let i=0;i<data.data.length;i+=4)for(let k=0;k<3;k++)data.data[i+k]=Math.round(data.data[i+k]/51)*51;
        miniCtx.putImageData(data,0,0);
      }
      outCtx.imageSmoothingEnabled=false;outCtx.drawImage(mini,0,0,mw,mh,0,0,w,h);outCtx.imageSmoothingEnabled=true;
    }
    outCtx.restore();
    if(s.splitDivider){outCtx.fillStyle='#fff0bd';outCtx.fillRect(x-1,0,Math.max(1,w/800),h)}
  }
  const baseRender=render;
  render=function(t,width,exporting){
    baseRender(t,width,exporting);
    const s=settings();
    if(!s.splitEnabled||comparing||(type==='video'||type==='camera')&&video.readyState<2){placeHandle();return}
    try{
      updateSource();
      if(!gpuFrame(s))canvasFallback(s);
    }catch(error){try{canvasFallback(s)}catch(e){el('splitStatus').textContent='Split temporarily unavailable: '+e.message}}
    placeHandle();
  };
  function placeHandle(){
    const s=settings(),show=!!s.splitEnabled;handle.hidden=!show;badges.forEach(b=>b.hidden=!show);
    if(!show)return;
    const r=out.getBoundingClientRect(),p=stage.getBoundingClientRect();
    if(!r.width||!r.height)return;
    handle.style.left=r.left-p.left+r.width*(+s.splitPosition)+'px';
    handle.style.top=r.top-p.top+'px';handle.style.height=r.height+'px';
    handle.setAttribute('aria-valuenow',Math.round(+s.splitPosition*100));
    badges[0].textContent=s.splitReverse?'IMAGE':'ASCII';
    badges[1].textContent=s.splitReverse?'ASCII':(s.splitStyle==='real'?'REAL':'PIXEL');
    badges[0].style.left=r.left-p.left+9+'px';
    badges[1].style.left=Math.max(r.left-p.left+70,r.right-p.left-73)+'px';
    badges.forEach(b=>b.style.top=r.top-p.top+11+'px');
  }
  function position(n,record){
    const before=record?snapshot():null;
    el('splitPosition').value=Math.max(0,Math.min(1,n));
    if(before)commit(before);
    updateUI();dirty=true;
  }
  function positionFromPointer(e){
    const r=out.getBoundingClientRect();return (e.clientX-r.left)/Math.max(1,r.width);
  }
  handle.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();dragging=true;dragStart=snapshot();
    handle.setPointerCapture(e.pointerId);position(positionFromPointer(e),false);
  });
  handle.addEventListener('pointermove',e=>{if(dragging){e.preventDefault();position(positionFromPointer(e),false)}});
  const stopDrag=()=>{if(dragging){dragging=false;if(dragStart)commit(dragStart);dragStart=null;updateUI()}};
  handle.addEventListener('pointerup',stopDrag);
  handle.addEventListener('pointercancel',stopDrag);
  handle.addEventListener('lostpointercapture',stopDrag);
  handle.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();
    const v=+el('splitPosition').value;
    position(e.key==='Home'?0:e.key==='End'?1:v+(e.key==='ArrowRight'?.02:-.02),true);
  });
  for(const id of ownIds){
    const input=el(id);
    input.addEventListener('pointerdown',()=>editStart=snapshot());
    input.addEventListener('focus',()=>{if(!editStart)editStart=snapshot()});
    input.addEventListener('input',()=>{dirty=true;updateUI()});
    input.addEventListener('change',()=>{commit(editStart||defaults);editStart=null;dirty=true;updateUI()});
  }
  const originalUpdateUI=updateUI;
  updateUI=function(){
    originalUpdateUI();
    el('splitPositionValue').textContent=Math.round(+el('splitPosition').value*100)+'%';
    el('splitPixelSize').closest('label').hidden=el('splitStyle').value==='real';
    placeHandle();
  };
  el('splitHalf').onclick=()=>position(.5,true);
  el('splitReset').onclick=()=>{
    const before=snapshot();restore({...settings(),...ownDefaults});commit(before);
    dirty=true;updateUI();status('Split View reset. Artwork untouched.');
  };
  window.addEventListener('resize',placeHandle);
  if(window.ResizeObserver)new ResizeObserver(placeHandle).observe(out);
  // This tab is inserted after the initial showPanel() bindings were created.
  // Wire it explicitly so tapping Split View actually reveals its inspector.
  tabs.querySelector('[data-tab="split"]').onclick=()=>showPanel('split');
  tabs.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>b.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'})));
  try{
    const saved=JSON.parse(localStorage.getItem('ascii-studio-v10'));
    if(saved&&typeof saved==='object')for(const id of ownIds){
      if(!(id in saved))continue;
      const input=el(id),v=saved[id];
      if(input.type==='checkbox')input.checked=!!v;
      else if(input.tagName==='SELECT'){if([...input.options].some(o=>o.value===String(v)))input.value=v;}
      else if(input.type==='range'&&Number.isFinite(+v))input.value=Math.max(+input.min,Math.min(+input.max,+v));
    }
  }catch(e){}
  updateUI();dirty=true;
})();