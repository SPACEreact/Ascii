const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');

const base=path.resolve(__dirname,'..');
const mime={'.js':'application/javascript','.html':'text/html','.css':'text/css'};
const server=http.createServer((req,res)=>{
  const pathname=(new URL(req.url,'http://localhost')).pathname;
  const p=path.join(base,pathname==='/'?'index.html':pathname.slice(1));
  if(!p.startsWith(base+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end('not found');return}
  res.writeHead(200,{'content-type':mime[path.extname(p)]||'text/plain','cache-control':'no-store'});
  fs.createReadStream(p).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
  try{
    for(const [label,viewport] of [['mobile',{width:390,height:844}],['desktop',{width:1366,height:768}]]){
      const page=await browser.newPage({viewport,deviceScaleFactor:label==='mobile'?2:1,hasTouch:label==='mobile'});
      const errors=[];
      page.on('pageerror',e=>errors.push('PAGE_ERROR '+e.stack));
      page.on('console',msg=>{if(msg.type()==='error')errors.push('CONSOLE_ERROR '+msg.text())});
      page.on('response',r=>{if(r.status()>=400)errors.push('HTTP_ERROR '+r.status()+' '+r.url())});
      await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load'});
      await page.waitForTimeout(1000);
      let state=await page.evaluate(()=>({
        tabs:[...document.querySelectorAll('.tabs [data-tab]')].map(x=>x.dataset.tab),
        splitExists:!!document.querySelector('#panel-split'),
        splitDisabled:document.querySelector('#panel-split')?.hidden,
        ready:document.querySelector('#splitPosition')?.value,
        scripts:[...document.scripts].map(x=>x.src||'(inline)'),
        canvasSize:[document.querySelector('#out').width,document.querySelector('#out').height]
      }));
      console.log(label,'INITIAL',JSON.stringify(state));
      await page.locator('[data-tab="split"]').click();
      await page.waitForTimeout(400);
      state=await page.evaluate(()=>({
        panelHidden:document.querySelector('#panel-split')?.hidden,
        tabSelected:document.querySelector('[data-tab="split"]')?.classList.contains('selected'),
        panelRect:(()=>{let r=document.querySelector('#panel-split')?.getBoundingClientRect();return r&&{x:r.x,y:r.y,width:r.width,height:r.height}})(),viewportHeight:window.innerHeight
      }));
      console.log(label,'AFTER_CLICK',JSON.stringify(state));
      if(state.panelHidden||!state.tabSelected||!state.panelRect?.height)throw Error(label+' split tab did not open');
      if(label==='mobile' && (state.panelRect.y<0 || state.panelRect.y>state.viewportHeight-140))throw Error('mobile split controls not visible in viewport');
      await page.locator('#splitEnabled').check();
      await page.locator('#splitStyle').selectOption('retro');
      await page.locator('#splitPosition').evaluate(el=>{el.value='0.38';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});
      await page.waitForTimeout(350);
      console.log(label,'AFTER_ENABLE',JSON.stringify(await page.evaluate(()=>({
        enabled:document.querySelector('#splitEnabled').checked,
        style:document.querySelector('#splitStyle').value,
        handleHidden:document.querySelector('.split-handle').hidden,
        info:document.querySelector('#splitStatus').textContent
      }))));

      // New creative masks: verify all modes, live brush input, and project undo.
      if(!await page.locator('#maskMode').count())throw Error(label+' creative mask UI missing');
      await page.locator('#maskMode').selectOption('organic');
      let maskState=await page.evaluate(()=>({
        organicVisible:!document.querySelector('#maskOrganicGroup').hidden,
        mode:document.querySelector('#maskMode').value,
        canvas:document.querySelector('#out').width
      }));
      if(!maskState.organicVisible||maskState.mode!=='organic')throw Error(label+' organic mask controls missing');
      await page.locator('#maskReroll').click();
      await page.locator('#maskMode').selectOption('contrast');
      maskState=await page.evaluate(()=>({
        contrastVisible:!document.querySelector('#maskContrastGroup').hidden,
        mode:document.querySelector('#maskMode').value
      }));
      if(!maskState.contrastVisible)throw Error(label+' contrast mask controls missing');
      await page.locator('#maskMode').selectOption('hybrid');
      await page.locator('#maskHybridBase').selectOption('organic');
      const artwork=page.locator('#out');
      await artwork.scrollIntoViewIfNeeded();
      let bounds=await artwork.boundingBox();
      if(!bounds)throw Error(label+' artwork missing');
      await page.mouse.move(bounds.x+bounds.width*.3,bounds.y+bounds.height*.4);
      await page.mouse.down();
      await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.53,{steps:7});
      await page.mouse.up();
      maskState=await page.evaluate(()=>({
        mode:document.querySelector('#maskMode').value,
        strokes:snapshot()._maskStrokes?.length||0,
        eraser:document.querySelector('#maskErase').classList.contains('mask-current'),
        panelHidden:document.querySelector('#panel-split').hidden,
        message:document.querySelector('#maskMessage').textContent
      }));
      console.log(label,'MASK_CHECK',JSON.stringify(maskState));
      if(maskState.strokes!==1||maskState.panelHidden)throw Error(label+' paint stroke not saved');
      await page.locator('#maskErase').click();
      if(!await page.locator('#maskErase').evaluate(el=>el.classList.contains('mask-current')))
        throw Error(label+' eraser not active');
      await page.locator('#maskClear').click();
      if(await page.evaluate(()=>snapshot()._maskStrokes?.length))throw Error(label+' brush clear failed');

      if(errors.length)throw Error(label+' browser issues:\n'+errors.join('\n'));
      await page.close();
    }
    console.log('PASS both phone and desktop tab opening + split controls');
  }finally{await browser.close();}
})().catch(e=>{console.error('SMOKE FAILED',e);process.exitCode=1}).finally(()=>server.close());
