/* Useful ideas from the Ultimate Edition, rebuilt against ASCII Studio's API. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('out') || typeof settings !== 'function') return;
  const storageKey = 'ascii-studio-gallery-v1';
  const panel = document.createElement('section');
  panel.id = 'panel-gallery';
  panel.dataset.panel = 'gallery';
  panel.hidden = true;
  panel.innerHTML = `<div class="panel-intro"><span class="eyebrow">KEEP AN EXPLORATION</span><h2>Saved previews.</h2><p class="note">Save a thumbnail and its settings on this device. Restore applies settings to your current source; media, brush strokes and animation position are not saved here. Use Save project for your full artwork.</p></div><button id="savePreview">Save current preview</button><div id="galleryGrid" class="saved-previews"></div><button id="clearGallery">Clear saved previews</button>`;
  document.querySelector('.panel-scroll').appendChild(panel);
  document.querySelector('.tabs').insertAdjacentHTML('beforeend', '<button data-tab="gallery" aria-controls="panel-gallery" aria-pressed="false">Saved</button>');
  const style = document.createElement('style');
  style.textContent = '.saved-previews{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:18px 0}.saved-previews img{display:block;width:100%;height:90px;object-fit:contain;background:#080b08;margin-bottom:8px}.saved-previews button{min-width:0;font-size:11px;text-align:left}.saved-previews .note{grid-column:1/-1}';
  document.head.appendChild(style);
  const tools = document.createElement('div');
  tools.className = 'row';
  tools.innerHTML = '<button id="smartSuggest">Suggest settings</button><button id="shareLink">Share settings</button>';
  $('panel-type').querySelector('.panel-intro').after(tools);
  const rampField = document.createElement('label');
  rampField.className = 'field';
  rampField.innerHTML = '<span>Quick character ramp</span><select id="charRamp"><option value="">Choose a ramp</option><option value="classic">Classic</option><option value="minimal">Minimal</option><option value="blocks">Blocks</option><option value="braille">Braille dots</option><option value="detailed">Detailed</option></select>';
  tools.after(rampField);
  const ramps = {classic:' .:-=+*#%@',minimal:' .:-',blocks:' ░▒▓█',braille:' ⠁⠃⠇⠏⠟⠿⡿⣿',detailed:' .,:;irsXA253hMHGS#9B&@'};
  function apply(values) {
    if (recording) return status('Stop exporting before changing settings.');
    const before = snapshot();
    restore(values);
    commit(before);
    previous = null;
    clearCanvas();
    render(frame);
  }
  $('charRamp').onchange = event => {
    const ramp = ramps[event.target.value];
    if (!ramp) return;
    apply({...settings(), ramp});
    event.target.value = '';
  };
  $('smartSuggest').onclick = () => {
    if (recording) return status('Stop exporting before changing settings.');
    render(frame); // Ensures the procedural source is initialized.
    const w = 96, h = 64, data = samplePicture(w, h);
    const luminance = new Float32Array(w*h);
    let sum = 0, edges = 0;
    for (let i=0; i<luminance.length; i++) {
      const p=i*4;
      luminance[i] = (.2126*data[p]+.7152*data[p+1]+.0722*data[p+2])*(data[p+3]/255);
      sum += luminance[i];
    }
    for (let y=1; y<h; y++) for (let x=1; x<w; x++) {
      const i=y*w+x;
      if (Math.abs(luminance[i]-luminance[i-1])+Math.abs(luminance[i]-luminance[i-w])>60) edges++;
    }
    const avg=sum/luminance.length;
    const cols=avg<80?140:avg>180?90:120;
    const mode=edges/((w-1)*(h-1))>.18?'hybrid':'luma';
    apply({...settings(), cols, mode});
    status(`Source-based suggestion: ${cols} columns, ${mode}. Undo to compare; this is a luminance/contrast heuristic.`);
  };
  function portableSettings() {
    // Links contain only scalar controls, never embedded media or brush data.
    return Object.fromEntries(Object.entries(settings()).filter(([key,value]) => !key.startsWith('_') && ['string','number','boolean'].includes(typeof value)));
  }
  $('shareLink').onclick = async () => {
    try {
      const bytes=new TextEncoder().encode(JSON.stringify({version:1,settings:portableSettings()}));
      const encoded=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      if (encoded.length>60000) throw Error('Settings are too large for a link. Use Save project.');
      const url=new URL(location.href);
      url.hash='s='+encoded;
      await navigator.clipboard.writeText(url.href);
      status('Settings link copied. Source media and brush strokes are not included.');
    } catch (error) { status('Could not copy settings link: '+error.message); }
  };
  function readGallery() {
    try {
      const data=JSON.parse(localStorage.getItem(storageKey)||'[]');
      return Array.isArray(data)?data.filter(item=>item && typeof item.thumb==='string' && item.thumb.startsWith('data:image/png;base64,') && item.settings && typeof item.settings==='object').slice(0,12):[];
    } catch { return []; }
  }
  function loadGallery() {
    const grid=$('galleryGrid');
    grid.replaceChildren();
    const items=readGallery();
    if (!items.length) {
      const empty=document.createElement('p');empty.className='note';empty.textContent='No previews saved yet.';grid.appendChild(empty);
    }
    items.forEach(item => {
      const button=document.createElement('button'), image=document.createElement('img');
      image.src=item.thumb;image.alt='Saved ASCII preview';
      button.append(image,document.createTextNode('Restore · '+new Date(item.ts).toLocaleDateString()));
      button.onclick=()=>{if(recording)return status('Stop exporting before restoring settings.');apply(item.settings);status('Saved settings restored onto the current source.');};
      grid.appendChild(button);
    });
    $('clearGallery').disabled=!items.length;
  }
  document.querySelector('.tabs').addEventListener('click', event => {
    if (event.target.closest('[data-tab]')?.dataset.tab==='gallery') loadGallery();
  });
  $('savePreview').onclick = () => {
    if(recording)return status('Stop exporting before saving a preview.');
    try {
      render(frame);
      const thumb=document.createElement('canvas'), canvas=$('out');
      thumb.width=320;thumb.height=Math.max(1,Math.round(canvas.height/canvas.width*320));
      if(thumb.height>480){thumb.width=Math.max(1,Math.round(320*480/thumb.height));thumb.height=480;}
      thumb.getContext('2d').drawImage(canvas,0,0,thumb.width,thumb.height);
      const items=readGallery();
      items.unshift({thumb:thumb.toDataURL('image/png'),settings:portableSettings(),ts:Date.now()});
      localStorage.setItem(storageKey,JSON.stringify(items.slice(0,12)));
      loadGallery();status('Preview and settings saved on this device.');
    } catch(error) { status('Could not save preview: '+error.message); }
  };
  $('clearGallery').onclick=()=>{
    try {localStorage.removeItem(storageKey);loadGallery();status('Saved previews cleared.');}
    catch(error){status('Could not clear previews: '+error.message);}
  };
  if(location.hash.startsWith('#s=')) {
    try {
      const encoded=location.hash.slice(3);
      if(encoded.length>60000)throw Error('Link is too large.');
      const binary=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
      const saved=JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
      if(saved.version!==1 || !saved.settings || typeof saved.settings!=='object' || Array.isArray(saved.settings))throw Error('Invalid settings format.');
      // Keep preview safe on mobile, and do not replace the current brush mask.
      apply({...saved.settings,previewQuality:'auto'});
      status('Shared settings loaded. Import the source media separately.');
    } catch(error) {status('Could not load shared settings: '+error.message);}
  }
})();
