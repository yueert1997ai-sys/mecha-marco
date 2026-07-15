import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=path.join(root,'docs','qa-artifacts');
const candidates=[process.env.CHROME_PATH,process.env.CHROMIUM_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
const chrome=candidates.find(existsSync);
if(!chrome)throw new Error('Chrome/Chromium required for OG-04 scene audit');

const debugPort=19246,temp=mkdtempSync(path.join(root,'.og04-scene-browser-'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root)||!existsSync(file)){response.writeHead(404);response.end('Not found');return}
  response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});createReadStream(file).pipe(response);
});
const delay=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const waitForDebugger=async()=>{
  for(let attempt=0;attempt<80;attempt+=1){
    try{const pages=await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response)=>response.json());const page=pages.find((item)=>item.type==='page'&&item.url==='about:blank')||pages.find((item)=>item.type==='page'&&!item.url.startsWith('chrome-extension://'));if(page?.webSocketDebuggerUrl)return page.webSocketDebuggerUrl}catch{}
    await delay(100);
  }
  throw new Error('Chrome DevTools endpoint did not become ready');
};

class Cdp{
  constructor(url){this.socket=new WebSocket(url);this.id=0;this.pending=new Map();this.socket.onmessage=(event)=>{const message=JSON.parse(event.data);if(!message.id)return;const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result)};}
  ready(){return new Promise((resolve,reject)=>{this.socket.onopen=resolve;this.socket.onerror=reject});}
  call(method,params={}){const id=++this.id;this.socket.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));}
  close(){this.socket.close();}
}
const evaluate=async(cdp,expression)=>{const result=await cdp.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'Runtime evaluation failed');return result.result.value};
const setViewport=async(cdp,width,height)=>{await cdp.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height});await evaluate(cdp,"dispatchEvent(new Event('resize')); true");await delay(180)};
const capture=async(cdp,name,width,height)=>{
  await delay(100);
  const result=await cdp.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});const bytes=Buffer.from(result.data,'base64');
  if(!bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))throw new Error(`${name} is not PNG`);
  if(bytes.readUInt32BE(16)!==width||bytes.readUInt32BE(20)!==height)throw new Error(`${name} is not ${width}x${height}`);
  mkdirSync(artifacts,{recursive:true});writeFileSync(path.join(artifacts,name),bytes);
};
const captureCanvas=async(cdp,name,width,height)=>{
  const data=await evaluate(cdp,"document.getElementById('game-canvas').toDataURL('image/png')");
  const bytes=Buffer.from(data.replace(/^data:image\/png;base64,/,''),'base64');
  if(!bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))||bytes.readUInt32BE(16)!==width||bytes.readUInt32BE(20)!==height)throw new Error(`${name} Canvas snapshot is not ${width}x${height} PNG`);
  mkdirSync(artifacts,{recursive:true});writeFileSync(path.join(artifacts,name),bytes);
};
const render=`(()=>{const game=__MECHA_MARCO__.game;game.renderer.camera.x=.12;game.renderer.camera.y=game.room.stage42.centerY-1.05;game.ui.updateHud(game);game.render();if(globalThis.__MECH_3D_READY__!==false)__MECHA_MARCO__.mech3dRenderer()?.render(game);return game.og04SceneAudit44b})()`;
const resetFacilities=`(()=>{const game=__MECHA_MARCO__.game;game.facilities42.forEach((item)=>{item.dead=false;item.hp=item.maxHp;delete item.visualState44});game.run.exitOpen=false;delete game.og04SceneMissing44b;game.og04SceneQuality44b='high';return true})()`;

