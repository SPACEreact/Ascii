const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
require('./print-effects.cjs');require('./sea-effects.cjs');
const base=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,p=path.join(base,pathname==='/'?'index.html':pathname.slice(1));if(!p.startsWith(base+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':p.endsWith('.js')?'application/javascript':'text/html','cache-control':'no-store'});fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const [label,viewport] of [['mobile',{width:390,height:844}],['desktop',{width:1366,height:768}]]){
 const page=await browser.newPage({viewport,acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))errors.push(r.status()+' '+r.url())});
 // Font network availability must not affect tests or core functionality.
 await page.route('https://fonts.googleapis.com/**',route=>route.abort());await page.route('https://fonts.gstatic.com/**',route=>route.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load'});
 assert.deepEqual(await page.locator('.tabs [data-tab]').evaluateAll(bs=>bs.map(b=>b.dataset.tab)),['sea','settings','export']);
 assert.equal(await page.locator('[data-sea]').count(),20);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow');
 await page.evaluate(()=>{restore({...snapshot(),cols:80,seaEffect:'none',seaIntensity:.65,glow:0,shader:'none',trail:0,crtMaster:false});pause();render(1,480,true);window.referenceImage=out.toDataURL();window.referenceCells=JSON.stringify(lastCells);});
 for(const id of await page.evaluate(()=>ASCIISeaGlass.effects.map(f=>f[0]))){
  const result=await page.evaluate(id=>{restore({...snapshot(),seaEffect:id});render(id==='pulse'?.35:1,480,true);const changed=out.toDataURL()!==window.referenceImage;restore({...snapshot(),seaIntensity:0});render(1,480,true);const cellsSame=JSON.stringify(lastCells)===window.referenceCells;restore({...snapshot(),seaIntensity:.65});return{changed,cellsSame};},id);
  assert(result.cellsSame,id+' zero intensity altered source glyphs');if(!['none','magnet'].includes(id))assert(result.changed,id+' did not reach export canvas');
 }
 await page.locator('[data-sea="ocean"]').click();
 await page.evaluate(()=>{pause();window.pausedFrame=frame;});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>frame),await page.evaluate(()=>window.pausedFrame));
 await page.locator('#play').click();await page.waitForTimeout(300);assert(await page.evaluate(()=>frame>window.pausedFrame));await page.locator('#play').click();
 // Pointer engine must respond on the artboard without reactivating masking.
 await page.evaluate(()=>{restore({...snapshot(),seaEffect:'magnet'});render(1,480,true);window.magnetBefore=out.toDataURL();});
 await page.locator('#out').scrollIntoViewIfNeeded();const bounds=await page.locator('#out').boundingBox();await page.mouse.move(bounds.x+bounds.width*.48,bounds.y+bounds.height*.5);
 assert(await page.evaluate(()=>{render(1,480,true);return out.toDataURL()!==window.magnetBefore;}));
 await page.locator('[data-tab="settings"]').click();assert(await page.locator('#panel-settings').isVisible());assert(await page.locator('#seaRamp').isVisible());
 await page.locator('#seaRamp').selectOption('4');assert((await page.locator('#ramp').inputValue()).includes('अ'));
 await page.locator('#font').selectOption('system-ui, sans-serif',{force:true});
 await page.evaluate(()=>{restore({...snapshot(),sequence:true,splitEnabled:true,motion:'disc'});});
 assert.deepEqual(await page.evaluate(()=>[settings().sequence,settings().splitEnabled,settings().motion]),[false,false,'none']);
 await page.locator('#reset').click();assert.equal(await page.locator('#seaEffect').inputValue(),'none');assert.equal(await page.locator('[data-sea="none"]').getAttribute('aria-pressed'),'true');
 // Real image upload and full-size PNG export.
 const bytes=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=64;c.height=64;const q=c.getContext('2d');q.fillStyle='#061320';q.fillRect(0,0,64,64);q.fillStyle='#5eead4';q.beginPath();q.ellipse(32,32,23,15,.4,0,Math.PI*2);q.fill();return c.toDataURL().split(',')[1];});
 await page.locator('#mediaFile').setInputFiles({name:'test-art.png',mimeType:'image/png',buffer:Buffer.from(bytes,'base64')});await page.waitForFunction(()=>type==='image');
 assert.equal(await page.evaluate(()=>settings().motion),'none');
 await page.locator('[data-tab="export"]').click();await page.locator('#exportWidth').selectOption('1280');
 const downloadPromise=page.waitForEvent('download');await page.locator('#panel-export button.primary').first().click();const download=await downloadPromise;const png=fs.readFileSync(await download.path());assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),1280);
 await page.locator('[data-tab="sea"]').click();await page.locator('#panel-sea>details').last().locator('summary').click();await page.locator('#printStyle').selectOption('atkinson');
 assert(await page.evaluate(()=>{render(0,480,true);return out.toDataURL().length>1000;}));
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS',label,'3-tab redesign, 20 export engines, controls, Pause, pointer, upload, PNG, Print');await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
