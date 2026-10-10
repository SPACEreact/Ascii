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
        panelRect:(()=>{let r=document.querySelector('#panel-split')?.getBoundingClientRect();return r&&{x:r.x,y:r.y,width:r.width,height:r.height}})()
      }));
      console.log(label,'AFTER_CLICK',JSON.stringify(state));
      if(state.panelHidden||!state.tabSelected||!state.panelRect?.height)throw Error(label+' split tab did not open');
      await page.locator('#splitEnabled').check();
      await page.locator('#splitStyle').selectOption('retro');
      await page.locator('#splitPosition').fill('0.38');
      await page.waitForTimeout(350);
      console.log(label,'AFTER_ENABLE',JSON.stringify(await page.evaluate(()=>({
        enabled:document.querySelector('#splitEnabled').checked,
        style:document.querySelector('#splitStyle').value,
        handleHidden:document.querySelector('.split-handle').hidden,
        info:document.querySelector('#splitStatus').textContent
      }))));
      if(errors.length)throw Error(label+' browser issues:\n'+errors.join('\n'));
      await page.close();
    }
    console.log('PASS both phone and desktop tab opening + split controls');
  }finally{await browser.close();}
})().catch(e=>{console.error('SMOKE FAILED',e);process.exitCode=1}).finally(()=>server.close());