await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const child=spawn(chrome,['--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--no-first-run','--hide-scrollbars',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${temp}`,'--window-size=844,390','about:blank'],{stdio:'ignore'});
try{
  const cdp=new Cdp(await waitForDebugger());await cdp.ready();await cdp.call('Page.enable');await cdp.call('Runtime.enable');await setViewport(cdp,844,390);await cdp.call('Page.navigate',{url:`http://127.0.0.1:${port}/?smoke=1&screen=base`});
  for(let attempt=0;attempt<100;attempt+=1){
    if(await evaluate(cdp,"Boolean(globalThis.__MECHA_MARCO__?.game&&document.documentElement.dataset.smokeReady==='true')"))break;
    if(attempt===99)throw new Error('Game runtime did not become ready');await delay(100);
  }
  await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game;game.selectedMech='vanguard';game.startRun();game.startCampaignStage42(3,false);game.enemies.length=0;game.waveDelay=999;game.player.x=1.5;game.player.y=game.room.stage42.centerY;game.og04SceneMode44b='legacy';game.renderer.camera.x=.12;game.renderer.camera.y=game.room.stage42.centerY-1.05;game.render();__MECHA_MARCO__.mech3dRenderer()?.render(game);return true})()`);
  await delay(700);await evaluate(cdp,"['stage-banner42','campaign-comms42','toast'].forEach((id)=>{const element=document.getElementById(id);if(element){element.classList.remove('show');element.style.display='none'}}); true");await evaluate(cdp,render);await capture(cdp,'4.4B-og04-before-844x390.png',844,390);

  await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game;game.og04SceneMode44b='painterly';game.og04SceneQuality44b='high';return true})()`);
  for(let attempt=0;attempt<80;attempt+=1){const audit=await evaluate(cdp,render);if(audit?.status==='ready')break;if(attempt===79)throw new Error(`Scene assets did not become ready: ${JSON.stringify(audit)}`);await delay(100)}
  const highAudit=await evaluate(cdp,render);assertHighAudit(highAudit);await capture(cdp,'4.4B-og04-after-844x390.png',844,390);

  await setViewport(cdp,956,440);const wideAudit=await evaluate(cdp,render);assertHighAudit(wideAudit);await capture(cdp,'4.4B-og04-after-956x440.png',956,440);
  await setViewport(cdp,844,390);await evaluate(cdp,resetFacilities);await evaluate(cdp,render);await capture(cdp,'4.4B-og04-exit-closed-844x390.png',844,390);
  await evaluate(cdp,"__MECHA_MARCO__.game.run.exitOpen=true; true");await evaluate(cdp,render);await capture(cdp,'4.4B-og04-exit-open-844x390.png',844,390);

  await evaluate(cdp,"globalThis.__MECH_3D_READY__=false; __MECHA_MARCO__.game.og04SceneQuality44b='high'; document.getElementById('mech-3d-canvas').style.display='none'; true");
  for(const state of['intact','active','heavy-damage','destroyed']){
    await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game,target=game.facilities42[1];game.facilities42.forEach((item,index)=>{item.dead=index!==1;item.hp=item.dead?0:item.maxHp;item.visualState44=item.dead?'destroyed':'intact'});target.dead=${state==='destroyed'};target.hp=${state==='destroyed'?0:`target.maxHp*${state==='heavy-damage'?'.28':'1'}`};target.visualState44='${state}';game.run.exitOpen=false;return true})()`);
    await evaluate(cdp,render);await captureCanvas(cdp,`4.4B-og04-facility-${state}-844x390.png`,844,390);
  }

  await evaluate(cdp,"globalThis.__MECH_3D_READY__=true; document.getElementById('mech-3d-canvas').style.display='block'; true");await evaluate(cdp,resetFacilities);await evaluate(cdp,"__MECHA_MARCO__.game.og04SceneMissing44b='far'; true");const missingAudit=await evaluate(cdp,render);if(!missingAudit.fallbackRoles.includes('far')||missingAudit.forcedMissing!=='far')throw new Error(`Missing-asset fallback failed: ${JSON.stringify(missingAudit)}`);await capture(cdp,'4.4B-og04-missing-far-fallback-844x390.png',844,390);

  await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game;delete game.og04SceneMissing44b;game.og04SceneQuality44b='low';globalThis.__MECH_3D_READY__=false;document.getElementById('mech-3d-canvas').style.display='none';return true})()`);const lowAudit=await evaluate(cdp,render);if(lowAudit.tier!=='low'||lowAudit.renderedRoles.join(',')!=='background,far,playfield')throw new Error(`Low-tier Canvas fallback failed: ${JSON.stringify(lowAudit)}`);await captureCanvas(cdp,'4.4B-og04-low-tier-canvas-844x390.png',844,390);

  const evidence=await evaluate(cdp,"(()=>{const game=__MECHA_MARCO__.game;return{obstacles:game.og04SpatialEvidence44?.obstacles?.length,facilities:game.facilities42.length,canvasVisible:document.getElementById('game-canvas').getBoundingClientRect().width>0}})()");
  if(evidence.obstacles!==4||evidence.facilities!==3||!evidence.canvasVisible)throw new Error(`Gameplay readability evidence failed: ${JSON.stringify(evidence)}`);
  cdp.close();console.log('OG-04 painterly scene audit: two viewports, before/after, gate, four states, missing asset and Canvas low tier passed');
}finally{
  child.kill();await Promise.race([new Promise((resolve)=>child.once('close',resolve)),delay(1500)]);await new Promise((resolve)=>server.close(resolve));try{rmSync(temp,{recursive:true,force:true,maxRetries:4,retryDelay:150})}catch{}
}

function assertHighAudit(audit){
  const expected='background,far,mid,playfield,foreground,atmosphere';
  if(audit?.status!=='ready'||audit.manifestId!=='og04-painterly-44b'||audit.tier!=='high'||audit.renderedRoles.join(',')!==expected||audit.fallbackRoles.length||audit.assetFailures.length)throw new Error(`High-tier scene audit failed: ${JSON.stringify(audit)}`);
}
