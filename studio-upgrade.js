/* ASCII Studio / Pixel Darkroom update: local-only, optional effects, no dependencies. */
(function () {
  'use strict';
  const tabBar = document.querySelector('.tabs');
  const scroll = document.querySelector('.panel-scroll');
  if (!tabBar || !scroll || typeof render !== 'function' || !document.getElementById('out')) return;
  const byId = id => document.getElementById(id);

  tabBar.insertAdjacentHTML('beforeend',
    '<button data-tab="adjust" aria-controls="panel-adjust" aria-pressed="false">Adjust</button>' +
    '<button data-tab="crt" aria-controls="panel-crt" aria-pressed="false">CRT</button>');

  scroll.insertAdjacentHTML('beforeend', [
    '<section id="panel-adjust" data-panel="adjust" aria-label="Photographic adjustments" hidden>',
    '<div class="panel-intro"><span class="eyebrow">THE PIXEL DARKROOM / 01</span><h2>Shape the light.</h2>',
    '<p class="note">Photographic adjustments transform the input before it becomes ASCII. Every control is non-destructive.</p></div>',
    '<label class="check"><input id="photoEnabled" type="checkbox" checked> Enable image adjustments</label>',
    '<div class="edit-group"><div class="edit-heading"><span>01 / LIGHT</span><span>RAW → TYPE</span></div><div id="adjustLightSliders"></div></div>',
    '<div class="edit-group"><div class="edit-heading"><span>02 / COLOUR</span><span>HUE & ENERGY</span></div><div id="adjustColorSliders"></div></div>',
    '<details><summary>03 / Tonal curves</summary><p class="note">Three connected tonal regions shape the curve without clipping the source.</p>',
    '<svg id="toneGraph" viewBox="0 0 200 130" role="img" aria-label="Live tone curve" class="tone-graph">',
    '<path d="M0 0V130H200" fill="none" stroke="#55535c"/><path d="M0 130L200 0" stroke="#585960" stroke-dasharray="3 4"/>',
    '<path id="toneGraphPath" d="M0 130L200 0" fill="none" stroke="#d9f18c" stroke-width="2.5"/>',
    '</svg><div id="adjustCurveSliders"></div></details>',
    '<details><summary>04 / Texture</summary><div id="adjustDetailSliders"></div></details>',
    '<div class="edit-actions"><button id="photoCompare" class="edit-compare" type="button">◉ Hold for before</button>',
    '<button id="photoReset" type="button">Reset adjustments</button></div>',
    '<p class="note">Before shows the original ASCII treatment, not the unconverted photograph. Undo / Redo also work here.</p></section>',
    '<section id="panel-crt" data-panel="crt" aria-label="Retro display effects" hidden>',
    '<div class="panel-intro"><span class="eyebrow">THE PIXEL DARKROOM / 02</span><h2>Build a screen.</h2>',
    '<p class="note">Authentic-inspired phosphor, scanlines and optical glow. Effects apply to preview, PNG and exported video.</p></div>',
    '<label class="check edit-master"><input id="crtMaster" type="checkbox"> CRT display enabled</label>',
    '<div class="edit-group"><div class="edit-heading"><span>STARTING POINTS</span><span>CHOOSE A LOOK</span></div>',
    '<div class="crt-presets"><button type="button" data-crt-preset="soft">Soft CRT</button>',
    '<button type="button" data-crt-preset="arcade">Arcade</button>',
    '<button type="button" data-crt-preset="pixel">Pixel Glow</button>',
    '<button type="button" data-crt-preset="mono">Mono Terminal</button></div></div>',
    '<div class="edit-group"><div class="edit-heading"><span>01 / DISPLAY STRUCTURE</span><span>PHOSPHOR</span></div>',
    '<label class="check"><input id="crtScanlines" type="checkbox" checked> Scanlines</label>',
    '<div id="crtScanSliders"></div>',
    '<label class="check"><input id="crtPhosphorOn" type="checkbox" checked> Phosphor mask</label>',
    '<label class="field"><span>Mask geometry</span><select id="crtMaskType">',
    '<option value="grille">Aperture grille</option><option value="shadow">Shadow mask</option></select></label>',
    '<div id="crtMaskSliders"></div></div>',
    '<div class="edit-group"><div class="edit-heading"><span>02 / OPTICAL CHARACTER</span><span>LIGHT LEAKAGE</span></div>',
    '<label class="check"><input id="crtBloomOn" type="checkbox" checked> Glow / bloom</label><div id="crtBloomSliders"></div>',
    '<label class="check"><input id="crtHalationOn" type="checkbox" checked> Warm halation</label><div id="crtHalationSliders"></div>',
    '<label class="check"><input id="crtBlurOn" type="checkbox"> Screen softness</label><div id="crtBlurSliders"></div>',
    '<label class="check"><input id="crtBleedOn" type="checkbox"> Colour bleed</label><div id="crtBleedSliders"></div>',
    '<label class="check"><input id="crtCurveOn" type="checkbox"> Curved glass</label><div id="crtCurveSliders"></div>',
    '<label class="check"><input id="crtVignetteOn" type="checkbox" checked> Edge falloff</label><div id="crtVignetteSliders"></div></div>',
    '<div class="edit-actions"><button id="crtCompare" class="edit-compare" type="button">◉ Hold for before</button>',
    '<button id="crtReset" type="button">Clear CRT</button></div>',
    '<p class="note">CRT starts OFF to keep low-end previews quick. Enable just the effects you need. FHD remains optional.</p></section>'
  ].join(''));

  const photoDefs = {
    exposure: [0,-2,2,.05,'Exposure · EV','adjustLightSliders'],
    highlights: [0,-1,1,.05,'Highlights','adjustLightSliders'],
    shadowsLift: [0,-1,1,.05,'Shadows','adjustLightSliders'],
    temperature: [0,-1,1,.02,'Temperature','adjustColorSliders'],
    tint: [0,-1,1,.02,'Tint','adjustColorSliders'],
    saturation: [1,0,2,.05,'Saturation','adjustColorSliders'],
    vibrance: [0,-1,1,.05,'Vibrance','adjustColorSliders'],
    curveDark: [0,-.5,.5,.01,'Shadow point','adjustCurveSliders'],
    curveMid: [0,-.5,.5,.01,'Midtone point','adjustCurveSliders'],
    curveLight: [0,-.5,.5,.01,'Highlight point','adjustCurveSliders'],
    sharpness: [0,0,2,.05,'Sharpen','adjustDetailSliders'],
    filmGrain: [0,0,1,.02,'Film grain','adjustDetailSliders']
  };
  const crtDefs = {
    crtScanSpacing: [4,2,12,1,'Scanline spacing','crtScanSliders'],
    crtScanStrength: [.26,0,1,.02,'Scanline intensity','crtScanSliders'],
    crtMaskStrength: [.35,0,1,.02,'Mask intensity','crtMaskSliders'],
    crtBloom: [.25,0,1,.02,'Bloom intensity','crtBloomSliders'],
    crtHalation: [.22,0,1,.02,'Halation intensity','crtHalationSliders'],
    crtBlur: [1,0,6,.25,'Blur radius','crtBlurSliders'],
    crtBleed: [.25,0,1,.02,'RGB separation','crtBleedSliders'],
    crtCurve: [.35,0,1,.02,'Curvature','crtCurveSliders'],
    crtVignette: [.2,0,1,.02,'Edge shading','crtVignetteSliders']
  };
  const selectIds = ['photoEnabled','crtMaster','crtScanlines','crtPhosphorOn','crtMaskType',
    'crtBloomOn','crtHalationOn','crtBlurOn','crtBleedOn','crtCurveOn','crtVignetteOn'];
  const newSliderIds = Object.keys(photoDefs).concat(Object.keys(crtDefs));
  for (const [id, def] of Object.entries({...photoDefs,...crtDefs})) {
    defs[id] = def;
    const [value,min,max,step,label,parent] = def;
    byId(parent).insertAdjacentHTML('beforeend',
      '<label class="field"><span>' + label + '<output id="' + id + 'Value">' + value +
      '</output></span><input id="' + id + '" type="range" min="' + min + '" max="' +
      max + '" step="' + step + '" value="' + value + '"></label>');
  }
  const extraIds = newSliderIds.concat(selectIds);
  const savedDefaults = {};
  for (const id of extraIds) {
    ids.push(id);
    const el = byId(id);
    const value = el.type === 'checkbox' ? el.checked : el.value;
    defaults[id] = value;
    savedDefaults[id] = value;
  }

  const style = document.createElement('style');
  style.textContent = [
    '.tabs{grid-template-columns:repeat(4,minmax(0,1fr))}',
    '.tabs button{font-size:10px;min-height:36px}',
    '.edit-group{padding:14px 0 12px;border-top:1px solid #3c3a3e}',
    '.edit-heading{display:flex;justify-content:space-between;gap:8px;color:#e0c5a3;font:10px monospace;letter-spacing:1.2px}',
    '.edit-heading span:last-child{color:#8d8b91;font-size:8px}',
    '.edit-group .field{margin:17px 0}',
    '.edit-master{padding:11px 13px;border:1px solid #5a5545;background:#292a25;border-radius:7px;color:#e2e9c3;font-weight:700}',
    '.crt-presets{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0}',
    '.crt-presets button{font:11px monospace;min-height:45px;text-align:left;padding:10px 12px;background:#262628}',
    '.crt-presets button:focus-visible{border-color:#d9f18c}',
    '.edit-actions{display:grid;grid-template-columns:1.3fr 1fr;gap:8px;margin:24px 0}',
    '.edit-actions button{font-size:10px;padding:11px 7px;touch-action:none}',
    '.edit-compare{background:#2d3524;color:#d9f18c;border-color:#52603d}',
    '.edit-compare.active{background:#d9f18c;color:#222818}',
    '.tone-graph{display:block;width:100%;height:160px;border:1px solid #37393b;background:#17191c;margin:16px 0}',
    '.before-tag{position:absolute;top:14px;left:14px;font:10px monospace;letter-spacing:1px;background:#d9f18c;color:#1b2514;padding:7px 10px;z-index:3}',
    '@media(max-width:760px){.tabs{grid-template-columns:repeat(4,minmax(0,1fr));gap:3px}.tabs button{font-size:10px;padding:9px 2px}.edit-actions{grid-template-columns:1fr 1fr}}'
  ].join('');
  document.head.appendChild(style);

  let previewBefore = false;
  const beforeTag = document.createElement('span');
  beforeTag.className = 'before-tag';
  beforeTag.textContent = 'BEFORE / NO DARKROOM';
  beforeTag.hidden = true;
  byId('drop').appendChild(beforeTag);

  const photoKeys = ['exposure','highlights','shadowsLift','temperature','tint',
    'saturation','vibrance','curveDark','curveMid','curveLight','sharpness','filmGrain'];
  const photoCache = new Map();
  const invalidate = () => {
    photoCache.clear();
    cellGridCache = null;
    packetCache = null;
    pairCache = null;
    glyphLayerKey = '';
    analysisKey = '';
    dirty = true;
  };
  const updateCurveGraph = () => {
    const s = settings();
    const parts = [];
    for (let i = 0; i <= 40; i++) {
      const x = i / 40, bump = (center,width) => Math.exp(-Math.pow((x-center)/width,2));
      const y = clamp(x + .34*(+s.curveDark*bump(.2,.23) +
        +s.curveMid*bump(.5,.24) + +s.curveLight*bump(.8,.23)));
      parts.push((i ? 'L' : 'M') + Math.round(x*200) + ' ' + Math.round((1-y)*130));
    }
    byId('toneGraphPath').setAttribute('d',parts.join(' '));
  };
  for (const id of extraIds) {
    const el = byId(id);
    el.addEventListener('pointerdown', () => { editStart = snapshot(); });
    el.addEventListener('focus', () => { if (!editStart) editStart = snapshot(); });
    el.addEventListener('input', () => { invalidate(); updateUI(); updateCurveGraph(); });
    el.addEventListener('change', () => {
      commit(editStart || defaults); editStart = null;
      invalidate(); updateUI(); updateCurveGraph();
    });
  }

  function processPixels(data,cols,rows,s,sourceKey) {
    if (previewBefore || !s.photoEnabled) return data;
    const keys = photoKeys.map(k => s[k]).join('|');
    const neutral = photoKeys.every(k => String(s[k]) === String(savedDefaults[k]));
    if (neutral) return data;
    const key = sourceKey + '|' + cols + 'x' + rows + '|' + keys;
    if (photoCache.has(key)) return photoCache.get(key);
    const result = new Uint8ClampedArray(data.length);
    const ev = Math.pow(2,+s.exposure);
    const bump = (v,c,w) => Math.exp(-Math.pow((v-c)/w,2));
    for (let p = 0; p < cols*rows; p++) {
      const i = p*4, x = p%cols, y = (p/cols)|0;
      let r = data[i], g = data[i+1], b = data[i+2];
      if (+s.sharpness > 0) {
        const left = (y*cols+Math.max(0,x-1))*4;
        const right = (y*cols+Math.min(cols-1,x+1))*4;
        const up = (Math.max(0,y-1)*cols+x)*4;
        const down = (Math.min(rows-1,y+1)*cols+x)*4;
        const k = +s.sharpness * 1.1;
        r += (r-(data[left]+data[right]+data[up]+data[down])/4)*k;
        g += (g-(data[left+1]+data[right+1]+data[up+1]+data[down+1])/4)*k;
        b += (b-(data[left+2]+data[right+2]+data[up+2]+data[down+2])/4)*k;
      }
      r *= ev; g *= ev; b *= ev;
      const l = clamp((.2126*r+.7152*g+.0722*b)/255);
      const shadow = +s.shadowsLift * Math.pow(1-l,2) * 78;
      const highlight = +s.highlights * l*l * 78;
      const curve = 95*(+s.curveDark*bump(l,.2,.23) +
        +s.curveMid*bump(l,.5,.24) + +s.curveLight*bump(l,.8,.23));
      const tonal = shadow + highlight + curve;
      r += tonal + +s.temperature*24 + +s.tint*11;
      g += tonal - +s.tint*18;
      b += tonal - +s.temperature*24 + +s.tint*11;
      const lum = .2126*r + .7152*g + .0722*b;
      const saturationNow = Math.max(r,g,b)-Math.min(r,g,b);
      const sat = Math.max(0,+s.saturation + +s.vibrance*(1-clamp(saturationNow/175)));
      r = lum + (r-lum)*sat;
      g = lum + (g-lum)*sat;
      b = lum + (b-lum)*sat;
      if (+s.filmGrain) {
        const noise = (hash(x+107,y+sourceRevision*29)-.5)*75*+s.filmGrain;
        r += noise; g += noise; b += noise;
      }
      result[i] = r; result[i+1] = g; result[i+2] = b; result[i+3] = data[i+3];
    }
    if (photoCache.size >= 2) photoCache.delete(photoCache.keys().next().value);
    photoCache.set(key,result);
    return result;
  }

  const nativeSamplePicture = samplePicture;
  samplePicture = function(cols,rows) {
    const raw = nativeSamplePicture(cols,rows);
    return processPixels(raw,cols,rows,settings(),rawKey);
  };
  // B images use their own raster inside preparePair; apply the same grade there.
  const nativeBaseCells = baseCells;
  baseCells = function(data,s,cols,rows,t,exporting) {
    if (rawKey.startsWith('keyB-')) data = processPixels(data,cols,rows,s,rawKey);
    return nativeBaseCells(data,s,cols,rows,t,exporting);
  };

  const fxSource = document.createElement('canvas');
  const fxBloom = document.createElement('canvas');
  const fxTint = document.createElement('canvas');
  const fxTile = document.createElement('canvas');
  const fxSourceCtx = fxSource.getContext('2d');
  const fxBloomCtx = fxBloom.getContext('2d');
  const fxTintCtx = fxTint.getContext('2d');
  const fxTileCtx = fxTile.getContext('2d');
  const fx = byId('out').getContext('2d');

  function scaledBloom(w,h) {
    const bw = Math.max(1,Math.round(w/4)), bh = Math.max(1,Math.round(h/4));
    if (fxBloom.width !== bw || fxBloom.height !== bh) {
      fxBloom.width = bw; fxBloom.height = bh;
    }
    fxBloomCtx.clearRect(0,0,bw,bh);
    fxBloomCtx.drawImage(byId('out'),0,0,bw,bh);
  }

  function repeatOverlay(tileW,tileH,painter) {
    fxTile.width = tileW; fxTile.height = tileH;
    fxTileCtx.clearRect(0,0,tileW,tileH);
    painter(fxTileCtx);
    fx.save();
    fx.globalCompositeOperation = 'source-atop';
    fx.fillStyle = fx.createPattern(fxTile,'repeat');
    fx.fillRect(0,0,byId('out').width,byId('out').height);
    fx.restore();
  }

  function drawCRT(s) {
    if (!s.crtMaster || s.bypass || previewBefore || comparing) return;
    const canvas = byId('out'), w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    const ratio = Math.max(1,w/960);
    const warp = s.crtCurveOn && +s.crtCurve > 0;
    const blur = s.crtBlurOn && +s.crtBlur > 0;
    if (warp || blur) {
      if (fxSource.width !== w || fxSource.height !== h) {
        fxSource.width = w; fxSource.height = h;
      }
      fxSourceCtx.clearRect(0,0,w,h);
      fxSourceCtx.drawImage(canvas,0,0);
      fx.clearRect(0,0,w,h);
      fx.save();
      if (blur) fx.filter = 'blur(' + Math.min(14,+s.crtBlur*ratio).toFixed(2) + 'px)';
      if (warp) {
        const strips = Math.min(96,Math.max(48,Math.round(h/14)));
        for (let n=0;n<strips;n++) {
          const y = Math.floor(h*n/strips);
          const next = Math.ceil(h*(n+1)/strips);
          const dist = Math.abs((y+next)/h - 1);
          const inset = Math.round(w*.065*+s.crtCurve*Math.pow(dist,1.7));
          fx.drawImage(fxSource,0,y,w,next-y,inset,y,w-2*inset,next-y+.75);
        }
      } else fx.drawImage(fxSource,0,0);
      fx.restore();
    }

    if (s.crtBloomOn && +s.crtBloom || s.crtHalationOn && +s.crtHalation) {
      scaledBloom(w,h);
      if (s.crtBloomOn && +s.crtBloom) {
        fx.save();
        fx.globalCompositeOperation = 'screen';
        fx.globalAlpha = Math.min(.7,.5*+s.crtBloom);
        fx.filter = 'blur(' + Math.round(5*ratio+8*ratio*+s.crtBloom) + 'px)';
        fx.drawImage(fxBloom,0,0,w,h);
        fx.restore();
      }
      if (s.crtHalationOn && +s.crtHalation) {
        if (fxTint.width !== fxBloom.width || fxTint.height !== fxBloom.height) {
          fxTint.width=fxBloom.width; fxTint.height=fxBloom.height;
        }
        fxTintCtx.clearRect(0,0,fxTint.width,fxTint.height);
        fxTintCtx.drawImage(fxBloom,0,0);
        fxTintCtx.globalCompositeOperation='source-atop';
        fxTintCtx.fillStyle='rgba(255,74,24,.86)';
        fxTintCtx.fillRect(0,0,fxTint.width,fxTint.height);
        fxTintCtx.globalCompositeOperation='source-over';
        fx.save();
        fx.globalCompositeOperation='screen';
        fx.globalAlpha=Math.min(.42,+s.crtHalation*.32);
        fx.filter='blur(' + Math.round(12*ratio) + 'px)';
        fx.drawImage(fxTint,0,0,w,h);
        fx.restore();
      }
    }
    if (s.crtBleedOn && +s.crtBleed) {
      const offset = Math.max(1,Math.round(+s.crtBleed*3*ratio));
      if (fxSource.width !== w || fxSource.height !== h) {
        fxSource.width=w; fxSource.height=h;
      }
      fxSourceCtx.clearRect(0,0,w,h);
      fxSourceCtx.drawImage(canvas,0,0);
      fx.save();
      fx.globalCompositeOperation='screen';
      fx.globalAlpha=.18*+s.crtBleed;
      fx.drawImage(fxSource,-offset,0);
      fx.drawImage(fxSource,offset,0);
      fx.restore();
    }
    if (s.crtPhosphorOn && +s.crtMaskStrength) {
      const scale=Math.max(1,Math.round(ratio));
      const a=Math.min(.65,+s.crtMaskStrength*.6);
      if (s.crtMaskType==='shadow') {
        const pitch=6*scale;
        repeatOverlay(pitch*2,pitch*2,q=>{
          q.fillStyle='rgba(0,0,0,' + a.toFixed(3) + ')';
          for(let y=0;y<2;y++)for(let x=0;x<2;x++){
            q.beginPath();
            q.arc((x+.5)*pitch+(y?pitch/4:0),(y+.5)*pitch,Math.max(1,pitch*.23),0,Math.PI*2);
            q.fill();
          }
        });
      } else {
        const pitch=6*scale;
        repeatOverlay(pitch,pitch,q=>{
          q.fillStyle='rgba(0,0,0,' + a.toFixed(3) + ')';
          q.fillRect(0,0,scale,pitch);
          q.fillRect(3*scale,0,scale,pitch);
          q.fillStyle='rgba(77,12,30,' + (a*.2).toFixed(3) + ')';
          q.fillRect(5*scale,0,scale,pitch);
        });
      }
    }
    if (s.crtScanlines && +s.crtScanStrength) {
      const space=Math.max(2,Math.round(+s.crtScanSpacing*ratio));
      repeatOverlay(1,space,q=>{
        q.fillStyle='rgba(0,0,0,' + Math.min(.85,+s.crtScanStrength*.75) + ')';
        q.fillRect(0,space-1,1,1);
      });
    }
    if (s.crtVignetteOn && +s.crtVignette) {
      fx.save();
      fx.globalCompositeOperation='source-atop';
      const gradient=fx.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.12,w*.5,h*.5,Math.hypot(w,h)*.56);
      gradient.addColorStop(0,'rgba(0,0,0,0)');
      gradient.addColorStop(1,'rgba(0,0,0,' + Math.min(.9,+s.crtVignette*.72) + ')');
      fx.fillStyle=gradient;
      fx.fillRect(0,0,w,h);
      fx.restore();
    }
  }

  const nativeRender = render;
  render = function(t,width,exporting) {
    nativeRender(t,width,exporting);
    drawCRT(settings());
  };

  function compare(isBefore) {
    previewBefore = isBefore;
    beforeTag.hidden = !isBefore;
    for (const id of ['photoCompare','crtCompare']) byId(id).classList.toggle('active',isBefore);
    invalidate(); updateUI();
  }
  for (const id of ['photoCompare','crtCompare']) {
    const el = byId(id);
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); el.setPointerCapture(e.pointerId); compare(true);
    });
    el.addEventListener('pointerup',()=>compare(false));
    el.addEventListener('pointercancel',()=>compare(false));
    el.addEventListener('lostpointercapture',()=>{if(previewBefore)compare(false)});
    el.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();compare(true)}});
    el.addEventListener('keyup',()=>compare(false));
    el.addEventListener('blur',()=>{if(previewBefore)compare(false)});
  }
  window.addEventListener('blur',()=>{if(previewBefore)compare(false)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&previewBefore)compare(false)});

  const crtNeutral = ['crtMaster','crtScanlines','crtPhosphorOn','crtMaskType','crtBloomOn',
    'crtHalationOn','crtBlurOn','crtBleedOn','crtCurveOn','crtVignetteOn',
    ...Object.keys(crtDefs)];
  const presets = {
    soft: {crtMaster:true,crtScanlines:true,crtScanStrength:.2,crtScanSpacing:4,
      crtPhosphorOn:true,crtMaskType:'grille',crtMaskStrength:.23,
      crtBloomOn:true,crtBloom:.23,crtHalationOn:true,crtHalation:.18,
      crtBlurOn:true,crtBlur:.5,crtBleedOn:false,crtCurveOn:false,crtVignetteOn:true,crtVignette:.2},
    arcade: {crtMaster:true,crtScanlines:true,crtScanStrength:.48,crtScanSpacing:4,
      crtPhosphorOn:true,crtMaskType:'shadow',crtMaskStrength:.58,
      crtBloomOn:true,crtBloom:.42,crtHalationOn:true,crtHalation:.2,
      crtBlurOn:false,crtBleedOn:true,crtBleed:.4,crtCurveOn:true,crtCurve:.25,
      crtVignetteOn:true,crtVignette:.42},
    pixel: {crtMaster:true,crtScanlines:false,crtPhosphorOn:true,crtMaskType:'grille',crtMaskStrength:.17,
      crtBloomOn:true,crtBloom:.75,crtHalationOn:true,crtHalation:.48,
      crtBlurOn:false,crtBleedOn:true,crtBleed:.28,crtCurveOn:false,
      crtVignetteOn:true,crtVignette:.16},
    mono: {crtMaster:true,crtScanlines:true,crtScanStrength:.4,crtScanSpacing:5,
      crtPhosphorOn:true,crtMaskType:'grille',crtMaskStrength:.48,
      crtBloomOn:true,crtBloom:.55,crtHalationOn:false,
      crtBlurOn:false,crtBleedOn:false,crtCurveOn:false,
      crtVignetteOn:true,crtVignette:.4,colorMode:'mono',fg:'#86ff9e',
      bg:'#040b08',glow:4}
  };
  for (const btn of document.querySelectorAll('[data-crt-preset]')) {
    btn.onclick=()=>{
      const before=snapshot();
      restore({...settings(),...presets[btn.dataset.crtPreset]});
      commit(before);
      invalidate();updateCurveGraph();
      status(btn.textContent.trim()+' is ready. Adjust each layer to make it yours.');
    };
  }
  byId('photoReset').onclick=()=>{
    const before=snapshot(), patch={photoEnabled:true};
    for (const k of photoKeys) patch[k]=savedDefaults[k];
    restore({...settings(),...patch}); commit(before); invalidate();updateCurveGraph();
    status('Image adjustments reset; your ASCII artwork and CRT look are preserved.');
  };
  byId('crtReset').onclick=()=>{
    const before=snapshot(),patch={};
    for (const k of crtNeutral) patch[k]=savedDefaults[k];
    restore({...settings(),...patch}); commit(before); invalidate();
    status('CRT effects cleared; photo adjustments and artwork are preserved.');
  };

  // Load darkroom settings only after these dynamic controls join the project schema.
  try {
    const storageKeys=['ascii-studio-v10','ascii-studio-v9','ascii-studio-v8'];
    for (const key of storageKeys) {
      const value=JSON.parse(localStorage.getItem(key));
      if(value && typeof value==='object'){
        restore({...savedDefaults,...value});
        byId('previewQuality').value='auto';
        syncRendererControls();
        break;
      }
    }
  } catch(e) { /* Private mode or invalid previous storage: harmless. */ }
  updateCurveGraph();
  updateUI();
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showPanel(b.dataset.tab));
})();